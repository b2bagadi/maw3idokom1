"use client";

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  LogOut,
  Calendar,
  Settings,
  MessageCircle,
  Mail,
  CheckCircle,
  XCircle,
  MapPin,
  Briefcase,
  UserCog,
  Save,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

type Section = 'appointments' | 'profile' | 'services' | 'staff' | 'gallery';

export default function BusinessDashboardPage() {
  const router = useRouter();
  const t = useTranslations();
  const [activeSection, setActiveSection] = useState<Section>('appointments');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState('');

  // Data states
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [serviceForm, setServiceForm] = useState<any>({});
  const [staffForm, setStaffForm] = useState<any>({});
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Email form
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('business_token');
    if (!token) {
      router.push('/business/login');
      return;
    }
    loadData();
    fetchGlobalSettings();
  }, [activeSection]);

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
      }
    } catch (error) {
      console.error('Failed to fetch global settings:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      switch (activeSection) {
        case 'appointments':
          const apptRes = await fetch('/api/business/appointments', { headers });
          if (apptRes.ok) {
            const data = await apptRes.json();
            setAppointments(data.appointments || []);
          }
          break;
        case 'profile':
          const profileRes = await fetch('/api/business/profile', { headers });
          if (profileRes.ok) {
            const data = await profileRes.json();
            setProfile(data);
            setGalleryUrls(data.galleryImages ? JSON.parse(data.galleryImages) : []);
          }
          break;
        case 'services':
          const servRes = await fetch('/api/business/services', { headers });
          if (servRes.ok) {
            const data = await servRes.json();
            setServices(data.services || []);
          }
          break;
        case 'staff':
          const staffRes = await fetch('/api/business/staff', { headers });
          if (staffRes.ok) {
            const data = await staffRes.json();
            setStaff(data.staff || []);
          }
          break;
        case 'gallery':
          const galRes = await fetch('/api/business/profile', { headers });
          if (galRes.ok) {
            const data = await galRes.json();
            setGalleryUrls(data.galleryImages ? JSON.parse(data.galleryImages) : []);
          }
          break;
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('business_token');
    toast.success('Logged out successfully');
    router.push('/business/login');
  };

  const handleConfirmAppointment = async (appointmentId: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const response = await fetch(`/api/business/appointments/${appointmentId}/confirm?id=${appointmentId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('✅ Appointment confirmed!');
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to confirm');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectAppointment = async (appointmentId: number, reason: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const response = await fetch(`/api/business/appointments/${appointmentId}/reject?id=${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: reason })
      });

      if (response.ok) {
        toast.success('❌ Appointment rejected');
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reject');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const response = await fetch('/api/business/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...emailForm,
          appointmentId: selectedAppointment?.id
        })
      });

      if (response.ok) {
        toast.success('✉️ Email sent successfully!');
        setIsEmailDialogOpen(false);
        setEmailForm({ to: '', subject: '', body: '' });
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...profile, galleryImages: JSON.stringify(galleryUrls) })
      });

      if (response.ok) {
        toast.success('✅ Profile updated successfully!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveService = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const endpoint = selectedService
        ? `/api/business/services/${selectedService.id}?id=${selectedService.id}`
        : '/api/business/services';
      const method = selectedService ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serviceForm)
      });

      if (response.ok) {
        toast.success(selectedService ? '✅ Service updated!' : '✅ Service created!');
        setIsServiceDialogOpen(false);
        setServiceForm({});
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save service');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const response = await fetch(`/api/business/services/${serviceId}?id=${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('❌ Service deleted');
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStaff = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const endpoint = selectedStaff
        ? `/api/business/staff/${selectedStaff.id}?id=${selectedStaff.id}`
        : '/api/business/staff';
      const method = selectedStaff ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(staffForm)
      });

      if (response.ok) {
        toast.success(selectedStaff ? '✅ Staff updated!' : '✅ Staff added!');
        setIsStaffDialogOpen(false);
        setStaffForm({});
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save staff');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_token');
      const response = await fetch(`/api/business/staff/${staffId}?id=${staffId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('❌ Staff deleted');
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    if (galleryUrls.length >= 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }

    if (!newGalleryUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      toast.error('Please enter a valid image URL (JPG, PNG, GIF, or WebP)');
      return;
    }

    setGalleryUrls([...galleryUrls, newGalleryUrl]);
    setNewGalleryUrl('');
    toast.success('Image added! Remember to save changes');
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
    toast.success('Image removed! Remember to save changes');
  };

  const openWhatsApp = (appointment: any) => {
    const phone = appointment.guestPhone;
    const name = appointment.guestName || 'Guest';
    const service = appointment.service?.nameEn || 'service';
    const date = new Date(appointment.startTime).toLocaleDateString();

    const message = encodeURIComponent(
      `Hello ${name}, your appointment for ${service} on ${date} is confirmed. Looking forward to seeing you!`
    );

    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
  };

  const openEmailDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setEmailForm({
      to: appointment.guestEmail || '',
      subject: `Appointment Confirmation - ${appointment.service?.nameEn}`,
      body: `Dear ${appointment.guestName || 'Customer'},\n\nYour appointment for ${appointment.service?.nameEn} on ${new Date(appointment.startTime).toLocaleString()} has been confirmed.\n\nWe look forward to seeing you!\n\nBest regards,\n${profile.nameEn || 'Your Business'}`
    });
    setIsEmailDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'CONFIRMED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'COMPLETED': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;

  const renderAppointments = () => (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 animate-pulse">
          <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
            ⚠️ You have {pendingCount} pending appointment{pendingCount > 1 ? 's' : ''} awaiting your response
          </p>
        </div>
      )}

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No appointments yet</p>
          </CardContent>
        </Card>
      ) : (
        appointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    {appointment.guestName || 'Guest Customer'}
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2 space-y-1">
                    <div>📋 {appointment.service?.nameEn}</div>
                    <div>📅 {new Date(appointment.startTime).toLocaleString()}</div>
                    <div>⏱️ {appointment.service?.duration} minutes • ${appointment.service?.price}</div>
                    {appointment.guestEmail && <div>✉️ {appointment.guestEmail}</div>}
                    {appointment.guestPhone && <div>📱 {appointment.guestPhone}</div>}
                    {appointment.notes && <div className="mt-2 text-sm">💬 {appointment.notes}</div>}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {appointment.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => handleConfirmAppointment(appointment.id)}
                      disabled={isLoading}
                      className="bg-green-500 hover:bg-green-600 transition-all duration-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) handleRejectAppointment(appointment.id, reason);
                      }}
                      disabled={isLoading}
                      variant="destructive"
                      className="transition-all duration-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}

                {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                  <>
                    {appointment.guestPhone && (
                      <Button
                        onClick={() => openWhatsApp(appointment)}
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition-all duration-300"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                    {appointment.guestEmail && (
                      <Button
                        onClick={() => openEmailDialog(appointment)}
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderProfile = () => (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        <CardDescription>Update your business information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="en">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="space-y-4">
            <div>
              <Label>Business Name (EN)</Label>
              <Input
                value={profile.nameEn || ''}
                onChange={(e) => setProfile({ ...profile, nameEn: e.target.value })}
              />
            </div>
            <div>
              <Label>About (EN)</Label>
              <Textarea
                value={profile.aboutEn || ''}
                onChange={(e) => setProfile({ ...profile, aboutEn: e.target.value })}
                rows={3}
              />
            </div>
          </TabsContent>
          <TabsContent value="fr" className="space-y-4">
            <div>
              <Label>Business Name (FR)</Label>
              <Input
                value={profile.nameFr || ''}
                onChange={(e) => setProfile({ ...profile, nameFr: e.target.value })}
              />
            </div>
            <div>
              <Label>About (FR)</Label>
              <Textarea
                value={profile.aboutFr || ''}
                onChange={(e) => setProfile({ ...profile, aboutFr: e.target.value })}
                rows={3}
              />
            </div>
          </TabsContent>
          <TabsContent value="ar" className="space-y-4" dir="rtl">
            <div>
              <Label>اسم العمل (AR)</Label>
              <Input
                value={profile.nameAr || ''}
                onChange={(e) => setProfile({ ...profile, nameAr: e.target.value })}
                dir="rtl"
              />
            </div>
            <div>
              <Label>عن عملك (AR)</Label>
              <Textarea
                value={profile.aboutAr || ''}
                onChange={(e) => setProfile({ ...profile, aboutAr: e.target.value })}
                rows={3}
                dir="rtl"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Business Logo URL</Label>
            <Input
              value={profile.logo || ''}
              onChange={(e) => setProfile({ ...profile, logo: e.target.value })}
              placeholder="https://..."
            />
            {profile.logo && (
              <img src={profile.logo} alt="Logo preview" className="mt-2 h-20 w-20 object-contain border rounded" />
            )}
          </div>
          <div>
            <Label>Business Type</Label>
            <Input
              value={profile.businessType || ''}
              onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
              placeholder="Salon, Barbershop, Clinic..."
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Google Maps URL
            </Label>
            <Input
              value={profile.mapUrl || ''}
              onChange={(e) => setProfile({ ...profile, mapUrl: e.target.value })}
              placeholder="https://maps.google.com/?q=..."
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp URL
            </Label>
            <Input
              value={profile.whatsappUrl || ''}
              onChange={(e) => setProfile({ ...profile, whatsappUrl: e.target.value })}
              placeholder="https://wa.me/..."
            />
          </div>
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all duration-300"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderServices = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setSelectedService(null);
            setServiceForm({});
            setIsServiceDialogOpen(true);
          }}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No services yet. Add your first service!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>{service.nameEn || service.nameFr || service.nameAr}</CardTitle>
                <CardDescription>
                  ${service.price} • {service.duration} minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {service.descriptionEn || service.descriptionFr || service.descriptionAr}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedService(service);
                      setServiceForm(service);
                      setIsServiceDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setSelectedStaff(null);
            setStaffForm({});
            setIsStaffDialogOpen(true);
          }}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No staff members yet. Add your first staff member!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {staff.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>{member.nameEn || member.nameFr || member.nameAr}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedStaff(member);
                      setStaffForm(member);
                      setIsStaffDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteStaff(member.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderGallery = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Business Gallery
        </CardTitle>
        <CardDescription>
          Add up to 6 images to showcase your business (JPG, PNG, GIF, or WebP)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-32 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Invalid+Image';
                }}
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveGalleryImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {galleryUrls.length < 6 && (
          <div className="space-y-2">
            <Label>Add New Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
              />
              <Button onClick={handleAddGalleryImage}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {6 - galleryUrls.length} image{6 - galleryUrls.length !== 1 ? 's' : ''} remaining
            </p>
          </div>
        )}

        <Button
          onClick={handleSaveProfile}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all duration-300"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Gallery'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (isLoading && (appointments.length === 0 && !profile.id)) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground animate-pulse">Loading...</div>
        </div>
      );
    }

    switch (activeSection) {
      case 'appointments':
        return renderAppointments();
      case 'profile':
        return renderProfile();
      case 'services':
        return renderServices();
      case 'staff':
        return renderStaff();
      case 'gallery':
        return renderGallery();
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col max-md:hidden">
        <div className="p-6 border-b">
          {logoUrl && (
            <Link href="/">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 w-10 mb-3 object-contain cursor-pointer transition-transform duration-300 hover:scale-110"
              />
            </Link>
          )}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Business Dashboard
          </h2>
          {profile.nameEn && (
            <p className="text-sm text-muted-foreground mt-1">{profile.nameEn}</p>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={activeSection === 'appointments' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('appointments')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Appointments
            {pendingCount > 0 && (
              <Badge className="ml-auto bg-red-500">{pendingCount}</Badge>
            )}
          </Button>
          <Button
            variant={activeSection === 'profile' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('profile')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Profile
          </Button>
          <Button
            variant={activeSection === 'services' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('services')}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Services
          </Button>
          <Button
            variant={activeSection === 'staff' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('staff')}
          >
            <UserCog className="w-4 h-4 mr-2" />
            Staff
          </Button>
          <Button
            variant={activeSection === 'gallery' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('gallery')}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Gallery
          </Button>
        </nav>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-card border-b z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <Link href="/">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-8 w-8 object-contain cursor-pointer"
              />
            </Link>
          )}
          <h2 className="text-xl font-bold">Business Dashboard</h2>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Business Dashboard
              </h2>
              {profile.nameEn && (
                <p className="text-sm text-muted-foreground mt-1">{profile.nameEn}</p>
              )}
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <Button
                variant={activeSection === 'appointments' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('appointments')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Appointments
                {pendingCount > 0 && (
                  <Badge className="ml-auto bg-red-500">{pendingCount}</Badge>
                )}
              </Button>
              <Button
                variant={activeSection === 'profile' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('profile')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant={activeSection === 'services' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('services')}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Services
              </Button>
              <Button
                variant={activeSection === 'staff' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('staff')}
              >
                <UserCog className="w-4 h-4 mr-2" />
                Staff
              </Button>
              <Button
                variant={activeSection === 'gallery' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('gallery')}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Gallery
              </Button>
            </nav>
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:p-8 p-4 pt-24 md:pt-8">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        </h1>
        {renderContent()}
      </div>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedAppointment?.guestName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>To</Label>
              <Input
                value={emailForm.to}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isLoading}>
              <Mail className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedService ? 'Edit' : 'Add'} Service</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="en">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="fr">Français</TabsTrigger>
              <TabsTrigger value="ar">العربية</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-4">
              <div>
                <Label>Service Name (EN)</Label>
                <Input
                  value={serviceForm.nameEn || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameEn: e.target.value })}
                  placeholder="Haircut"
                />
              </div>
              <div>
                <Label>Description (EN)</Label>
                <Textarea
                  value={serviceForm.descriptionEn || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, descriptionEn: e.target.value })}
                  placeholder="Professional haircut with styling"
                  rows={3}
                />
              </div>
            </TabsContent>
            <TabsContent value="fr" className="space-y-4">
              <div>
                <Label>Service Name (FR)</Label>
                <Input
                  value={serviceForm.nameFr || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameFr: e.target.value })}
                  placeholder="Coupe de cheveux"
                />
              </div>
              <div>
                <Label>Description (FR)</Label>
                <Textarea
                  value={serviceForm.descriptionFr || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, descriptionFr: e.target.value })}
                  placeholder="Coupe professionnelle avec coiffage"
                  rows={3}
                />
              </div>
            </TabsContent>
            <TabsContent value="ar" className="space-y-4" dir="rtl">
              <div>
                <Label>اسم الخدمة (AR)</Label>
                <Input
                  value={serviceForm.nameAr || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameAr: e.target.value })}
                  placeholder="قص شعر"
                  dir="rtl"
                />
              </div>
              <div>
                <Label>الوصف (AR)</Label>
                <Textarea
                  value={serviceForm.descriptionAr || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, descriptionAr: e.target.value })}
                  placeholder="قص شعر احترافي مع تصفيف"
                  rows={3}
                  dir="rtl"
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Price (MAD)</Label>
              <Input
                type="number"
                value={serviceForm.price || ''}
                onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                placeholder="50"
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={serviceForm.duration || ''}
                onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 30 })}
                placeholder="30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveService} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? 'Edit' : 'Add'} Staff Member</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="en">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="fr">Français</TabsTrigger>
              <TabsTrigger value="ar">العربية</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-4">
              <div>
                <Label>Staff Name (EN)</Label>
                <Input
                  value={staffForm.nameEn || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, nameEn: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
            </TabsContent>
            <TabsContent value="fr" className="space-y-4">
              <div>
                <Label>Staff Name (FR)</Label>
                <Input
                  value={staffForm.nameFr || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, nameFr: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>
            </TabsContent>
            <TabsContent value="ar" className="space-y-4" dir="rtl">
              <div>
                <Label>اسم الموظف (AR)</Label>
                <Input
                  value={staffForm.nameAr || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, nameAr: e.target.value })}
                  placeholder="أحمد محمد"
                  dir="rtl"
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Role</Label>
              <Input
                value={staffForm.role || ''}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                placeholder="Hairstylist, Barber, etc."
              />
            </div>
            <div>
              <Label>Photo URL</Label>
              <Input
                value={staffForm.photoUrl || ''}
                onChange={(e) => setStaffForm({ ...staffForm, photoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStaff} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}