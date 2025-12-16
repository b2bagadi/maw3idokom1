import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const registerClientSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(8, 'Phone number is required'),
});

export const registerBusinessSchema = z.object({
    // User info
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),

    // Business info
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    category: z.string().min(1, 'Category is required'),
    address: z.string().min(5, 'Address is required'),
    phone: z.string().min(8, 'Phone number is required'),

    // Location (optional initially, but good to have validation)
    lat: z.number().optional(),
    lng: z.number().optional(),
});
