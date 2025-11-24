"use client";

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, MessageCircle } from 'lucide-react';

interface StepTwoProps {
  formData: any;
  updateFormData: (data: any) => void;
}

export function StepTwo({ formData, updateFormData }: StepTwoProps) {
  const t = useTranslations('onboarding');

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="businessName">{t('businessName')}</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => updateFormData({ businessName: e.target.value })}
            placeholder="My Business"
          />
        </div>

        <div>
          <Label htmlFor="businessEmail">{t('businessEmail')}</Label>
          <Input
            id="businessEmail"
            type="email"
            value={formData.businessEmail}
            onChange={(e) => updateFormData({ businessEmail: e.target.value })}
            placeholder="contact@mybusiness.com"
          />
        </div>

        <div>
          <Label htmlFor="businessPhone">{t('businessPhone')}</Label>
          <Input
            id="businessPhone"
            type="tel"
            value={formData.businessPhone}
            onChange={(e) => updateFormData({ businessPhone: e.target.value })}
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <Label htmlFor="businessAddress">{t('businessAddress')}</Label>
          <Input
            id="businessAddress"
            value={formData.businessAddress}
            onChange={(e) => updateFormData({ businessAddress: e.target.value })}
            placeholder="123 Main St, City, Country"
          />
        </div>

        {/* Map URL */}
        <div>
          <Label htmlFor="mapUrl" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Google Maps URL
          </Label>
          <Input
            id="mapUrl"
            type="url"
            value={formData.mapUrl || ''}
            onChange={(e) => updateFormData({ mapUrl: e.target.value })}
            placeholder="https://maps.google.com/?q=Your+Business"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Link to your business location (editable later)
          </p>
        </div>

        {/* WhatsApp URL */}
        <div>
          <Label htmlFor="whatsappUrl" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp URL
          </Label>
          <Input
            id="whatsappUrl"
            type="url"
            value={formData.whatsappUrl || ''}
            onChange={(e) => updateFormData({ whatsappUrl: e.target.value })}
            placeholder="https://wa.me/1234567890"
          />
          <p className="text-xs text-muted-foreground mt-1">
            WhatsApp contact link for customers (editable later)
          </p>
        </div>
      </div>

      {/* Multilingual Descriptions */}
      <div>
        <Label>{t('businessDescription')}</Label>
        <Tabs defaultValue="en" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="mt-2">
            <Textarea
              value={formData.businessDescriptionEn}
              onChange={(e) => updateFormData({ businessDescriptionEn: e.target.value })}
              placeholder="Describe your business in English..."
              rows={4}
            />
          </TabsContent>
          <TabsContent value="fr" className="mt-2">
            <Textarea
              value={formData.businessDescriptionFr}
              onChange={(e) => updateFormData({ businessDescriptionFr: e.target.value })}
              placeholder="Décrivez votre entreprise en français..."
              rows={4}
            />
          </TabsContent>
          <TabsContent value="ar" className="mt-2">
            <Textarea
              value={formData.businessDescriptionAr}
              onChange={(e) => updateFormData({ businessDescriptionAr: e.target.value })}
              placeholder="صف عملك بالعربية..."
              rows={4}
              dir="rtl"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}