"use client";

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data
const mockServices = [
  {
    id: 1,
    nameEn: 'Haircut',
    nameFr: 'Coupe de cheveux',
    nameAr: 'قص شعر',
    descriptionEn: 'Professional haircut with styling',
    descriptionFr: 'Coupe de cheveux professionnelle avec coiffage',
    descriptionAr: 'قص شعر احترافي مع تصفيف',
    duration: 45,
    price: 50,
    isActive: true,
  },
  {
    id: 2,
    nameEn: 'Facial Treatment',
    nameFr: 'Soin du visage',
    nameAr: 'علاج الوجه',
    descriptionEn: 'Deep cleansing and rejuvenating facial',
    descriptionFr: 'Soin du visage nettoyant et rajeunissant',
    descriptionAr: 'تنظيف عميق وتجديد الوجه',
    duration: 60,
    price: 80,
    isActive: true,
  },
];

export function ServicesManagement() {
  const t = useTranslations('dashboard');
  const tOnboard = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [services, setServices] = useState(mockServices);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameFr: '',
    nameAr: '',
    descriptionEn: '',
    descriptionFr: '',
    descriptionAr: '',
    duration: 30,
    price: 0,
  });

  const getServiceName = (service: any) => {
    if (locale === 'fr') return service.nameFr;
    if (locale === 'ar') return service.nameAr;
    return service.nameEn;
  };

  const getServiceDescription = (service: any) => {
    if (locale === 'fr') return service.descriptionFr;
    if (locale === 'ar') return service.descriptionAr;
    return service.descriptionEn;
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      nameEn: '',
      nameFr: '',
      nameAr: '',
      descriptionEn: '',
      descriptionFr: '',
      descriptionAr: '',
      duration: 30,
      price: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setFormData({
      nameEn: service.nameEn,
      nameFr: service.nameFr,
      nameAr: service.nameAr,
      descriptionEn: service.descriptionEn,
      descriptionFr: service.descriptionFr,
      descriptionAr: service.descriptionAr,
      duration: service.duration,
      price: service.price,
    });
    setIsDialogOpen(true);
  };

  const handleSaveService = () => {
    // TODO: API integration
    console.log('Save service:', formData);
    setIsDialogOpen(false);
  };

  const handleDeleteService = (id: number) => {
    if (confirm(t('deleteConfirm'))) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">{t('manageServices')}</h3>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddService}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addNewService')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? t('editService') : t('addNewService')}
              </DialogTitle>
              <DialogDescription>
                Fill in the service details in all languages
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs defaultValue="en">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="fr">Français</TabsTrigger>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="space-y-4 mt-4">
                  <div>
                    <Label>{tOnboard('serviceName')} (EN)</Label>
                    <Input
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="Haircut"
                    />
                  </div>
                  <div>
                    <Label>Description (EN)</Label>
                    <Textarea
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      placeholder="Professional haircut service..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="fr" className="space-y-4 mt-4">
                  <div>
                    <Label>{tOnboard('serviceName')} (FR)</Label>
                    <Input
                      value={formData.nameFr}
                      onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                      placeholder="Coupe de cheveux"
                    />
                  </div>
                  <div>
                    <Label>Description (FR)</Label>
                    <Textarea
                      value={formData.descriptionFr}
                      onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                      placeholder="Service de coupe de cheveux professionnel..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="ar" className="space-y-4 mt-4">
                  <div>
                    <Label>{tOnboard('serviceName')} (AR)</Label>
                    <Input
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="قص شعر"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>Description (AR)</Label>
                    <Textarea
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      placeholder="خدمة قص شعر احترافية..."
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{tOnboard('serviceDuration')}</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <Label>{tOnboard('servicePrice')}</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleSaveService}>
                  {tCommon('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{getServiceName(service)}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {getServiceDescription(service)}
                  </CardDescription>
                </div>
                <Badge variant={service.isActive ? 'default' : 'secondary'}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {service.duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {service.price}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditService(service)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {tCommon('edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteService(service.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
