import { prisma } from '@/lib/prisma';

export async function updateRatingAggregates(userId: string) {
    try {
        const aggregate = await prisma.rating.aggregate({
            where: {
                rateeId: userId
            },
            _avg: {
                rating: true
            },
            _count: {
                rating: true
            }
        });

        const avgRating = aggregate._avg.rating || 0;
        const totalRatings = aggregate._count.rating || 0;

        await prisma.user.update({
            where: { id: userId },
            data: {
                avgRating,
                totalRatings
            }
        });

        // Also update Business table if applicable for backward compatibility or display
        const business = await prisma.business.findUnique({
            where: { userId }
        });

        if (business) {
            await prisma.business.update({
                where: { id: business.id },
                data: {
                    averageRating: avgRating,
                    totalReviews: totalRatings
                }
            });
        }

        return { avgRating, totalRatings };
    } catch (error) {
        console.error(`[RatingCalculator] Failed to update aggregates for ${userId}:`, error);
        throw error;
    }
}
