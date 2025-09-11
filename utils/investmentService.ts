import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { Investment } from '../types/Investment';

// Helpers to get user-specific investments collection
const getUserInvestmentsCollection = (userId: string) => {
  return collection(db, 'users', userId, 'investments');
};

export const investmentService = {
  /**
   * Add a new investment for the user
   */
  async addInvestment(userId: string, investment: Omit<Investment, 'id' | 'createdAt'>): Promise<string> {
    try {
      const investmentsRef = getUserInvestmentsCollection(userId)
      const docRef = await addDoc(investmentsRef, {
        ...investment,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding investment:', error);
      throw error;
    }
  },

  /**
   * Get all investments for a user
   */
  async getUserInvestments(userId: string): Promise<Investment[]> {
    try {
      const investmentsRef = getUserInvestmentsCollection(userId);
      let querySnapshot;
      try {
        // Try compound query with orderBy
        const q = query(investmentsRef, orderBy('date', 'desc'));
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        console.log('Using fallback query without orderBy:', indexError);
        // Fallback: fetch without orderBy
        querySnapshot = await getDocs(investmentsRef);
      }
      
      const investments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Investment[];
      
      // Sort manually if needed
      return investments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching investments:', error);
      throw error;
    }
  },

  // Update an existing investment
  async updateInvestment(userId: string, investmentId: string, updates: Partial<Investment>) {
    try {
      const docRef = doc(db, 'users', userId, 'investments', investmentId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating investment:', error);
      throw error;
    }
  },

  // Delete an investment
  async deleteInvestment(userId: string, investmentId: string) {
    try {
      const docRef = doc(db, 'users', userId, 'investments', investmentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting investment:', error);
      throw error;
    }
  },

  getInvestmentsByCategory(investments: Investment[]) {
    const getCategory = (investment: Investment) => {
      if (investment.category) return investment.category;

      const incomeTypes = ['salary', 'bonus', 'commission', 'freelance', 'dividend', 'interest', 'rental', 'other'];
      const investmentTypes = ['mutual_fund', 'stocks', 'bonds', 'real_estate', 'crypto'];
      const savingsTypes = ['fixed_deposit', 'ppf', 'nps', 'insurance'];
      
      if (incomeTypes.includes(investment.type)) return 'income';
      if (investmentTypes.includes(investment.type)) return 'investment';
      if (savingsTypes.includes(investment.type)) return 'savings';
      return 'income';
    };
    
    const categories = {
      income: investments.filter(inv => getCategory(inv) === 'income'),
      investment: investments.filter(inv => getCategory(inv) === 'investment'),
      savings: investments.filter(inv => getCategory(inv) === 'savings'),
    };
    
    return {
      income: categories.income.reduce((sum, inv) => sum + inv.amount, 0),
      investment: categories.investment.reduce((sum, inv) => sum + inv.amount, 0),
      savings: categories.savings.reduce((sum, inv) => sum + inv.amount, 0),
    };
  },

  getTaxableIncome(investments: Investment[]) {
    return investments
      .filter(inv => inv.taxable)
      .reduce((total, inv) => total + inv.amount, 0);
  },

  getNonTaxableIncome(investments: Investment[]) {
    return investments
      .filter(inv => !inv.taxable)
      .reduce((total, inv) => total + inv.amount, 0);
  },

  getRecurringIncome(investments: Investment[]) {
    return investments
      .filter(inv => inv.isRecurring && inv.category === 'income')
      .reduce((total, inv) => total + inv.amount, 0);
  },

  getInvestmentsByType(investments: Investment[]) {
    const summary = investments.reduce((acc, investment) => {
      acc[investment.type] = (acc[investment.type] || 0) + investment.amount;
      return acc;
    }, {} as Record<string, number>);
    return summary;
  },

  getTotalInvestments(investments: Investment[]) {
    return investments.reduce((total, investment) => total + investment.amount, 0);
  },

  getMonthlyIncome(investments: Investment[]) {
    return investments
      .filter(inv => inv.category === 'income' && inv.isRecurring && inv.recurringFrequency === 'monthly')
      .reduce((total, inv) => total + inv.amount, 0);
  },

  getMonthlyTrend(investments: Investment[]) {
    const monthlyData = investments.reduce((acc, investment) => {
      const month = new Date(investment.date).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + investment.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyData)
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));
  }
};
