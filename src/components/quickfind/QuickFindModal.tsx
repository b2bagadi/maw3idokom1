'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RatingDisplay } from '@/components/rating/RatingDisplay';
import { useNotificationsByType } from '@/lib/hooks/usePolling';
import dynamic from 'next/dynamic';
import { useClientTranslation } from '@/i18n/client';

const QuickFindMapFallback = () => {
  const { t } = useClientTranslation();
  return (
    <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">
      {t('quickFind.loadingMap')}
    </div>
  );
};

const QuickFindMap = dynamic(() => import('./QuickFindMap'), {
  ssr: false,
  loading: () => <QuickFindMapFallback />
});

interface Business {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  lat?: number;
  lng?: number;
  averageRating: number;
  totalReviews?: number;
  services: Array<{
    price: number;
    duration: number;
  }>;
  category: {
    nameEn: string;
  };
}

interface QuickFindModalProps {
  onClose: () => void;
}

export function QuickFindModal({ onClose }: QuickFindModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { notifications, markAsRead } = useNotificationsByType('quick_find', 3000); // Poll every 3s during active search
  const { t, lng } = useClientTranslation();
  const [criteria, setCriteria] = useState({
    categoryId: '',
    maxPrice: 10000,
    time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    minRating: 3,
    description: ''
  });

  const [categories, setCategories] = useState<Array<{ id: string; nameEn: string; nameFr?: string; nameAr?: string }>>([]);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedBusinesses, setAcceptedBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const lastSelectedBusinessRef = useRef<Business | null>(null);
  const [clientLocation, setClientLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setClientLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Continue without location - will broadcast to all businesses
        }
      );
    }
  }, []);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setCategories(data) : setCategories([]))
      .catch(err => {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    // Process new notifications from polling
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      console.log('[QuickFind] Processing new notifications:', unreadNotifications.length);
      const processedIds: string[] = [];

      unreadNotifications.forEach(notification => {
        console.log('[QuickFind] Notification detail:', notification.id, notification.type, notification.data.eventType);
        // Handle business offering to the client's request
        if (notification.type === 'quick_find' && notification.data.eventType === 'request_offered') {
          const { businessId, businessName, price, address, lat, lng, logoUrl, requestId } = notification.data;

          setRequestSent(true);
          setAcceptedBusinesses(prev => {
            if (prev.some(b => b.id === businessId)) return prev;

            const newBusiness: Business = {
              id: businessId,
              name: businessName,
              address,
              lat,
              lng,
              averageRating: notification.data.avgRating || 0,
              totalReviews: notification.data.totalRatings || 0,
              services: [{ price: typeof price === 'string' ? parseFloat(price) : price, duration: 0 }],
              category: { nameEn: '' },
              logoUrl
            };

            return [...prev, newBusiness];
          });

          localStorage.setItem('activeRequestId', requestId);
          processedIds.push(notification.id);
        }
      });

      if (processedIds.length > 0) {
        markAsRead(processedIds);
      }
    }
  }, [notifications, markAsRead]);

  // NOTE: With polling system, businesses will see requests via /api/quickfind/pending
  // Responses are fetched from database instead of WebSocket
  // This component now focuses on sending requests and displaying results

  /* ... */
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/credits')
        .then(res => res.ok ? res.json() : { credits: 0 })
        .then(data => setCredits(data.credits ?? 0))
        .catch(err => {
          console.error('Failed to fetch credits:', err);
          setCredits(0);
        });
    }
  }, [session]);

  const handleAutoScan = async () => {
    if (credits !== null && credits <= 0) {
      alert(t('quickFind.noCredits'));
      return;
    }

    if (!criteria.categoryId) {
      alert(t('quickFind.enterCategory'));
      return;
    }
    setLoading(true);
    setRequestSent(false);
    setAcceptedBusinesses([]);
    setSelectedBusiness(null);

    const res = await fetch('/api/quickfind/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: criteria.categoryId,
        offeredPrice: criteria.maxPrice,
        requestedTime: criteria.time,
        description: criteria.description || `Quick Find request`,
        clientLat: clientLocation?.lat,
        clientLng: clientLocation?.lng,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setLoading(false);
      setRequestSent(true);
      if (data.remainingCredits !== undefined) {
        setCredits(data.remainingCredits);
        alert(`${t('quickFind.requestSentSuccess')} (${t('quickFind.creditsRemaining')}: ${data.remainingCredits})`);
      }
    } else {
      if (data.code === 'NO_CREDITS') {
        alert('❌ ' + t('quickFind.noCredits'));
        setCredits(0); // Sync state
      } else {
        alert(`❌ ${t('quickFind.errorSend')}`);
      }
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (business: Business) => {
    const requestId = localStorage.getItem('activeRequestId');
    if (!requestId) {
      alert(t('quickFind.requestError'));
      return;
    }

    lastSelectedBusinessRef.current = business;
    setSelectedBusiness(business);
    setLoading(true);

    const res = await fetch('/api/quickfind/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        businessId: business.id
      }),
    });

    if (res.ok) {
      setLoading(false);
      setRequestSent(false);
      router.push(`/business/${business.id}`);
      onClose();
    } else {
      alert('❌ ' + t('quickFind.bookingFailed'));
      setLoading(false);
    }
  };

  const getCategoryName = (cat: any) => {
    if (lng === 'fr' && cat.nameFr) return cat.nameFr;
    if (lng === 'ar' && cat.nameAr) return cat.nameAr;
    return cat.nameEn;
  };

  useEffect(() => {
    (window as any).confirmQuickFindBusiness = (businessId: string) => {
      console.log('[QuickFindMap] Global confirm triggered for:', businessId);
      const biz = acceptedBusinesses.find(b => b.id === businessId);
      if (biz) {
        handleConfirmBooking(biz);
      } else {
        console.error('[QuickFindMap] Business not found in accepted list:', businessId);
      }
    };
    return () => {
      delete (window as any).confirmQuickFindBusiness;
    };
  }, [acceptedBusinesses]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ⚡ {t('quickFind.title')}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">{t('quickFind.subtitle')}</p>
              {credits !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${credits > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {credits} {t('quickFind.credits', { defaultValue: 'Credits' })}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Search Criteria */}
          {!requestSent && acceptedBusinesses.length === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('quickFind.serviceCategory')}</label>
                  <select
                    value={criteria.categoryId}
                    onChange={(e) => setCriteria({ ...criteria, categoryId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t('quickFind.selectCategory')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{getCategoryName(cat)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('quickFind.preferredTime')}</label>
                  <input
                    type="datetime-local"
                    value={criteria.time}
                    onChange={(e) => setCriteria({ ...criteria, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('quickFind.maxPriceOffer')}: <span className="text-purple-600 font-bold">{(criteria.maxPrice / 100).toFixed(2)} MAD</span></label>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={criteria.maxPrice}
                  onChange={(e) => setCriteria({ ...criteria, maxPrice: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10 MAD</span>
                  <span>500 MAD</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('quickFind.description', { defaultValue: 'Service Description' })}</label>
                <textarea
                  value={criteria.description}
                  onChange={(e) => setCriteria({ ...criteria, description: e.target.value })}
                  placeholder={t('quickFind.descriptionPlaceholder', { defaultValue: 'Describe what you need... (optional)' })}
                  rows={3}
                  maxLength={300}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {criteria.description.length}/300
                </div>
              </div>

              <div className="pt-4 space-y-3">
                {credits !== null && credits <= 0 ? (
                  <div className="text-center">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-3">
                      <p className="font-bold">{t('quickFind.noCreditsTitle', { defaultValue: 'Out of Credits' })}</p>
                      <p className="text-sm">{t('quickFind.noCreditsDesc', { defaultValue: 'You have used all your Quick Find credits.' })}</p>
                    </div>
                    <button
                      onClick={() => router.push('/contact')}
                      className="w-full bg-gray-900 text-white rounded-xl px-6 py-4 hover:bg-gray-800 transition-all font-bold text-lg flex items-center justify-center space-x-2"
                    >
                      <span>💬 {t('quickFind.contactAdmin', { defaultValue: 'Contact Admin to Buy Credits' })}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAutoScan}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-6 py-4 hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('quickFind.startingScan')}</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ {t('quickFind.findAvailable')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Waiting / Scanning */}
          {requestSent && acceptedBusinesses.length === 0 && (
            <div className="text-center py-16 animate-in fade-in duration-700">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white rounded-full p-6 shadow-xl border-4 border-purple-50">
                  <svg className="w-full h-full text-purple-600 animate-[spin_3s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6l4 2" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('quickFind.broadcasting')}</h3>
              <p className="text-gray-500 max-w-md mx-auto">{t('quickFind.broadcastingDesc')}</p>

              <div className="mt-8 max-w-md mx-auto bg-gray-50 rounded-lg p-4 text-left">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">{t('quickFind.requestSent')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <span className="text-sm text-gray-600">{t('quickFind.waitingOffers')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Results & Map */}
          {acceptedBusinesses.length > 0 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex justify-between items-end">
                <h3 className="text-xl font-bold text-gray-800">
                  <span className="text-green-600">{acceptedBusinesses.length}</span> {t('quickFind.businessesResponded')}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{t('quickFind.liveUpdates')}</span>
              </div>

              {/* Map View */}
              <QuickFindMap
                businesses={acceptedBusinesses}
                selectedBusiness={selectedBusiness}
                clientLocation={clientLocation}
              />

              {/* Business Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acceptedBusinesses.map(business => (
                  <div
                    key={business.id}
                    className={`border rounded-xl p-4 transition-all cursor-pointer ${selectedBusiness?.id === business.id
                      ? 'border-purple-500 bg-purple-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                      }`}
                    onClick={() => {
                      setSelectedBusiness(business);
                      lastSelectedBusinessRef.current = business;
                    }}
                  >

                    <div className="flex space-x-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {business.logoUrl ? (
                          <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🏢</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{business.name}</h4>
                        <p className="text-sm text-gray-500 truncate">{business.address}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                            {business.services[0] ? `${(business.services[0].price / 100).toFixed(2)} MAD` : t('quickFind.notAvailable')}
                          </span>
                          <RatingDisplay
                            rating={(business as any).averageRating || 0}
                            totalRatings={(business as any).totalReviews || 0}
                            size={12}
                          />
                          {business.lat && business.lng && (
                            <span className="text-xs text-gray-400 flex items-center">
                              📍 {t('quickFind.mapAvailable')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {selectedBusiness?.id === business.id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmBooking(business);
                            }}
                            disabled={loading}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-green-700 transition-colors animate-in zoom-in duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {loading ? t('quickFind.confirming') : t('quickFind.confirm')}
                          </button>
                        ) : (

                          <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-300">
                            →
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
