import { Navbar } from '@/components/Navbar';
import { HeroSearch } from '@/components/HeroSearch';
import { CategoryPills } from '@/components/CategoryPills';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <div className="min-h-screen">
            <Navbar locale={locale} />

            {/* Hero Section */}
            <HeroSearch locale={locale} />

            {/* Category Navigation */}
            <CategoryPills locale={locale} />

            {/* Featured Businesses */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold mb-8">Featured Businesses</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Business Card Example */}
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div
                            className="h-48 bg-cover bg-center"
                            style={{
                                backgroundImage:
                                    "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800')",
                            }}
                        />
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">Luxury Beauty Salon</CardTitle>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        Paris, France
                                    </p>
                                </div>
                                <Badge variant="secondary">✂️ Beauty</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="ml-1 font-semibold">5.0</span>
                                </div>
                                <span className="text-sm text-muted-foreground">(24 reviews)</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                Premium beauty services in the heart of the city. Expert stylists and
                                top-quality products.
                            </p>
                            <Link href={`/${locale}/business/luxury-beauty-salon`}>
                                <Button className="w-full">View Details</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Add more placeholder cards */}
                    {[1, 2].map((i) => (
                        <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400" />
                            <CardHeader>
                                <CardTitle className="text-xl">Coming Soon</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    More amazing businesses will be listed here soon!
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🔍</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">1. Search</h3>
                            <p className="text-muted-foreground">
                                Find the perfect service provider near you
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📅</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">2. Book</h3>
                            <p className="text-muted-foreground">
                                Choose your preferred date and time
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✨</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">3. Enjoy</h3>
                            <p className="text-muted-foreground">
                                Show up and enjoy your appointment
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-muted-foreground">
                        © 2024 Maw3idokom. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
