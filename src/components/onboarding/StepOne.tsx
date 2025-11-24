"use client";

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors, Stethoscope, Briefcase, Dumbbell, GraduationCap, MoreHorizontal } from 'lucide-react';

interface StepOneProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const businessTypes = [
  { id: 'salon', icon: Scissors },
  { id: 'clinic', icon: Stethoscope },
  { id: 'consulting', icon: Briefcase },
  { id: 'fitness', icon: Dumbbell },
  { id: 'education', icon: GraduationCap },
  { id: 'other', icon: MoreHorizontal },
];

export function StepOne({ formData, updateFormData }: StepOneProps) {
  const t = useTranslations('onboarding.businessTypes');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {businessTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = formData.businessType === type.id;

        return (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              isSelected ? 'border-primary border-2 bg-primary/5' : ''
            }`}
            onClick={() => updateFormData({ businessType: type.id })}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
              <Icon className={`h-12 w-12 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`text-sm font-medium text-center ${isSelected ? 'text-primary' : ''}`}>
                {t(type.id)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
