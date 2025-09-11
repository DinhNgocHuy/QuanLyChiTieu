export interface Investment {
  id?: string;
  type: 'salary' | 'bonus' | 'commission' | 'freelance' | 'dividend' | 'interest' | 'rental' | 'mutual_fund' | 'stocks' | 'bonds' | 'real_estate' | 'crypto' | 'fixed_deposit' | 'ppf' | 'nps' | 'insurance' | 'other';
  title: string;
  amount: number;
  date: string | string[];
  description?: string;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  taxable: boolean;
  category: 'income' | 'investment' | 'savings';
  source?: string;
  createdAt: string;
}

export interface InvestmentSummary {
  totalInvestments: number;
  totalIncome: number;
  totalSavings: number;
  monthlyIncome: number;
  investmentByType: { [key: string]: number };
  monthlyTrend: { month: string; amount: number }[];
  taxableIncome: number;
  nonTaxableIncome: number;
}
