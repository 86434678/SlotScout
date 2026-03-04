
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import { apiPost, authenticatedGet } from '@/utils/api';

const TRIP_PASS_KEY = 'slotscout_trip_pass_active';
const ANNUAL_SUBSCRIPTION_KEY = 'slotscout_annual_active';
const DAILY_REPORTS_KEY = 'slotscout_daily_reports';
const LAST_RESET_DATE_KEY = 'slotscout_last_reset_date';

interface TripPassContextType {
  isTripPassActive: boolean;
  isAnnualActive: boolean;
  dailyReportsCount: number;
  canUseFeature: (feature: 'report' | 'map' | 'export' | 'filters') => boolean;
  incrementReportCount: () => Promise<void>;
  purchaseTripPass: () => Promise<void>;
  purchaseAnnualSubscription: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  isLoading: boolean;
}

const TripPassContext = createContext<TripPassContextType | undefined>(undefined);

const FREE_DAILY_LIMIT = 5;

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`[TripPass] Error reading ${key}:`, error);
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`[TripPass] Error writing ${key}:`, error);
  }
}

async function deleteStorageItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`[TripPass] Error deleting ${key}:`, error);
  }
}

export function TripPassProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isTripPassActive, setIsTripPassActive] = useState(false);
  const [isAnnualActive, setIsAnnualActive] = useState(false);
  const [dailyReportsCount, setDailyReportsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTripPassState();
  }, [user]);

  useEffect(() => {
    checkAndResetDailyLimit();
  }, []);

  const loadTripPassState = async () => {
    console.log('[TripPass] Loading Trip Pass state');
    setIsLoading(true);
    try {
      // If user is logged in, check backend for Trip Pass and Annual status
      if (user) {
        try {
          console.log('[TripPass] Checking backend for purchase status');
          const response = await authenticatedGet<{ hasTripPass: boolean; hasAnnual: boolean; purchaseDate: string | null; expiresAt: string | null }>('/api/purchases/status');
          console.log('[TripPass] Backend response:', response);
          
          setIsTripPassActive(response.hasTripPass);
          setIsAnnualActive(response.hasAnnual);
          await setStorageItem(TRIP_PASS_KEY, response.hasTripPass ? 'true' : 'false');
          await setStorageItem(ANNUAL_SUBSCRIPTION_KEY, response.hasAnnual ? 'true' : 'false');
        } catch (error) {
          console.error('[TripPass] Error checking backend status:', error);
          // Fallback to local storage
          const passActive = await getStorageItem(TRIP_PASS_KEY);
          const annualActive = await getStorageItem(ANNUAL_SUBSCRIPTION_KEY);
          setIsTripPassActive(passActive === 'true');
          setIsAnnualActive(annualActive === 'true');
        }
      } else {
        // Not logged in, check local storage only
        const passActive = await getStorageItem(TRIP_PASS_KEY);
        const annualActive = await getStorageItem(ANNUAL_SUBSCRIPTION_KEY);
        setIsTripPassActive(passActive === 'true');
        setIsAnnualActive(annualActive === 'true');
      }
      
      const reportsCount = await getStorageItem(DAILY_REPORTS_KEY);
      setDailyReportsCount(reportsCount ? parseInt(reportsCount, 10) : 0);
      
      console.log('[TripPass] State loaded:', {
        isTripPassActive,
        isAnnualActive,
        dailyReportsCount: reportsCount ? parseInt(reportsCount, 10) : 0,
      });
    } catch (error) {
      console.error('[TripPass] Error loading state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndResetDailyLimit = async () => {
    try {
      const lastResetDate = await getStorageItem(LAST_RESET_DATE_KEY);
      const today = new Date().toISOString().split('T')[0];
      
      if (lastResetDate !== today) {
        console.log('[TripPass] Resetting daily report count for new day');
        await setStorageItem(DAILY_REPORTS_KEY, '0');
        await setStorageItem(LAST_RESET_DATE_KEY, today);
        setDailyReportsCount(0);
      }
    } catch (error) {
      console.error('[TripPass] Error checking daily reset:', error);
    }
  };

  const canUseFeature = (feature: 'report' | 'map' | 'export' | 'filters'): boolean => {
    // Both Trip Pass and Annual Subscription unlock all premium features
    if (isTripPassActive || isAnnualActive) {
      return true;
    }

    switch (feature) {
      case 'report':
        return dailyReportsCount < FREE_DAILY_LIMIT;
      case 'map':
      case 'export':
      case 'filters':
        return false;
      default:
        return false;
    }
  };

  const incrementReportCount = async () => {
    // Don't increment if user has premium access
    if (isTripPassActive || isAnnualActive) {
      return;
    }

    const newCount = dailyReportsCount + 1;
    console.log('[TripPass] Incrementing report count:', newCount);
    setDailyReportsCount(newCount);
    await setStorageItem(DAILY_REPORTS_KEY, newCount.toString());
  };

  const purchaseTripPass = async () => {
    console.log('[TripPass] Purchasing Trip Pass');
    
    try {
      // Call backend to create purchase record
      const response = await apiPost<{ success: boolean; purchaseId: string; activatedAt: string; isTripPassActive: boolean }>('/api/purchases/trip-pass', {
        userId: user?.id || 'anonymous',
        productId: 'com.slotscout.trippass',
        price: 6.99,
        platform: Platform.OS,
      });
      
      console.log('[TripPass] Backend purchase response:', response);
      
      if (response.success && response.isTripPassActive) {
        await setStorageItem(TRIP_PASS_KEY, 'true');
        setIsTripPassActive(true);
        
        // Track analytics event
        await apiPost('/api/analytics/track', {
          userId: user?.id || 'anonymous',
          eventName: 'trip_pass_purchase',
          eventProperties: { price: 6.99, platform: Platform.OS },
        }).catch(err => console.error('[Analytics] Failed to track trip_pass_purchase:', err));
        
        console.log('[TripPass] Trip Pass activated successfully');
      } else {
        throw new Error('Purchase failed on backend');
      }
    } catch (error: any) {
      console.error('[TripPass] Purchase error:', error);
      throw new Error(error.message || 'Purchase failed. Please try again.');
    }
  };

  const purchaseAnnualSubscription = async () => {
    console.log('[TripPass] Purchasing Annual Subscription');
    
    try {
      // Call backend to create annual subscription record
      const response = await apiPost<{ success: boolean; purchaseId: string; activatedAt: string; expiresAt: string; isAnnualActive: boolean }>('/api/purchases/annual', {
        userId: user?.id || 'anonymous',
        productId: 'com.slotscout.annual',
        price: 29.99,
        platform: Platform.OS,
      });
      
      console.log('[TripPass] Backend annual purchase response:', response);
      
      if (response.success && response.isAnnualActive) {
        await setStorageItem(ANNUAL_SUBSCRIPTION_KEY, 'true');
        setIsAnnualActive(true);
        
        // Track analytics event
        await apiPost('/api/analytics/track', {
          userId: user?.id || 'anonymous',
          eventName: 'annual_purchase',
          eventProperties: { price: 29.99, platform: Platform.OS, expiresAt: response.expiresAt },
        }).catch(err => console.error('[Analytics] Failed to track annual_purchase:', err));
        
        console.log('[TripPass] Annual Subscription activated successfully');
      } else {
        throw new Error('Purchase failed on backend');
      }
    } catch (error: any) {
      console.error('[TripPass] Annual purchase error:', error);
      throw new Error(error.message || 'Purchase failed. Please try again.');
    }
  };

  const restorePurchases = async () => {
    console.log('[TripPass] Restoring purchases');
    
    try {
      if (user) {
        // Check backend for existing purchases
        const response = await authenticatedGet<{ hasTripPass: boolean; hasAnnual: boolean; purchaseDate: string | null; productId: string | null; expiresAt: string | null }>('/api/purchases/restore');
        console.log('[TripPass] Restore response:', response);
        
        if (response.hasTripPass || response.hasAnnual) {
          await setStorageItem(TRIP_PASS_KEY, response.hasTripPass ? 'true' : 'false');
          await setStorageItem(ANNUAL_SUBSCRIPTION_KEY, response.hasAnnual ? 'true' : 'false');
          setIsTripPassActive(response.hasTripPass);
          setIsAnnualActive(response.hasAnnual);
          console.log('[TripPass] Purchases restored from backend');
        } else {
          throw new Error('No active purchases found for this account');
        }
      } else {
        // Not logged in, check local storage
        const passActive = await getStorageItem(TRIP_PASS_KEY);
        const annualActive = await getStorageItem(ANNUAL_SUBSCRIPTION_KEY);
        setIsTripPassActive(passActive === 'true');
        setIsAnnualActive(annualActive === 'true');
        
        if (passActive !== 'true' && annualActive !== 'true') {
          throw new Error('No active purchases found. Please sign in to restore purchases.');
        }
        
        console.log('[TripPass] Restore complete from local storage');
      }
    } catch (error: any) {
      console.error('[TripPass] Restore error:', error);
      throw new Error(error.message || 'Restore failed. Please try again.');
    }
  };

  return (
    <TripPassContext.Provider
      value={{
        isTripPassActive,
        isAnnualActive,
        dailyReportsCount,
        canUseFeature,
        incrementReportCount,
        purchaseTripPass,
        purchaseAnnualSubscription,
        restorePurchases,
        isLoading,
      }}
    >
      {children}
    </TripPassContext.Provider>
  );
}

export function useTripPass() {
  const context = useContext(TripPassContext);
  if (context === undefined) {
    throw new Error('useTripPass must be used within TripPassProvider');
  }
  return context;
}
