"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock data
const mockStaff = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1 234 567 8900',
    role: 'Senior Stylist',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isActive: true,
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike@example.com',
    phone: '+1 234 567 8901',
    role: 'Massage Therapist',
    avatar: 'https://i.pravatar.cc/150?img=2',
    isActive: true,
  },
  {
    id: 3,
    name: 'Emma Williams',
    email: 'emma@example.com',
    phone: '+1 234 567 8902',
    role: 'Beautician',
    avatar: 'https://i.pravatar.cc/150?img=3',
    isActive: true,
  },
];

export function StaffManagement() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [staff, setStaff] = useState(mockStaff);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
  });

  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditStaff = (member: any) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
    });
    setIsDialogOpen(true);
  };

  const handleSaveStaff = () => {
    // TODO: API integration
    console.log('Save staff:', formData);
    setIsDialogOpen(false);
  };

  const handleDeleteStaff = (id: number) => {
    if (confirm(t('deleteConfirm'))) {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">{t('manageStaff')}</h3>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddStaff}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addNewStaff')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? t('editStaff') : t('addNewStaff')}
              </DialogTitle>
              <DialogDescription>
                Enter the staff member's information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('staffName')}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>{t('staffEmail')}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>{t('staffPhone')}</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <Label>{t('staffRole')}</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Senior Stylist"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleSaveStaff}>
                  {tCommon('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{member.name}</CardTitle>
                  <CardDescription className="truncate">{member.role}</CardDescription>
                </div>
                <Badge variant={member.isActive ? 'default' : 'secondary'}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditStaff(member)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {tCommon('edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteStaff(member.id)}
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
