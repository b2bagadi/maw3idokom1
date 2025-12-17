'use client';

import { useState } from 'react';

import { useSession } from 'next-auth/react';
import { QuickFindModal } from './QuickFindModal';
import { useClientTranslation } from '@/i18n/client';

export function QuickFindButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const { t } = useClientTranslation();

  if (!session || session.user?.role !== 'CLIENT') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform animate-pulse-glow"
        aria-label={t('quickFind.buttonLabel')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      </button>

      {isOpen && <QuickFindModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
