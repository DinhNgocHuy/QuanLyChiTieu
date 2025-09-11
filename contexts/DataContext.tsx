import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Expense } from '../types/Expense';
import { Goal } from '../types/Goal';
import {
  getAllAvailableGoalMonths,
  getAllAvailableMonths,
  getAllExpenses,
  getGoalsByMonthYear,
  registerDataChangeCallback,
  unregisterDataChangeCallback,
} from '../utils/firebaseUtils';
import { useAuth } from './AuthContext'; // Import useAuth to get current user

interface DataContextType {
  // Expenses
  expenses: Expense[];
  expensesLoading: boolean;
  getExpensesByMonth: (month: number, year: number) => Expense[];
  refreshExpenses: () => Promise<void>;

  // Goals
  goals: { [monthYear: string]: Goal[] };
  goalsLoading: boolean;
  getGoalsByMonth: (monthYear: string) => Goal[];
  refreshGoals: (monthYear: string) => Promise<void>;

  // Available months
  availableMonths: string[];
  availableGoalMonths: string[];

  // Cache management
  clearCache: () => Promise<void>;
  lastRefresh: Date | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEYS = {
  EXPENSES: 'cached_expenses',
  GOALS: 'cached_goals',
  AVAILABLE_MONTHS: 'cached_available_months',
  AVAILABLE_GOAL_MONTHS: 'cached_available_goal_months',
  LAST_REFRESH: 'last_refresh_timestamp',
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: currentUser } = useAuth(); // Get current user from AuthContext
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<{ [monthYear: string]: Goal[] }>({});
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableGoalMonths, setAvailableGoalMonths] = useState<string[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Main function to refresh all expenses
  const refreshExpenses = useCallback(async () => {
    if (!currentUser) {
      console.log('🚫 No user logged in. Clearing expenses.');
      setExpenses([]);
      setExpensesLoading(false);
      return;
    }

    console.log(`🔄 Fetching expenses for user UID: ${currentUser.uid}`);
    setExpensesLoading(true);
    try {
      const [freshExpenses, freshAvailableMonths] = await Promise.all([
        getAllExpenses(),
        getAllAvailableMonths(),
      ]);

      console.log(`✅ Loaded ${freshExpenses.length} expenses for user: ${currentUser.uid}`);
      setExpenses(freshExpenses);
      setAvailableMonths(freshAvailableMonths);

      const refreshTime = new Date();
      setLastRefresh(refreshTime);

      // Cache the data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(freshExpenses)),
        AsyncStorage.setItem(STORAGE_KEYS.AVAILABLE_MONTHS, JSON.stringify(freshAvailableMonths)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_REFRESH, refreshTime.toISOString()),
      ]);
    } catch (error) {
      console.error('❌ Error refreshing expenses:', error);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  }, [currentUser]); // ✅ Re-creates when user changes

  // Debounced refresh to avoid rapid calls
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    const timeout = setTimeout(() => {
      refreshExpenses();
    }, 300);
    setRefreshTimeout(timeout);
  }, [refreshExpenses, refreshTimeout]);

  // Load cached data on mount
  const loadCachedData = useCallback(async () => {
    if (!currentUser) {
      setExpensesLoading(false);
      return;
    }

    try {
      const [
        cachedExpenses,
        cachedGoals,
        cachedAvailableMonths,
        cachedAvailableGoalMonths,
        cachedLastRefresh,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.AVAILABLE_MONTHS),
        AsyncStorage.getItem(STORAGE_KEYS.AVAILABLE_GOAL_MONTHS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_REFRESH),
      ]);

      let shouldRefresh = false;

      if (cachedLastRefresh) {
        const lastRefreshTime = new Date(cachedLastRefresh);
        const now = new Date();
        const timeDiff = now.getTime() - lastRefreshTime.getTime();

        if (timeDiff > CACHE_DURATION) {
          console.log('🕒 Cache expired, will refresh data...');
          shouldRefresh = true;
        } else {
          console.log('💾 Using cached data for user:', currentUser.uid);
          if (cachedExpenses) setExpenses(JSON.parse(cachedExpenses));
          if (cachedGoals) setGoals(JSON.parse(cachedGoals));
          if (cachedAvailableMonths) setAvailableMonths(JSON.parse(cachedAvailableMonths));
          if (cachedAvailableGoalMonths) setAvailableGoalMonths(JSON.parse(cachedAvailableGoalMonths));
          if (cachedLastRefresh) setLastRefresh(new Date(cachedLastRefresh));
        }
      } else {
        console.log('📭 No cache found. Will fetch fresh data.');
        shouldRefresh = true;
      }

      if (shouldRefresh) {
        await refreshExpenses();
      } else {
        setExpensesLoading(false);
      }
    } catch (error) {
      console.error('❌ Error loading cached ', error);
      await refreshExpenses();
    }
  }, [currentUser, refreshExpenses]);

  // Load data on mount
  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  // Register for real-time data changes (e.g., from Firebase)
  useEffect(() => {
    const handleDataChange = () => {
      console.log('🔁 Data changed externally. Debouncing refresh...');
      debouncedRefresh();
    };

    registerDataChangeCallback(handleDataChange);

    return () => {
      unregisterDataChangeCallback(handleDataChange);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [debouncedRefresh, refreshTimeout]);

  // Refresh goals for a specific month
  const refreshGoals = useCallback(
    async (monthYear: string) => {
      if (!currentUser) {
        setGoalsLoading(false);
        return;
      }

      setGoalsLoading(true);
      try {
        const [freshGoals, freshAvailableGoalMonths] = await Promise.all([
          getGoalsByMonthYear(monthYear),
          getAllAvailableGoalMonths(),
        ]);

        setGoals((prev) => ({
          ...prev,
          [monthYear]: freshGoals,
        }));
        setAvailableGoalMonths(freshAvailableGoalMonths);

        // Update goals cache
        const updatedGoals = { ...goals, [monthYear]: freshGoals };
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals)),
          AsyncStorage.setItem(
            STORAGE_KEYS.AVAILABLE_GOAL_MONTHS,
            JSON.stringify(freshAvailableGoalMonths)
          ),
        ]);
      } catch (error) {
        console.error('❌ Error refreshing goals:', error);
      } finally {
        setGoalsLoading(false);
      }
    },
    [currentUser, goals]
  );

  // Filter expenses by month/year
  const getExpensesByMonth = useCallback(
    (month: number, year: number): Expense[] => {
      return expenses.filter((expense) => {
        const dateParts = expense.date.split('/');
        if (dateParts.length === 3) {
          const expenseMonth = parseInt(dateParts[1], 10); // MM
          const expenseYear = parseInt(dateParts[2], 10); // YYYY
          return expenseMonth === month && expenseYear === year;
        }
        return false;
      });
    },
    [expenses]
  );

  // Get goals by monthYear
  const getGoalsByMonth = useCallback(
    (monthYear: string): Goal[] => {
      return goals[monthYear] || [];
    },
    [goals]
  );

  // Clear all cached data
  const clearCache = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.removeItem(STORAGE_KEYS.GOALS),
        AsyncStorage.removeItem(STORAGE_KEYS.AVAILABLE_MONTHS),
        AsyncStorage.removeItem(STORAGE_KEYS.AVAILABLE_GOAL_MONTHS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_REFRESH),
      ]);

      setExpenses([]);
      setGoals({});
      setAvailableMonths([]);
      setAvailableGoalMonths([]);
      setLastRefresh(null);

      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }, []);

  // Listen for user changes (from AuthContext via global hook)
  useEffect(() => {
    (window as any).__onUserChanged = async (newUser: any) => {
      console.log(
        `🔥 User changed in DataProvider. Old user: ${
          currentUser?.uid || 'none'
        }, New user: ${newUser?.uid || 'none'}`
      );

      // Clear current cache
      await clearCache();

      if (newUser) {
        console.log('👤 New user logged in. Fetching their data...');
        await refreshExpenses();
      } else {
        console.log('👋 User logged out. State cleared.');
        setExpensesLoading(false);
      }
    };

    // Cleanup
    return () => {
      delete (window as any).__onUserChanged;
    };
  }, [currentUser, clearCache, refreshExpenses]); // ✅ All dependencies included

  const value: DataContextType = {
    expenses,
    expensesLoading,
    getExpensesByMonth,
    refreshExpenses,
    goals,
    goalsLoading,
    getGoalsByMonth,
    refreshGoals,
    availableMonths,
    availableGoalMonths,
    clearCache,
    lastRefresh,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Custom hook to use DataContext
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};