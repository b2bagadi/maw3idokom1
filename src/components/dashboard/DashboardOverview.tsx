"use client";

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Briefcase, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock data
const mockStats = {
  todayAppointments: 8,
  upcomingAppointments: 24,
  totalServices: 12,
  totalStaff: 5,
};

const mockTodayAppointments = [
  { id: 1, time: '09:00', customer: 'John Doe', service: 'Haircut', status: 'confirmed' },
  { id: 2, time: '10:30', customer: 'Jane Smith', service: 'Facial', status: 'confirmed' },
  { id: 3, time: '13:00', customer: 'Mike Johnson', service: 'Massage', status: 'pending' },
  { id: 4, time: '15:00', customer: 'Sarah Williams', service: 'Manicure', status: 'confirmed' },
];

export function DashboardOverview() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('todayAppointments')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">{t('thisMonth')}: +12%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('upcomingAppointments')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalServices')}
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalServices}</div>
            <p className="text-xs text-muted-foreground">Active services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalStaff')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>{t('todayAppointments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {mockTodayAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('noAppointments')}
            </p>
          ) : (
            <div className="space-y-4">
              {mockTodayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded">
                      {appointment.time}
                    </div>
                    <div>
                      <p className="font-medium">{appointment.customer}</p>
                      <p className="text-sm text-muted-foreground">{appointment.service}</p>
                    </div>
                  </div>
                  <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="w-full" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              {t('viewCalendar')}
            </Button>
            <Button className="w-full" variant="outline">
              <Briefcase className="mr-2 h-4 w-4" />
              {t('manageServices')}
            </Button>
            <Button className="w-full" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              {t('manageStaff')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
