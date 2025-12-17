'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface RequestData {
  requestId: string;
  clientName: string;
  service: string;
  price: string;
  time: string;
  description?: string;
}

  export function RequestPopup() {
  const { data: session } = useSession();
  const { socket } = useWebSocket();
  const [activeRequest, setActiveRequest] = useState<RequestData | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
    const [status, setStatus] = useState<'new' | 'waiting' | 'confirmed' | 'rejected'>('new');
    const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
    const router = useRouter();

    const goToChat = () => {
      if (confirmedBookingId) {
        localStorage.setItem('chatBookingId', confirmedBookingId);
        router.push(`/business/dashboard?tab=bookings&chatBookingId=${confirmedBookingId}`);
      } else {
        router.push('/business/dashboard?tab=bookings');
      }
      localStorage.removeItem('pendingRequest');
      setConfirmedBookingId(null);
      setActiveRequest(null); // Close the popup
      setStatus('new');
    };

  const handleAccept = React.useCallback(() => {
    socket?.emit('business_response', {
      requestId: activeRequest?.requestId,
      action: 'accept'
    });
    // Optimistic update
    setStatus('waiting');
  }, [socket, activeRequest]);

  const handleReject = React.useCallback(() => {
    socket?.emit('business_response', {
      requestId: activeRequest?.requestId,
      action: 'reject'
    });
    setActiveRequest(null);
    localStorage.removeItem('pendingRequest');
  }, [socket, activeRequest]);

  const handleClose = () => {
    setActiveRequest(null);
    localStorage.removeItem('pendingRequest');
    setStatus('new');
  };

  useEffect(() => {
    if (!socket || session?.user?.role !== 'BUSINESS') return;

    socket.on('new_request', (request: RequestData) => {
      setActiveRequest(request);
      setTimeLeft(120);
      setStatus('new');
      localStorage.setItem('pendingRequest', JSON.stringify(request));
      
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Booking Request!', {
            body: `${request.clientName} wants ${request.service} - ${request.price}`,
            icon: '/icon-192x192.png'
          });
        }
    });

    socket.on('response_recorded', () => {
        setStatus('waiting');
    });

    socket.on('booking_confirmed', ({ bookingId }) => {
        setStatus('confirmed');
        setConfirmedBookingId(bookingId);
    });

    socket.on('request_taken', ({ requestId }) => {
      if (activeRequest?.requestId === requestId && status !== 'confirmed') {
        setStatus('rejected');
      }
    });

    socket.on('response_success', ({ bookingId }) => {
        // Legacy handler, just in case
        if (bookingId) setStatus('confirmed');
    });

    return () => {
      socket.off('new_request');
      socket.off('request_taken');
      socket.off('response_success');
      socket.off('response_recorded');
      socket.off('booking_confirmed');
    };
  }, [socket, session, activeRequest, status]);

  // ... (timer effect remains same)

  if (!activeRequest) return null;
  
  // Close on click outside if rejected
  if (status === 'rejected') {
     return (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer" onClick={handleClose}>
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Request Taken</h3>
                <p className="text-gray-500">Another business was selected by the client.</p>
                <p className="text-xs text-gray-400 mt-4">(Click anywhere to dismiss)</p>
            </div>
        </div>
     );
  }

  if (status === 'confirmed') {
     return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl animate-[confetti_0.5s_ease-out]">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <span className="text-4xl">🎉</span>
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-600 mb-6">The client selected your offer. You can now chat with them.</p>
                <button 
                    onClick={goToChat}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                    💬 Go to Chat
                </button>
            </div>
        </div>
     );
  }
  
  if (status === 'waiting') {
      return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Offer Sent!</h3>
                <p className="text-gray-600">Waiting for client to confirm...</p>
            </div>
        </div>
      );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Render Original 'new' state popup
  return (
    // ... (Keep existing JSX for the main popup)

      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl transform transition-all duration-300 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white p-8 rounded-t-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            
            <div className="relative flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold mb-1">🔔 New Booking Request</h3>
                <p className="text-white/90 text-sm font-medium">
                  Respond within {minutes}:{seconds.toString().padStart(2, '0')} minutes
                </p>
              </div>
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="white"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(timeLeft / 120) * 176} 176`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {timeLeft}s
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-center space-x-4 bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-3xl shadow-lg">
                👤
              </div>
              <div>
                <p className="font-bold text-lg text-gray-800">{activeRequest.clientName}</p>
                <p className="text-sm text-gray-500">ID: {activeRequest.requestId.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5 space-y-3 border border-orange-100">
              <div className="flex justify-between items-center pb-3 border-b border-orange-200">
                <span className="text-gray-600 font-medium">Service:</span>
                <span className="font-semibold text-gray-800">{activeRequest.service}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-orange-200">
                <span className="text-gray-600 font-medium">Offered Price:</span>
                <span className="font-bold text-green-600 text-2xl">{activeRequest.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Preferred Time:</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {new Date(activeRequest.time).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {activeRequest.description && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Additional Notes</p>
                <p className="text-sm text-gray-700">{activeRequest.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button 
                onClick={handleReject}
                className="py-4 px-5 bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold shadow-sm hover:shadow-md"
              >
                ❌ Reject
              </button>
              <button 
                onClick={handleAccept}
                className="py-4 px-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
              >
                ✅ Accept
              </button>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    );
}
