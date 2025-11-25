"use client";

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

interface StepFourProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function StepFour({ formData, updateFormData }: StepFourProps) {
  const t = useTranslations('onboarding');
  const tDays = useTranslations('onboarding.daysOfWeek');

  const updateWorkingHours = (day: string, field: string, value: any) => {
    updateFormData({
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-4">
      {daysOfWeek.map((day) => {
        const dayData = formData.workingHours[day];
        
        return (
          <Card key={day}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={dayData.enabled}
                    onCheckedChange={(checked) => updateWorkingHours(day, 'enabled', checked)}
                  />
                  <Label className="text-base font-medium capitalize">
                    {tDays(day)}
                  </Label>
                </div>
                {!dayData.enabled && (
                  <span className="text-sm text-muted-foreground">{t('closed')}</span>
                )}
              </div>

              {dayData.enabled && (
                <div className="grid grid-cols-2 gap-4 ml-11">
                  <div>
                    <Label className="text-sm">{t('startTime')}</Label>
                    <Input
                      type="time"
                      value={dayData.start}
                      onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{t('endTime')}</Label>
                    <Input
                      type="time"
                      value={dayData.end}
                      onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
