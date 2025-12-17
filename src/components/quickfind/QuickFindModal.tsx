'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePusher } from '@/lib/websocket/pusher-context';
import { useRouter } from 'next/navigation';
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
    const { userChannel } = usePusher();
    const { t, lng } = useClientTranslation();
  const [criteria, setCriteria] = useState({
    categoryId: '',
    maxPrice: 10000,
    time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    minRating: 3
  });
  
  const [categories, setCategories] = useState<Array<{ id: string; nameEn: string; nameFr?: string; nameAr?: string }>>([]);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedBusinesses, setAcceptedBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const lastSelectedBusinessRef = useRef<Business | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

    useEffect(() => {
      if (!userChannel) return;

      const handleRequestOffered = ({ businessId, businessName, price, address, lat, lng, logoUrl, requestId }: any) => {
        setRequestSent(true);
        setAcceptedBusinesses(prev => {
          if (prev.some(b => b.id === businessId)) return prev;
          
          const newBusiness: Business = {
            id: businessId,
            name: businessName,
            address,
            lat,
            lng,
            averageRating: 0,
            services: [{ price: parseFloat(price) * 100, duration: 0 }],
            category: { nameEn: '' },
            logoUrl
          };
          
          return [...prev, newBusiness];
        });
        
        localStorage.setItem('activeRequestId', requestId);
      };
      
      userChannel.bind('request_offered', handleRequestOffered);
      
      return () => {
        userChannel.unbind('request_offered', handleRequestOffered);
      };
    }, [userChannel, onClose, router, t]);

    const handleAutoScan = async () => {
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
          description: `Auto Quick Find request`
        }),
      });
      
      if (res.ok) {
        setLoading(false);
      } else {
        alert(`❌ ${t('quickFind.errorSend')}`);
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ⚡ {t('quickFind.title')}
            </h2>
            <p className="text-sm text-gray-500">{t('quickFind.subtitle')}</p>
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
                      onChange={(e) => setCriteria({...criteria, categoryId: e.target.value})}
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
                      onChange={(e) => setCriteria({...criteria, time: e.target.value})}
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
                    onChange={(e) => setCriteria({...criteria, maxPrice: Number(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10 MAD</span>
                    <span>500 MAD</span>
                  </div>
               </div>

               <div className="pt-4">
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
               />

               {/* Business Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {acceptedBusinesses.map(business => (
                    <div 
                      key={business.id} 
                       className={`border rounded-xl p-4 transition-all cursor-pointer ${
                          selectedBusiness?.id === business.id 
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
