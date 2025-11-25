"use client";

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Calendar, Users, Clock, Globe, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const t = useTranslations();
  const [logoUrl, setLogoUrl] = useState('');
  const [siteName, setSiteName] = useState('Maw3idokom');

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = data.logoUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = data.logoUrl;
            document.head.appendChild(newLink);
          }
        }
        if (data.siteName) setSiteName(data.siteName);
      }
    } catch (error) {
      console.error('Failed to fetch global settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-fade-in sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-16 w-16 object-contain animate-scale-in transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section - Remade */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Text with Animations */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[oklch(0.25_0.08_250)] via-[oklch(0.65_0.12_190)] to-[oklch(0.65_0.15_25)] bg-clip-text text-transparent animate-[fade-in_1s_ease-out,scale-in_1s_ease-out] transition-transform duration-300 hover:scale-105">
              {t('landing.hero')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground animate-[fade-in_1s_ease-out_0.3s_backwards,slide-up_1s_ease-out_0.3s_backwards]">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* Hero Buttons with Animations */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-6 animate-[fade-in_1s_ease-out_0.6s_backwards]">
            {/* Join Maw3idokom Button */}
            <Link 
              href="/business/signup" 
              className="inline-flex items-center justify-center w-full sm:w-auto text-lg px-12 py-7 font-bold rounded-lg bg-gradient-to-r from-[oklch(0.25_0.08_250)] via-[oklch(0.65_0.12_190)] to-[oklch(0.65_0.15_25)] text-white hover:shadow-2xl hover:opacity-90 transition-all duration-300 cursor-pointer group relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <Sparkles className="h-6 w-6 animate-spin mr-3" style={{ animationDuration: '4s' }} />
              <span>{t('landing.joinButton')}</span>
              <Sparkles className="h-6 w-6 animate-spin ml-3" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
            </Link>

            {/* Login Button */}
            <Link 
              href="/business/login" 
              className="inline-flex items-center justify-center w-full sm:w-auto text-lg px-12 py-7 font-bold rounded-lg bg-gradient-to-r from-[oklch(0.65_0.12_190)] to-[oklch(0.55_0.15_145)] text-white hover:shadow-2xl hover:opacity-90 transition-all duration-300 cursor-pointer group relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <span>Login</span>
            </Link>

            {/* Book Now Button */}
            <Link 
              href="/book/demo" 
              className="inline-flex items-center justify-center w-full sm:w-auto text-lg px-12 py-7 font-bold rounded-lg bg-gradient-to-r from-[oklch(0.55_0.15_145)] to-[oklch(0.70_0.12_75)] text-white hover:shadow-2xl hover:opacity-90 transition-all duration-300 cursor-pointer group relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <Calendar className="h-6 w-6 mr-3 transition-transform duration-300 group-hover:rotate-12" />
              <span>{t('landing.tryDemo')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-fade-in">
          {t('landing.features')}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="transition-all duration-300 hover:shadow-2xl animate-slide-up border-2 hover:border-primary/50" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <Globe className="h-12 w-12 mb-4 text-secondary" />
              <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('landing.trilingualTitle')}
              </CardTitle>
              <CardDescription>
                {t('landing.trilingualDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-2xl animate-slide-up border-2 hover:border-secondary/50" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <Calendar className="h-12 w-12 mb-4 text-primary" />
              <CardTitle className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                {t('landing.schedulingTitle')}
              </CardTitle>
              <CardDescription>
                {t('landing.schedulingDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-2xl animate-slide-up border-2 hover:border-accent/50" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-accent" />
              <CardTitle className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                {t('landing.staffTitle')}
              </CardTitle>
              <CardDescription>
                {t('landing.staffDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-2xl animate-slide-up border-2 hover:border-primary/50" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <Clock className="h-12 w-12 mb-4 text-primary" />
              <CardTitle className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('landing.availabilityTitle')}
              </CardTitle>
              <CardDescription>
                {t('landing.availabilityDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-2xl animate-slide-up border-2 hover:border-secondary/50" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CheckCircle className="h-12 w-12 mb-4 text-secondary" />
              <CardTitle className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                {t('landing.bookingTitle')}
              </CardTitle>
              <CardDescription>
                {t('landing.bookingDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-2xl animate-slide-up border-2 hover:border-accent/50" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <TrendingUp className="h-12 w-12 mb-4 text-accent" />
              <CardTitle className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                {t('landing.analyticsTitle')}
              </CardTitle>
              <CardDescription>
                {t('landing.analyticsDesc')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 animate-fade-in">
        <Card className="bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground transition-all duration-300 hover:shadow-2xl overflow-hidden">
          <div className="absolute inset-0 animate-shimmer"></div>
          <CardHeader className="text-center space-y-4 relative z-10">
            <CardTitle className="text-3xl md:text-4xl">{t('landing.ctaTitle')}</CardTitle>
            <CardDescription className="text-primary-foreground/90 text-lg">
              {t('landing.ctaSubtitle')}
            </CardDescription>
            <div className="pt-4">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="transition-colors duration-200 hover:shadow-xl">
                <Link href="/business/signup">{t('landing.ctaButton')}</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20 bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>{t('landing.footer')}</p>
        </div>
      </footer>
    </div>
  );
}