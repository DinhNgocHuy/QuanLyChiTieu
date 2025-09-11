import { Expense } from './Expense';

export type ExpenseInput = Omit<Expense, 'id' | 'price'> & {
  price: string; // Accept string from input field
  date: string | Date;
};