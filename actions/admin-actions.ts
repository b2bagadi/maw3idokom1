'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Check if user is Super Admin
async function checkSuperAdmin() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Super Admin access required');
    }
    return session;
}

// ============ USER MANAGEMENT ============

export async function getUsersForAdmin() {
    await checkSuperAdmin();
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            role: true,
            isBanned: true,
            createdAt: true,
        },
    });
    return users;
}

export async function updateUser(userId: string, data: { username?: string; email?: string; name?: string }) {
    await checkSuperAdmin();
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
    });
    revalidatePath('/admin/users');
    return updatedUser;
}

export async function changeUserPassword(userId: string, newPassword: string) {
    await checkSuperAdmin();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });
    revalidatePath('/admin/users');
    return { success: true };
}

export async function banUser(userId: string) {
    await checkSuperAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: { isBanned: true },
    });
    revalidatePath('/admin/users');
    return { success: true };
}

export async function unbanUser(userId: string) {
    await checkSuperAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: { isBanned: false },
    });
    revalidatePath('/admin/users');
    return { success: true };
}

// ============ BUSINESS MANAGEMENT ============

export async function getBusinessesForAdmin() {
    await checkSuperAdmin();
    const businesses = await prisma.business.findMany({
        include: {
            owner: {
                select: {
                    username: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    services: true,
                    bookings: true,
                    reviews: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return businesses;
}

export async function verifyBusiness(businessId: string) {
    await checkSuperAdmin();
    await prisma.business.update({
        where: { id: businessId },
        data: { verified: true },
    });
    revalidatePath('/admin/businesses');
    return { success: true };
}

export async function suspendBusiness(businessId: string) {
    await checkSuperAdmin();
    await prisma.business.update({
        where: { id: businessId },
        data: { suspended: true },
    });
    revalidatePath('/admin/businesses');
    return { success: true };
}

export async function deleteBusiness(businessId: string) {
    await checkSuperAdmin();
    await prisma.business.delete({
        where: { id: businessId },
    });
    revalidatePath('/admin/businesses');
    return { success: true };
}

// ============ BOOKING MANAGEMENT ============

export async function getBookingsForAdmin() {
    await checkSuperAdmin();
    const bookings = await prisma.booking.findMany({
        include: {
            customer: {
                select: { username: true, email: true },
            },
            business: {
                select: { name: true },
            },
            service: {
                select: { name: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return bookings;
}

export async function forceUpdateBooking(bookingId: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') {
    await checkSuperAdmin();
    await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
    });
    revalidatePath('/admin/bookings');
    return { success: true };
}

// ============ REVIEW MANAGEMENT ============

export async function getReviewsForAdmin() {
    await checkSuperAdmin();
    const reviews = await prisma.review.findMany({
        include: {
            customer: {
                select: { username: true },
            },
            business: {
                select: { name: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return reviews;
}

export async function deleteReview(reviewId: string) {
    await checkSuperAdmin();
    await prisma.review.delete({
        where: { id: reviewId },
    });
    revalidatePath('/admin/reviews');
    return { success: true };
}

// ============ ADMIN PROFILE MANAGEMENT ============

export async function updateAdminProfile(currentUsername: string, newUsername: string, newPassword?: string) {
    const session = await checkSuperAdmin();

    const updateData: any = { username: newUsername };

    if (newPassword) {
        updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
        where: { username: currentUsername },
        data: updateData,
    });

    revalidatePath('/admin/settings');
    return { success: true, username: updatedUser.username };
}
