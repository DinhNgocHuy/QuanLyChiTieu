import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Investment } from '../types/Investment';
import { investmentService } from '../utils/investmentService';
import { useAuth } from './AuthContext';


interface InvestmentContextType {
  investments: Investment[];
  loading: boolean;
  lastRefresh: number;
  refreshInvestments: (force?: boolean) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  getTotalInvestments: () => number;
  getMonthlyIncome: () => number;
  getInvestmentsByType: () => { [key: string]: number };
  getInvestmentsByCategory: () => { income: number; investment: number; savings: number };
  getTaxableIncome: () => number;
  getNonTaxableIncome: () => number;
  getRecurringIncome: () => number;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

export const useInvestments = () => {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestments must be used within an InvestmentProvider');
  }
  return context;
};

interface InvestmentProviderProps {
  children: ReactNode;
}

export const InvestmentProvider: React.FC<InvestmentProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid;

  // ALL HOOKS AT THE TOP
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Define cache keys (safe to use userId here — just strings)
  const CACHE_KEY = userId ? `investments_${userId}` : 'investments_anonymous';
  const LAST_REFRESH_KEY = userId ? `last_refresh_${userId}` : 'last_refresh_anonymous';

  // Helper function: Generate recurring dates
  const getRecurringDates = (startDateStr: string, frequency: 'monthly' | 'quarterly' | 'yearly'): string[] => {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates: string[] = [];
    let current = new Date(startDate);

    while (current <= today) {
      dates.push(current.toISOString());
      if (frequency === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else if (frequency === 'quarterly') {
        current.setMonth(current.getMonth() + 3);
      } else if (frequency === 'yearly') {
        current.setFullYear(current.getFullYear() + 1);
      } else {
        break;
      }
    }
    return dates;
  };

  // Load from AsyncStorage
  const loadCachedData = async () => {
    if (!userId) return false;
    try {
      const [cachedData, cachedRefresh] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(LAST_REFRESH_KEY),
      ]);

      if (cachedData && cachedRefresh) {
        const parsedData = JSON.parse(cachedData);
        const refreshTime = parseInt(cachedRefresh);
        const now = Date.now();

        if (now - refreshTime < 5 * 60 * 1000) {
          setInvestments(parsedData);
          setLastRefresh(refreshTime);
          setLoading(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return false;
    }
  };
  // Save to cache
  const saveToCache = async (data: Investment[]) => {
    if (!userId) return;
    try {
      const now = Date.now();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(LAST_REFRESH_KEY, now.toString());
      setLastRefresh(now);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Refrest from Firestore
  const refreshInvestments = async (force: boolean = false) => {
    if (!userId) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    try {
      const now = Date.now();
      if (!force && now - lastRefresh < 5 * 60 * 1000) {
        return;
      }

      setLoading(true);
      const userInvestments = await investmentService.getUserInvestments(userId);
      setInvestments(userInvestments);
      await saveToCache(userInvestments);
    } catch (error) {
      console.error('Error loading investments:', error);
      const cacheLoaded = await loadCachedData();
      if (!cacheLoaded) {
        Alert.alert('Error', 'Failed to load investments');
      }
    } finally {
      setLoading(false);
    }
  };

  const addInvestment = async (investment: Omit<Investment, 'id' | 'createdAt'>) => {
  if (!userId) throw new Error('User not authenticated');

  try {
    const normalizedInvestment = {
      ...investment,
      date: Array.isArray(investment.date) ? investment.date : [investment.date],
    };

    // Pass to service with userId
    await investmentService.addInvestment(userId, normalizedInvestment);
    await refreshInvestments(true);
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
};

  const deleteInvestment = async (id: string) => {
    if (!userId) return;
    try {
      await investmentService.deleteInvestment(userId, id);
      setInvestments(prev => prev.filter(inv => inv.id !== id));
      await refreshInvestments(true);
    } catch (error) {
      console.error('Error deleting investment:', error);
      throw error;
    }
  };

  const getTotalInvestments = () => investmentService.getTotalInvestments(investments);
  const getMonthlyIncome = () => investmentService.getMonthlyIncome(investments);
  const getInvestmentsByType = () => investmentService.getInvestmentsByType(investments);
  const getInvestmentsByCategory = () => investmentService.getInvestmentsByCategory(investments);
  const getTaxableIncome = () => investmentService.getTaxableIncome(investments);
  const getNonTaxableIncome = () => investmentService.getNonTaxableIncome(investments);
  const getRecurringIncome = () => investmentService.getRecurringIncome(investments);

  // useEffects at the bottom — but still in order
  useEffect(() => {
    // User logged in → load data
    if (userId) {
      const initialize = async () => {
        const cacheLoaded = await loadCachedData();
        if (!cacheLoaded) {
          await refreshInvestments(true);
        }
      };
      initialize();
    } else {
      // User logged out → clear state
      setInvestments([]);
      setLastRefresh(0);
      setLoading(false);

      // Clear cache for previous user
      if (CACHE_KEY !== 'investments_anonymous') {
        AsyncStorage.removeItem(CACHE_KEY).catch(console.error);
      }
      if (LAST_REFRESH_KEY !== 'last_refresh_anonymous') {
        AsyncStorage.removeItem(LAST_REFRESH_KEY).catch(console.error);
      }
    }
  }, [userId, CACHE_KEY, LAST_REFRESH_KEY]);

  useEffect(() => {
    if (userId) {
      const interval = setInterval(() => {
        refreshInvestments();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userId, refreshInvestments]);

  // Define value only once
  const value: InvestmentContextType = {
    investments,
    loading,
    lastRefresh,
    refreshInvestments,
    addInvestment,
    deleteInvestment,
    getTotalInvestments,
    getMonthlyIncome,
    getInvestmentsByType,
    getInvestmentsByCategory,
    getTaxableIncome,
    getNonTaxableIncome,
    getRecurringIncome,
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
};
