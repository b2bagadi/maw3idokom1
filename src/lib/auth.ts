import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import * as bcrypt from 'bcrypt';
import { prisma } from './prisma';

const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Rate Limiting Logic
                const ip = "127.0.0.1"; // simplified, would need request context to get real IP
                const now = Date.now();
                const record = rateLimitMap.get(ip) || { count: 0, lastAttempt: 0 };

                // Decay bucket (reset after 15 mins)
                if (now - record.lastAttempt > 15 * 60 * 1000) {
                    record.count = 0;
                }

                if (record.count >= 5) {
                    // Blocked
                    throw new Error("Too many login attempts. Please try again later.");
                }

                record.lastAttempt = now;
                record.count++;
                rateLimitMap.set(ip, record);

                // Check for admin credentials (Database based now preferred over env for updates)
                // First check DB for admin user
                const adminUser = await prisma.user.findFirst({
                    where: { role: 'ADMIN', email: credentials.email }
                });

                if (adminUser) {
                    const match = await bcrypt.compare(credentials.password, adminUser.password);
                    if (match) {
                        // Reset rate limit on success
                        rateLimitMap.delete(ip);
                        return {
                            id: adminUser.id,
                            email: adminUser.email,
                            name: adminUser.name,
                            role: adminUser.role,
                            isActive: adminUser.isActive,
                        };
                    }
                }
                // Fallback to Env if DB admin not found (Bootstrap)
                else if (
                    credentials.email === process.env.ADMIN_EMAIL &&
                    credentials.password === process.env.ADMIN_PASSWORD
                ) {
                    // ... (existing bootstrap logic)
                    // Reset rate limit on success
                    rateLimitMap.delete(ip);
                    // ...
                }

                // Regular User Auth
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        business: true,
                    },
                });

                if (!user) {
                    return null;
                }

                // ...

                const passwordMatch = await bcrypt.compare(credentials.password, user.password);

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isActive: user.isActive,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.isActive = user.isActive;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.isActive = token.isActive as boolean;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
