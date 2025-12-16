import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { prisma } from './src/lib/prisma.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.handshake.auth;
    
    if (!userId || !role) {
      socket.disconnect();
      return;
    }

    socket.join(role === 'CLIENT' ? `client:${userId}` : `business:${userId}`);
    console.log(`[WebSocket] ${role} ${userId} connected`);

        socket.on('quickfind_search', async (criteria) => {
          try {
            console.log('[WebSocket] QuickFind search:', criteria);
            const matches = await prisma.business.findMany({
              where: {
                categoryId: criteria.categoryId,
                services: {
                  some: {
                    price: { lte: criteria.maxPrice },
                    isActive: true
                  }
                }
              },
              include: {
                category: true,
                services: {
                  where: {
                    isActive: true
                  },
                  orderBy: {
                    price: 'asc'
                  },
                  take: 1
                }
              },
              take: 20
            });

            console.log('[WebSocket] Found matches:', matches.length);
            socket.emit('quickfind_results', matches);
          } catch (error) {
            console.error('[WebSocket] QuickFind error:', error);
            socket.emit('quickfind_error', { message: 'Search failed' });
          }
        });

    socket.on('booking_request', async (requestData) => {
      try {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 2);

        const request = await prisma.bookingRequest.create({
          data: {
            clientId: userId,
            categoryId: requestData.categoryId,
            description: requestData.description || '',
            offeredPrice: requestData.offeredPrice,
            requestedTime: new Date(requestData.requestedTime),
            expiresAt,
            status: 'PENDING'
          },
          include: {
            client: {
              select: { name: true }
            },
            category: {
              select: { nameEn: true }
            }
          }
        });

          const matchingBusinesses = await prisma.business.findMany({
            where: {
              categoryId: requestData.categoryId,
              services: {
                some: {
                  isActive: true
                }
              }
            },
            select: { userId: true }
          });

          matchingBusinesses.forEach(business => {
            io.to(`business:${business.userId}`).emit('new_request', {
              requestId: request.id,
              clientName: request.client.name,
              service: request.category.nameEn,
              price: (request.offeredPrice / 100).toFixed(2) + ' MAD',
              time: request.requestedTime,
              description: request.description
            });
        });

        socket.emit('request_created', { requestId: request.id });
      } catch (error) {
        console.error('[WebSocket] Booking request error:', error);
        socket.emit('request_error', { message: 'Request failed' });
      }
    });

      socket.on('business_response', async ({ requestId, action }) => {
        try {
            const request = await prisma.bookingRequest.findUnique({
              where: { id: requestId },
              include: { client: true }
            });

            if (!request || request.status !== 'PENDING') {
              socket.emit('response_error', { message: 'Request already processed' });
              return;
            }

            if (action === 'accept') {
              const business = await prisma.business.findFirst({
                where: { userId },
                include: { services: { take: 1, orderBy: { price: 'asc' } } }
              });

              if (!business) {
                socket.emit('response_error', { message: 'Business not found' });
                return;
              }

              // Update BusinessRequestView to indicate interest
              await prisma.businessRequestView.upsert({
                  where: {
                    businessId_requestId: {
                      businessId: business.id,
                      requestId
                    }
                  },
                  create: {
                    businessId: business.id,
                    requestId,
                    status: 'ACCEPTED'
                  },
                  update: {
                    status: 'ACCEPTED'
                  }
              });

              // Notify client that this business offered
              const service = business.services[0];
              io.to(`client:${request.clientId}`).emit('request_offered', {
                businessId: business.id,
                businessName: business.name,
                address: business.address,
                lat: business.lat,
                lng: business.lng,
                price: (request.offeredPrice / 100).toFixed(2),
                logoUrl: business.logoUrl,
                requestId
              });

              socket.emit('response_recorded', { 
                message: 'Offer sent! Waiting for client confirmation...',
                status: 'accepted_waiting'
              });

            } else {
              const business = await prisma.business.findFirst({
                where: { userId }
              });

              if (business) {
                await prisma.businessRequestView.upsert({
                  where: {
                    businessId_requestId: {
                      businessId: business.id,
                      requestId
                    }
                  },
                  create: {
                    businessId: business.id,
                    requestId,
                    status: 'REJECTED'
                  },
                  update: {
                    status: 'REJECTED'
                  }
                });
              }

              socket.emit('response_success', { message: 'Request rejected' });
            }
        } catch (error) {
          console.error('[WebSocket] Business response error:', error);
          socket.emit('response_error', { message: 'Response failed' });
        }
      });

      socket.on('confirm_booking', async ({ requestId, businessId }) => {
        try {
           const request = await prisma.bookingRequest.findUnique({
              where: { id: requestId },
              include: { client: true }
           });

           if (!request || request.status !== 'PENDING') {
              socket.emit('booking_error', { message: 'Request already completed' });
              return;
           }

           const business = await prisma.business.findUnique({
              where: { id: businessId },
              include: { services: { take: 1, orderBy: { price: 'asc' } } }
           });

           if (!business) {
              socket.emit('booking_error', { message: 'Business not found' });
              return;
           }

           // Update BookingRequest
           await prisma.bookingRequest.update({
              where: { id: requestId },
              data: { 
                status: 'ACCEPTED',
                acceptedBy: businessId
              }
           });

           // Create Booking
           const service = business.services[0];
           const booking = await prisma.booking.create({
                data: {
                  clientId: request.clientId,
                  businessId: business.id,
                  serviceId: service?.id || null,
                  date: request.requestedTime,
                  time: new Date(request.requestedTime).toTimeString().slice(0, 5),
                  status: 'CONFIRMED',
                  totalPrice: request.offeredPrice,
                  notes: request.description || 'Quick Find booking'
                }
           });

           // Notify Winner Business
           io.to(`business:${business.userId}`).emit('booking_confirmed', {
              bookingId: booking.id,
              requestId
           });

           // Notify Client
           socket.emit('booking_confirmed', {
              bookingId: booking.id,
              businessId: business.id
           });

           // Notify other businesses (Request Taken)
           // Find all businesses that viewed/accepted this request
           const views = await prisma.businessRequestView.findMany({
              where: { requestId },
              include: { business: true }
           });
           
           views.forEach(view => {
              if (view.businessId !== businessId) {
                  io.to(`business:${view.business.userId}`).emit('request_taken', { requestId, businessId });
              }
           });

        } catch (error) {
           console.error('[WebSocket] Confirm booking error:', error);
           socket.emit('booking_error', { message: 'Booking failed' });
        }
      });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] ${role} ${userId} disconnected`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/socket`);
    });
});
