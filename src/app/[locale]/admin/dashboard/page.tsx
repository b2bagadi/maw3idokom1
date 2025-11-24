"use client";

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  LogOut,
  Building2,
  Users,
  Briefcase,
  UserCog,
  Calendar,
  Settings,
  Languages,
  Key,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image as ImageIcon
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Section = 'businesses' | 'customers' | 'services' | 'staff' | 'appointments' | 'i18n' | 'settings' | 'password';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('businesses');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Data states
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [i18nStrings, setI18nStrings] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>({});

  // Form states
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
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
        setGlobalSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch global settings:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      switch (activeSection) {
        case 'businesses':
          const bizRes = await fetch('/api/admin/tenants', { headers });
          if (bizRes.ok) {
            const data = await bizRes.json();
            setBusinesses(data.tenants || []);
          }
          break;
        case 'customers':
          const custRes = await fetch('/api/admin/customers', { headers });
          if (custRes.ok) {
            const data = await custRes.json();
            setCustomers(data.customers || []);
          }
          break;
        case 'services':
          const servRes = await fetch('/api/admin/services', { headers });
          if (servRes.ok) {
            const data = await servRes.json();
            setServices(data.services || []);
          }
          break;
        case 'staff':
          const staffRes = await fetch('/api/admin/staff', { headers });
          if (staffRes.ok) {
            const data = await staffRes.json();
            setStaff(data.staff || []);
          }
          break;
        case 'appointments':
          const apptRes = await fetch('/api/admin/appointments', { headers });
          if (apptRes.ok) {
            const data = await apptRes.json();
            setAppointments(data.appointments || []);
          }
          break;
        case 'i18n':
          const i18nRes = await fetch('/api/admin/i18n', { headers });
          if (i18nRes.ok) {
            const data = await i18nRes.json();
            setI18nStrings(data.strings || []);
          }
          break;
        case 'settings':
          const settingsRes = await fetch('/api/admin/settings', { headers });
          if (settingsRes.ok) {
            const data = await settingsRes.json();
            setGlobalSettings(data);
            setFormData(data);
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
    localStorage.removeItem('admin_token');
    toast.success('Logged out successfully');
    router.push('/admin/login');
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({});
    setIsEditDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      let endpoint = '';

      switch (activeSection) {
        case 'businesses':
          endpoint = `/api/admin/tenants/${selectedItem.id}`;
          break;
        case 'services':
          endpoint = `/api/admin/services/${selectedItem.id}`;
          break;
        case 'staff':
          endpoint = `/api/admin/staff/${selectedItem.id}`;
          break;
        case 'i18n':
          endpoint = `/api/admin/i18n/${selectedItem.id}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('✅ Deleted successfully');
        loadData();
        setIsDeleteDialogOpen(false);
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      let endpoint = '';
      let method = selectedItem ? 'PUT' : 'POST';
      let body: any = { ...formData };

      switch (activeSection) {
        case 'businesses':
          endpoint = selectedItem
            ? `/api/admin/tenants/${selectedItem.id}`
            : '/api/admin/tenants';
          // Ensure password is included for new businesses
          if (!selectedItem && !body.password) {
            toast.error('Password is required for new businesses');
            setIsLoading(false);
            return;
          }
          break;
        case 'services':
          endpoint = selectedItem
            ? `/api/admin/services/${selectedItem.id}`
            : '/api/admin/services';
          // Ensure tenantId exists
          if (!body.tenantId) {
            toast.error('Business is required');
            setIsLoading(false);
            return;
          }
          break;
        case 'staff':
          endpoint = selectedItem
            ? `/api/admin/staff/${selectedItem.id}`
            : '/api/admin/staff';
          // Ensure tenantId exists
          if (!body.tenantId) {
            toast.error('Business is required');
            setIsLoading(false);
            return;
          }
          break;
        case 'i18n':
          endpoint = selectedItem
            ? `/api/admin/i18n/${selectedItem.id}`
            : '/api/admin/i18n';
          break;
        case 'settings':
          endpoint = '/api/admin/settings/global';
          method = 'PUT';
          break;
        case 'password':
          endpoint = '/api/admin/password';
          method = 'PUT';
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(selectedItem ? '✅ Updated successfully' : '✅ Created successfully');
        loadData();
        setIsEditDialogOpen(false);
        setFormData({});
        if (activeSection === 'settings') {
          fetchGlobalSettings();
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBusinessForm = () => {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="en">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="space-y-4">
            <div>
              <Label>Business Name (EN) *</Label>
              <Input
                value={formData.nameEn || ''}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Business name in English"
              />
            </div>
            <div>
              <Label>About (EN)</Label>
              <Textarea
                value={formData.aboutEn || ''}
                onChange={(e) => setFormData({ ...formData, aboutEn: e.target.value })}
                placeholder="About business in English"
                rows={3}
              />
            </div>
          </TabsContent>
          <TabsContent value="fr" className="space-y-4">
            <div>
              <Label>Business Name (FR) *</Label>
              <Input
                value={formData.nameFr || ''}
                onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                placeholder="Business name in French"
              />
            </div>
            <div>
              <Label>About (FR)</Label>
              <Textarea
                value={formData.aboutFr || ''}
                onChange={(e) => setFormData({ ...formData, aboutFr: e.target.value })}
                placeholder="About business in French"
                rows={3}
              />
            </div>
          </TabsContent>
          <TabsContent value="ar" className="space-y-4" dir="rtl">
            <div>
              <Label>اسم العمل (AR) *</Label>
              <Input
                value={formData.nameAr || ''}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="اسم العمل بالعربية"
                dir="rtl"
              />
            </div>
            <div>
              <Label>عن العمل (AR)</Label>
              <Textarea
                value={formData.aboutAr || ''}
                onChange={(e) => setFormData({ ...formData, aboutAr: e.target.value })}
                placeholder="عن العمل بالعربية"
                rows={3}
                dir="rtl"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Owner Name *</Label>
            <Input
              value={formData.ownerName || ''}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="Owner name"
            />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="business@example.com"
            />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div>
            <Label>Business Type *</Label>
            <Input
              value={formData.businessType || ''}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              placeholder="Salon, Barbershop, etc."
            />
          </div>
          {!selectedItem && (
            <div className="md:col-span-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Business owner password"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : selectedItem ? 'Update Business' : 'Create Business'}
        </Button>
      </div>
    );
  };

  const renderServiceForm = () => {
    return (
      <div className="space-y-6">
        <div>
          <Label>Business *</Label>
          <Select
            value={formData.tenantId?.toString() || ''}
            onValueChange={(value) => setFormData({ ...formData, tenantId: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select business" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((biz) => (
                <SelectItem key={biz.id} value={biz.id.toString()}>
                  {biz.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="en">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="space-y-4">
            <div>
              <Label>Service Name (EN) *</Label>
              <Input
                value={formData.nameEn || ''}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Haircut, Massage, etc."
              />
            </div>
            <div>
              <Label>Description (EN)</Label>
              <Textarea
                value={formData.descriptionEn || ''}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                placeholder="Service description"
                rows={2}
              />
            </div>
          </TabsContent>
          <TabsContent value="fr" className="space-y-4">
            <div>
              <Label>Service Name (FR) *</Label>
              <Input
                value={formData.nameFr || ''}
                onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                placeholder="Coupe de cheveux, Massage, etc."
              />
            </div>
            <div>
              <Label>Description (FR)</Label>
              <Textarea
                value={formData.descriptionFr || ''}
                onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                placeholder="Description du service"
                rows={2}
              />
            </div>
          </TabsContent>
          <TabsContent value="ar" className="space-y-4" dir="rtl">
            <div>
              <Label>اسم الخدمة (AR) *</Label>
              <Input
                value={formData.nameAr || ''}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="قص شعر، مساج، إلخ"
                dir="rtl"
              />
            </div>
            <div>
              <Label>الوصف (AR)</Label>
              <Textarea
                value={formData.descriptionAr || ''}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder="وصف الخدمة"
                rows={2}
                dir="rtl"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Duration (minutes) *</Label>
            <Input
              type="number"
              value={formData.duration || ''}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              placeholder="30"
            />
          </div>
          <div>
            <Label>Price (MAD) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              placeholder="100.00"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : selectedItem ? 'Update Service' : 'Create Service'}
        </Button>
      </div>
    );
  };

  const renderStaffForm = () => {
    return (
      <div className="space-y-6">
        <div>
          <Label>Business *</Label>
          <Select
            value={formData.tenantId?.toString() || ''}
            onValueChange={(value) => setFormData({ ...formData, tenantId: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select business" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((biz) => (
                <SelectItem key={biz.id} value={biz.id.toString()}>
                  {biz.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="en">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="space-y-4">
            <div>
              <Label>Staff Name (EN) *</Label>
              <Input
                value={formData.nameEn || ''}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="John Smith"
              />
            </div>
          </TabsContent>
          <TabsContent value="fr" className="space-y-4">
            <div>
              <Label>Staff Name (FR) *</Label>
              <Input
                value={formData.nameFr || ''}
                onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>
          </TabsContent>
          <TabsContent value="ar" className="space-y-4" dir="rtl">
            <div>
              <Label>اسم الموظف (AR) *</Label>
              <Input
                value={formData.nameAr || ''}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="أحمد محمد"
                dir="rtl"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Role *</Label>
            <Input
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Barber, Therapist, etc."
            />
          </div>
          <div>
            <Label>Photo URL</Label>
            <Input
              value={formData.photoUrl || ''}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : selectedItem ? 'Update Staff' : 'Create Staff'}
        </Button>
      </div>
    );
  };

  const renderTranslationForm = () => {
    return (
      <div className="space-y-6">
        <div>
          <Label>Translation Key *</Label>
          <Input
            value={formData.key || ''}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="landing.welcome"
            disabled={!!selectedItem}
          />
        </div>

        <div>
          <Label>Category</Label>
          <Input
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="landing, common, etc."
          />
        </div>

        <Tabs defaultValue="en">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="space-y-4">
            <div>
              <Label>English Text *</Label>
              <Textarea
                value={formData.textEn || ''}
                onChange={(e) => setFormData({ ...formData, textEn: e.target.value })}
                placeholder="Welcome to our platform"
                rows={3}
              />
            </div>
          </TabsContent>
          <TabsContent value="fr" className="space-y-4">
            <div>
              <Label>French Text *</Label>
              <Textarea
                value={formData.textFr || ''}
                onChange={(e) => setFormData({ ...formData, textFr: e.target.value })}
                placeholder="Bienvenue sur notre plateforme"
                rows={3}
              />
            </div>
          </TabsContent>
          <TabsContent value="ar" className="space-y-4" dir="rtl">
            <div>
              <Label>Arabic Text *</Label>
              <Textarea
                value={formData.textAr || ''}
                onChange={(e) => setFormData({ ...formData, textAr: e.target.value })}
                placeholder="مرحباً بك في منصتنا"
                rows={3}
                dir="rtl"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : selectedItem ? 'Update Translation' : 'Create Translation'}
        </Button>
      </div>
    );
  };

  const renderSettingsForm = () => {
    return (
      <div className="space-y-6">
        <div>
          <Label className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Logo/Favicon URL
          </Label>
          <Input
            value={formData.logoUrl || globalSettings.logoUrl || ''}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
          {(formData.logoUrl || globalSettings.logoUrl) && (
            <img
              src={formData.logoUrl || globalSettings.logoUrl}
              alt="Logo preview"
              className="mt-2 h-16 w-16 object-contain border rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <p className="text-sm text-muted-foreground mt-1">
            This logo appears site-wide (header, favicon, etc.)
          </p>
        </div>

        <Tabs defaultValue="en">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="space-y-4">
            <div>
              <Label>Landing Hero Text (EN)</Label>
              <Input
                value={formData.heroTextEn || globalSettings.heroTextEn || ''}
                onChange={(e) => setFormData({ ...formData, heroTextEn: e.target.value })}
                placeholder="Welcome To Maw3id"
              />
            </div>
          </TabsContent>
          <TabsContent value="fr" className="space-y-4">
            <div>
              <Label>Landing Hero Text (FR)</Label>
              <Input
                value={formData.heroTextFr || globalSettings.heroTextFr || ''}
                onChange={(e) => setFormData({ ...formData, heroTextFr: e.target.value })}
                placeholder="Bienvenue À Maw3id"
              />
            </div>
          </TabsContent>
          <TabsContent value="ar" className="space-y-4" dir="rtl">
            <div>
              <Label>نص الصفحة الرئيسية (AR)</Label>
              <Input
                value={formData.heroTextAr || globalSettings.heroTextAr || ''}
                onChange={(e) => setFormData({ ...formData, heroTextAr: e.target.value })}
                placeholder="مرحباً بك في موعد"
                dir="rtl"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Update Settings'}
        </Button>
      </div>
    );
  };

  const renderPasswordForm = () => {
    return (
      <div className="space-y-6">
        <div>
          <Label>Current Password</Label>
          <Input
            type="password"
            value={formData.currentPassword || ''}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder="Current password"
            autoComplete="off"
          />
        </div>
        <div>
          <Label>New Password</Label>
          <Input
            type="password"
            value={formData.newPassword || ''}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            placeholder="New password"
            autoComplete="off"
          />
        </div>
        <div>
          <Label>Confirm New Password</Label>
          <Input
            type="password"
            value={formData.confirmPassword || ''}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            autoComplete="off"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Changing...' : 'Change Password'}
        </Button>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && businesses.length === 0 && customers.length === 0 && services.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground animate-pulse">Loading...</div>
        </div>
      );
    }

    switch (activeSection) {
      case 'businesses':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <Input
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add Business
              </Button>
            </div>
            {businesses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No businesses found. Click "Add Business" to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {businesses.map((business) => (
                  <Card key={business.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <CardTitle>{business.nameEn || business.name}</CardTitle>
                          <CardDescription>
                            {business.email} • {business.phone}
                          </CardDescription>
                          <CardDescription className="mt-1">
                            Type: {business.businessType} • Slug: {business.slug}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(business)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(business)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-4">
            {customers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No customers found yet. Customers will appear here after they make bookings.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {customers.map((customer) => (
                  <Card key={customer.id}>
                    <CardHeader>
                      <CardTitle>{customer.firstName} {customer.lastName}</CardTitle>
                      <CardDescription>
                        {customer.email} • {customer.phone || 'No phone'}
                      </CardDescription>
                      <CardDescription className="mt-1">
                        Total Bookings: {customer.bookingCount || 0}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'services':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No services found. Click "Add Service" to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <CardTitle>{service.nameEn}</CardTitle>
                          <CardDescription>
                            {service.tenantName} • {service.duration} min • {service.price} MAD
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(service)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'staff':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </div>
            {staff.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No staff found. Click "Add Staff" to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {staff.map((member) => (
                  <Card key={member.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <CardTitle>{member.nameEn}</CardTitle>
                          <CardDescription>
                            {member.tenantName} • {member.role}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(member)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(member)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No appointments found yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {appointments.map((appt) => (
                  <Card key={appt.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <CardTitle>
                            {appt.guestName} - {appt.service?.nameEn}
                          </CardTitle>
                          <CardDescription>
                            {new Date(appt.startTime).toLocaleString()} • Status: {appt.status}
                          </CardDescription>
                          <CardDescription className="mt-1">
                            Business: {appt.tenant?.nameEn || 'N/A'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'i18n':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <Input
                placeholder="Search translations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add Translation
              </Button>
            </div>
            {i18nStrings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Languages className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No translations found. Click "Add Translation" to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {i18nStrings.map((string) => (
                  <Card key={string.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <CardTitle className="text-sm font-mono">{string.key}</CardTitle>
                          <CardDescription className="mt-2 space-y-1">
                            <div><strong>EN:</strong> {string.textEn}</div>
                            <div><strong>FR:</strong> {string.textFr}</div>
                            <div><strong>AR:</strong> {string.textAr}</div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(string)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(string)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>Configure site-wide settings (logo, favicon, hero text)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Logo/Favicon URL
                  </Label>
                  <Input
                    value={formData.logoUrl || globalSettings.logoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  {(formData.logoUrl || globalSettings.logoUrl) && (
                    <img
                      src={formData.logoUrl || globalSettings.logoUrl}
                      alt="Logo preview"
                      className="mt-2 h-16 w-16 object-contain border rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    This logo appears site-wide (header, favicon, etc.)
                  </p>
                </div>

                <Tabs defaultValue="en">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="fr">Français</TabsTrigger>
                    <TabsTrigger value="ar">العربية</TabsTrigger>
                  </TabsList>
                  <TabsContent value="en" className="space-y-4">
                    <div>
                      <Label>Landing Hero Text (EN)</Label>
                      <Input
                        value={formData.heroTextEn || globalSettings.heroTextEn || ''}
                        onChange={(e) => setFormData({ ...formData, heroTextEn: e.target.value })}
                        placeholder="Welcome To Maw3id"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="fr" className="space-y-4">
                    <div>
                      <Label>Landing Hero Text (FR)</Label>
                      <Input
                        value={formData.heroTextFr || globalSettings.heroTextFr || ''}
                        onChange={(e) => setFormData({ ...formData, heroTextFr: e.target.value })}
                        placeholder="Bienvenue À Maw3id"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="ar" className="space-y-4" dir="rtl">
                    <div>
                      <Label>نص الصفحة الرئيسية (AR)</Label>
                      <Input
                        value={formData.heroTextAr || globalSettings.heroTextAr || ''}
                        onChange={(e) => setFormData({ ...formData, heroTextAr: e.target.value })}
                        placeholder="مرحباً بك في موعد"
                        dir="rtl"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Update Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'password':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your super admin password</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={formData.currentPassword || ''}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Current password"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={formData.newPassword || ''}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="New password"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={formData.confirmPassword || ''}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    autoComplete="off"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              Section under development
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col animate-slide-in-left max-md:hidden">
        <div className="p-6 border-b">
          {logoUrl && (
            <Link href="/">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 w-10 mb-3 object-contain cursor-pointer transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Link>
          )}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-destructive to-primary bg-clip-text text-transparent">
            Super Admin
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Button
            variant={activeSection === 'businesses' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('businesses')}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Businesses
          </Button>
          <Button
            variant={activeSection === 'customers' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('customers')}
          >
            <Users className="w-4 h-4 mr-2" />
            Customers
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
            variant={activeSection === 'appointments' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('appointments')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Appointments
          </Button>
          <Button
            variant={activeSection === 'i18n' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('i18n')}
          >
            <Languages className="w-4 h-4 mr-2" />
            Translations
          </Button>
          <Button
            variant={activeSection === 'settings' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Global Settings
          </Button>
          <Button
            variant={activeSection === 'password' ? 'default' : 'ghost'}
            className="w-full justify-start transition-all duration-300"
            onClick={() => setActiveSection('password')}
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
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
          <h2 className="text-xl font-bold">Super Admin</h2>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-destructive to-primary bg-clip-text text-transparent">
                Super Admin
              </h2>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <Button
                variant={activeSection === 'businesses' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('businesses')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Businesses
              </Button>
              <Button
                variant={activeSection === 'customers' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('customers')}
              >
                <Users className="w-4 h-4 mr-2" />
                Customers
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
                variant={activeSection === 'appointments' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('appointments')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Appointments
              </Button>
              <Button
                variant={activeSection === 'i18n' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('i18n')}
              >
                <Languages className="w-4 h-4 mr-2" />
                Translations
              </Button>
              <Button
                variant={activeSection === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Global Settings
              </Button>
              <Button
                variant={activeSection === 'password' ? 'default' : 'ghost'}
                className="w-full justify-start transition-all duration-300"
                onClick={() => setActiveSection('password')}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
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
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-destructive to-primary bg-clip-text text-transparent animate-fade-in">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        </h1>
        {renderContent()}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Edit' : 'Create'} {
                activeSection === 'businesses' ? 'Business' :
                  activeSection === 'services' ? 'Service' :
                    activeSection === 'staff' ? 'Staff' :
                      activeSection === 'i18n' ? 'Translation' :
                        activeSection.charAt(0).toUpperCase() + activeSection.slice(1)
              }
            </DialogTitle>
          </DialogHeader>
          {activeSection === 'businesses' && renderBusinessForm()}
          {activeSection === 'services' && renderServiceForm()}
          {activeSection === 'staff' && renderStaffForm()}
          {activeSection === 'i18n' && renderTranslationForm()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}