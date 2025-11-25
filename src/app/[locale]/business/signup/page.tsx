"use client";

import { useState } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, MapPin, MessageCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BusinessSignupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameFr: '',
    nameAr: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    mapUrl: '',
    whatsappUrl: '',
    password: '',
    confirmPassword: '',
    aboutEn: '',
    aboutFr: '',
    aboutAr: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.nameEn || !formData.nameFr || !formData.nameAr) {
      toast.error('Please provide business name in all three languages');
      return;
    }

    if (!formData.ownerName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.businessType) {
      toast.error('Please select a business type');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/business/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Signup failed');
        return;
      }

      if (data.success && data.token) {
        localStorage.setItem('business_token', data.token);
        toast.success('✅ Business account created successfully!');
        router.push('/onboarding');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-coral to-gold rounded-full flex items-center justify-center mb-4 animate-scale-in">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Join Maw3id – Add Your Business
            </CardTitle>
            <CardDescription className="text-base">
              انضم إلى موعد - أضف عملك • Rejoignez Maw3id – Ajoutez votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trilingual Business Names */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Name (Required in all languages)</h3>
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="fr">Français</TabsTrigger>
                    <TabsTrigger value="ar">العربية</TabsTrigger>
                  </TabsList>
                  <TabsContent value="en" className="space-y-2">
                    <Label>Business Name (English) *</Label>
                    <Input
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="Beautiful Hair Salon"
                      required
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                    <Label className="mt-4">About Your Business (English)</Label>
                    <Textarea
                      value={formData.aboutEn}
                      onChange={(e) => setFormData({ ...formData, aboutEn: e.target.value })}
                      placeholder="Tell customers about your business..."
                      rows={3}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </TabsContent>
                  <TabsContent value="fr" className="space-y-2">
                    <Label>Business Name (Français) *</Label>
                    <Input
                      value={formData.nameFr}
                      onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                      placeholder="Salon de Coiffure Beauté"
                      required
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                    <Label className="mt-4">About Your Business (Français)</Label>
                    <Textarea
                      value={formData.aboutFr}
                      onChange={(e) => setFormData({ ...formData, aboutFr: e.target.value })}
                      placeholder="Parlez de votre entreprise..."
                      rows={3}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </TabsContent>
                  <TabsContent value="ar" className="space-y-2" dir="rtl">
                    <Label>اسم العمل (العربية) *</Label>
                    <Input
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="صالون الشعر الجميل"
                      required
                      className="transition-all duration-200 focus:scale-[1.01]"
                      dir="rtl"
                    />
                    <Label className="mt-4">عن عملك (العربية)</Label>
                    <Textarea
                      value={formData.aboutAr}
                      onChange={(e) => setFormData({ ...formData, aboutAr: e.target.value })}
                      placeholder="أخبر العملاء عن عملك..."
                      rows={3}
                      className="transition-all duration-200 focus:scale-[1.01]"
                      dir="rtl"
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Owner & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Owner Name *</Label>
                  <Input
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="John Smith"
                    required
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="owner@business.com"
                    required
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                    required
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <Label>Business Type *</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barbershop">Barbershop</SelectItem>
                      <SelectItem value="Salon">Salon</SelectItem>
                      <SelectItem value="Clinic">Clinic</SelectItem>
                      <SelectItem value="Spa">Spa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location & WhatsApp */}
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Google Maps URL
                  </Label>
                  <Input
                    value={formData.mapUrl}
                    onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                    placeholder="https://maps.google.com/?q=Your+Business+Location"
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Share your Google Maps location link
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Business URL
                  </Label>
                  <Input
                    value={formData.whatsappUrl}
                    onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                    placeholder="https://wa.me/1234567890"
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Your WhatsApp business link (https://wa.me/your-number)
                  </p>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password *
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 8 characters"
                    required
                    autoComplete="off"
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <Label>Confirm Password *</Label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    required
                    autoComplete="off"
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] py-6 text-lg animate-pulse"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Business Account'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => router.push('/onboarding')}
                >
                  Login here
                </Button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}