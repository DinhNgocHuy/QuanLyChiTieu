export interface Expense {
  id: string;
  date: string;
  description: string;
  price: string | number;
  tag: string;
}

export type ExpenseInput = Omit<Expense, 'id' | 'date'> & { date: Date | string };
