"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface StepThreeProps {
  formData: any;
  updateFormData: (data: any) => void;
}

export function StepThree({ formData, updateFormData }: StepThreeProps) {
  const t = useTranslations('onboarding');
  const [currentService, setCurrentService] = useState({
    nameEn: '',
    nameFr: '',
    nameAr: '',
    descriptionEn: '',
    descriptionFr: '',
    descriptionAr: '',
    duration: 30,
    price: 0,
  });

  const addService = () => {
    if (currentService.nameEn && currentService.duration && currentService.price) {
      updateFormData({
        services: [...formData.services, currentService]
      });
      setCurrentService({
        nameEn: '',
        nameFr: '',
        nameAr: '',
        descriptionEn: '',
        descriptionFr: '',
        descriptionAr: '',
        duration: 30,
        price: 0,
      });
    }
  };

  const removeService = (index: number) => {
    const newServices = formData.services.filter((_: any, i: number) => i !== index);
    updateFormData({ services: newServices });
  };

  return (
    <div className="space-y-6">
      {/* Service Form */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <Tabs defaultValue="en">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>
          
          <TabsContent value="en" className="space-y-4 mt-4">
            <div>
              <Label>{t('serviceName')} (EN)</Label>
              <Input
                value={currentService.nameEn}
                onChange={(e) => setCurrentService({ ...currentService, nameEn: e.target.value })}
                placeholder="Haircut"
              />
            </div>
            <div>
              <Label>Description (EN)</Label>
              <Textarea
                value={currentService.descriptionEn}
                onChange={(e) => setCurrentService({ ...currentService, descriptionEn: e.target.value })}
                placeholder="Professional haircut service..."
                rows={2}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="fr" className="space-y-4 mt-4">
            <div>
              <Label>{t('serviceName')} (FR)</Label>
              <Input
                value={currentService.nameFr}
                onChange={(e) => setCurrentService({ ...currentService, nameFr: e.target.value })}
                placeholder="Coupe de cheveux"
              />
            </div>
            <div>
              <Label>Description (FR)</Label>
              <Textarea
                value={currentService.descriptionFr}
                onChange={(e) => setCurrentService({ ...currentService, descriptionFr: e.target.value })}
                placeholder="Service de coupe de cheveux professionnel..."
                rows={2}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="ar" className="space-y-4 mt-4">
            <div>
              <Label>{t('serviceName')} (AR)</Label>
              <Input
                value={currentService.nameAr}
                onChange={(e) => setCurrentService({ ...currentService, nameAr: e.target.value })}
                placeholder="قص شعر"
                dir="rtl"
              />
            </div>
            <div>
              <Label>Description (AR)</Label>
              <Textarea
                value={currentService.descriptionAr}
                onChange={(e) => setCurrentService({ ...currentService, descriptionAr: e.target.value })}
                placeholder="خدمة قص شعر احترافية..."
                rows={2}
                dir="rtl"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t('serviceDuration')}</Label>
            <Input
              type="number"
              value={currentService.duration}
              onChange={(e) => setCurrentService({ ...currentService, duration: parseInt(e.target.value) || 0 })}
              placeholder="30"
              min="15"
              step="15"
            />
          </div>
          <div>
            <Label>{t('servicePrice')}</Label>
            <Input
              type="number"
              value={currentService.price}
              onChange={(e) => setCurrentService({ ...currentService, price: parseFloat(e.target.value) || 0 })}
              placeholder="50.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <Button onClick={addService} className="w-full" variant="secondary">
          <Plus className="h-4 w-4 mr-2" />
          {t('addService')}
        </Button>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {formData.services.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No services added yet. Add your first service above.
          </p>
        ) : (
          formData.services.map((service: any, index: number) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{service.nameEn}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.duration} min • ${service.price}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
