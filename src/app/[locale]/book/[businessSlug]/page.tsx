"use client";

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Calendar as CalendarIcon, Clock, DollarSign, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function BookingPage({ params }: { params: { businessSlug: string } }) {
  const t = useTranslations('booking');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Data states
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mockTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00',
  ];

  useEffect(() => {
    loadBusinessData();
  }, [params.businessSlug]);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch business data
      const businessRes = await fetch(`/api/public/tenants?slug=${params.businessSlug}`);
      if (businessRes.ok) {
        const businessData = await businessRes.json();
        if (businessData.tenants && businessData.tenants.length > 0) {
          setBusiness(businessData.tenants[0]);
          
          // Fetch services for this business
          const servicesRes = await fetch(`/api/public/tenants?slug=${params.businessSlug}`);
          if (servicesRes.ok) {
            const data = await servicesRes.json();
            if (data.tenants && data.tenants.length > 0) {
              // Services are returned with tenant data
              setServices(data.tenants[0].services || []);
              setStaff(data.tenants[0].staff || []);
            }
          }
        } else {
          toast.error('Business not found');
          router.push('/');
        }
      } else {
        toast.error('Failed to load business data');
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to load business data:', error);
      toast.error('Failed to load business data');
    } finally {
      setIsLoading(false);
    }
  };

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

  const getStaffName = (staffMember: any) => {
    if (locale === 'fr') return staffMember.nameFr;
    if (locale === 'ar') return staffMember.nameAr;
    return staffMember.nameEn;
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedStaffData = staff.find(s => s.id === selectedStaff);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService) {
      toast.error('Please complete all booking details');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessSlug: params.businessSlug,
          serviceId: selectedService,
          staffId: selectedStaff || null,
          startTime: startDateTime.toISOString(),
          guestName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          guestEmail: customerInfo.email,
          guestPhone: customerInfo.phone,
          notes: customerInfo.notes,
          customerLanguage: locale,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('🎉 Appointment booked successfully!');
        toast.success('The business will confirm your appointment soon.');
        
        // Reset form after short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading booking page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">{business?.nameEn || business?.name}</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">{business?.aboutEn || business?.aboutFr || business?.aboutAr}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Select Service */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant={step >= 1 ? "default" : "secondary"}>1</Badge>
                    <CardTitle>{t('selectService')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No services available</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <Card
                          key={service.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedService === service.id ? 'border-primary border-2 bg-primary/5' : ''
                          }`}
                          onClick={() => {
                            setSelectedService(service.id);
                            if (step === 1) setStep(2);
                          }}
                        >
                          <CardHeader>
                            <CardTitle className="text-base">{getServiceName(service)}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {getServiceDescription(service)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {service.duration} min
                              </div>
                              <div className="flex items-center gap-1 font-semibold">
                                <DollarSign className="h-4 w-4" />
                                {service.price}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Select Staff */}
              {step >= 2 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant={step >= 2 ? "default" : "secondary"}>2</Badge>
                      <CardTitle>{t('selectStaff')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedStaff?.toString()}
                      onValueChange={(value) => {
                        setSelectedStaff(parseInt(value));
                        if (step === 2) setStep(3);
                      }}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="0" id="any-staff" />
                        <Label htmlFor="any-staff" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium">{t('anyStaff')}</span>
                          </div>
                        </Label>
                      </div>
                      {staff.map((staffMember) => (
                        <div
                          key={staffMember.id}
                          className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        >
                          <RadioGroupItem value={staffMember.id.toString()} id={`staff-${staffMember.id}`} />
                          <Label htmlFor={`staff-${staffMember.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                              {staffMember.photoUrl ? (
                                <img
                                  src={staffMember.photoUrl}
                                  alt={getStaffName(staffMember)}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <span className="font-medium">{getStaffName(staffMember)}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Select Date & Time */}
              {step >= 3 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant={step >= 3 ? "default" : "secondary"}>3</Badge>
                      <CardTitle>{t('selectDateTime')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="mb-2 block">{t('date')}</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (step === 3) setStep(4);
                        }}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                      />
                    </div>

                    {selectedDate && (
                      <div>
                        <Label className="mb-2 block">{t('availableSlots')}</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {mockTimeSlots.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedTime(time)}
                              className="font-mono"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Customer Information */}
              {step >= 4 && selectedTime && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant={step >= 4 ? "default" : "secondary"}>4</Badge>
                      <CardTitle>{t('customerInfo')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">{t('firstName')}</Label>
                        <Input
                          id="firstName"
                          value={customerInfo.firstName}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, firstName: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">{t('lastName')}</Label>
                        <Input
                          id="lastName"
                          value={customerInfo.lastName}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">{tCommon('email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">{tCommon('phone')}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">{t('notes')}</Label>
                      <Textarea
                        id="notes"
                        value={customerInfo.notes}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleBooking}
                      className="w-full"
                      size="lg"
                      disabled={!customerInfo.firstName || !customerInfo.email || !customerInfo.phone || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        t('confirmBooking')
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>{tCommon('summary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedServiceData && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{tCommon('service')}</p>
                        <p className="font-semibold">{getServiceName(selectedServiceData)}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{selectedServiceData.duration} min</span>
                          <span>${selectedServiceData.price}</span>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {selectedStaffData && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{tCommon('staff')}</p>
                        <p className="font-semibold">{getStaffName(selectedStaffData)}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {selectedStaff === 0 && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{tCommon('staff')}</p>
                        <p className="font-semibold">{t('anyStaff')}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {selectedDate && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t('date')}</p>
                        <p className="font-semibold">
                          {selectedDate.toLocaleDateString(locale, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {selectedTime && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t('time')}</p>
                        <p className="font-semibold font-mono">{selectedTime}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {selectedServiceData && (
                    <div className="pt-2">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>{tCommon('total')}</span>
                        <span>${selectedServiceData.price}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}