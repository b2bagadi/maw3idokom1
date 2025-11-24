"use client";

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';

export function BusinessSettings() {
  const t = useTranslations('dashboard');
  const tOnboard = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    businessName: 'Demo Salon & Spa',
    businessEmail: 'contact@demosalon.com',
    businessPhone: '+1 234 567 8900',
    businessAddress: '123 Main St, City, Country',
    descriptionEn: 'Premium beauty and wellness services',
    descriptionFr: 'Services de beauté et de bien-être premium',
    descriptionAr: 'خدمات تجميل وعافية متميزة',
  });

  const bookingLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/demo`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    // TODO: API integration
    console.log('Save settings:', formData);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">{t('businessSettings')}</h3>
        <p className="text-muted-foreground">Manage your business information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('bookingLink')}</CardTitle>
          <CardDescription>Share this link with your customers to book appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={bookingLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('linkCopied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('copyLink')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{tOnboard('businessName')}</Label>
              <Input
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>
            <div>
              <Label>{tOnboard('businessEmail')}</Label>
              <Input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{tOnboard('businessPhone')}</Label>
              <Input
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
              />
            </div>
            <div>
              <Label>{tOnboard('businessAddress')}</Label>
              <Input
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>{tOnboard('businessDescription')}</Label>
            <Tabs defaultValue="en" className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="fr">Français</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="mt-2">
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  rows={4}
                />
              </TabsContent>
              <TabsContent value="fr" className="mt-2">
                <Textarea
                  value={formData.descriptionFr}
                  onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                  rows={4}
                />
              </TabsContent>
              <TabsContent value="ar" className="mt-2">
                <Textarea
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  rows={4}
                  dir="rtl"
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              {tCommon('save')} {tCommon('settings')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
