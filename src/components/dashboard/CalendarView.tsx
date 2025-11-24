"use client";

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock appointments
const mockAppointments = [
  { id: 1, date: new Date(), time: '09:00', customer: 'John Doe', service: 'Haircut', status: 'confirmed' },
  { id: 2, date: new Date(), time: '10:30', customer: 'Jane Smith', service: 'Facial', status: 'confirmed' },
  { id: 3, date: new Date(), time: '13:00', customer: 'Mike Johnson', service: 'Massage', status: 'pending' },
  { id: 4, date: new Date(), time: '15:00', customer: 'Sarah Williams', service: 'Manicure', status: 'confirmed' },
];

export function CalendarView() {
  const t = useTranslations('dashboard');
  const tBooking = useTranslations('booking');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getAppointmentsForDate = (date: Date | undefined) => {
    if (!date) return [];
    return mockAppointments.filter(apt => 
      apt.date.toDateString() === date.toDateString()
    );
  };

  const selectedAppointments = getAppointmentsForDate(selectedDate);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('viewCalendar')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate?.toLocaleDateString(locale, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {selectedAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('noAppointments')}
              </p>
            ) : (
              <div className="space-y-4">
                {selectedAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-mono text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                        {appointment.time}
                      </div>
                      <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">{appointment.customer}</p>
                      <p className="text-sm text-muted-foreground">{appointment.service}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
