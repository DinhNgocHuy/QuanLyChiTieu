import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../constants/firebase";
import { Expense, ExpenseInput } from "../types/Expense";
import { Goal } from "../types/Goal";


export const registerDataChangeCallback = (callback: () => void) => {
  onDataChangeCallbacks.push(callback);
};

export const unregisterDataChangeCallback = (callback: () => void) => {
  onDataChangeCallbacks = onDataChangeCallbacks.filter(cb => cb !== callback);
};

// Helper function
function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  return user.uid;
}

// Cache invalidation callbacks with debouncing
let onDataChangeCallbacks: (() => void)[] = [];
let notifyTimeout: ReturnType<typeof setTimeout> | null = null;

const notifyDataChange = () => {
  if (notifyTimeout) {
    clearTimeout(notifyTimeout);
  }

  notifyTimeout = setTimeout(() => {
    console.log(`Notifying ${onDataChangeCallbacks.length} data change callbacks`);
    onDataChangeCallbacks.forEach((callback, index) => {
      console.log(`Calling callback ${index + 1}`);
      callback();
    });
  }, 100);
};

function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export const addExpenseToFirestore = async (
  expense: ExpenseInput
): Promise<void> => {
  try {
    const uid = getCurrentUserId();
    const { date, price: priceInput, ...data } = expense;

    // Handle price: convert string to number
    let priceAsNumber: number;
    if (typeof priceInput === 'string') {
      const priceInputStr = (priceInput as string).trim();
      const cleaned = priceInputStr.replace(/\./g, '').trim();
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error(`Invalid price value: ${priceInput}`);
      }
      priceAsNumber = parsed;
    } else if (typeof priceInput === 'number') {
      if (isNaN(priceInput) || priceInput < 0) {
        throw new Error(`Invalid price value: ${priceInput}`);
      }
      priceAsNumber = priceInput;
    } else {
      throw new Error('Price must be a string or number');
    }

    // Handle date
    let dateObj: Date = new Date();
    if (typeof date === 'string') {
      const parts = date.split('/');
      if (parts.length === 3) {
        const [inputDay, inputMonth, inputYear] = parts.map(Number);
        if (!isNaN(inputDay) && !isNaN(inputMonth) && !isNaN(inputYear)) {
          dateObj = new Date(inputYear, inputMonth - 1, inputDay);
        }
      }
    } else if (isDate(date)) {
      dateObj = date;
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('Invalid date, using today:', date);
      dateObj = new Date();
    }

    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Save to firestore
    await addDoc(collection(db, "users", uid, "expenses"), {
      ...data,
      price: priceAsNumber,
      date: formattedDate,
    });

    console.log('Expense added with price:', priceAsNumber);

    notifyDataChange();
  } catch (error) {
    console.error("Error adding expense to Firestore: ", error);
    throw error;
  }
};

export const deleteExpenseFromFirestore = async (expenseId: string): Promise<void> => {
  try {
    const uid = getCurrentUserId();
    await deleteDoc(doc(db, "users", uid, "expenses", expenseId));
    console.log("Expense deleted with ID: ", expenseId);
    notifyDataChange();
  } catch (error) {
    console.error("Error deleting expense from Firestore: ", error);
    throw error;
  }
};

export const getExpensesByMonth = async (month: number, year: number): Promise<Expense[]> => {
  try {
    const uid = getCurrentUserId();
    const q = query(collection(db, "users", uid, "expenses"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    const expenses: Expense[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Parse date
      if (!data.date || typeof data.date !== 'string') {
        return; // Skip invalid date
      }
      const dateParts = data.date.split('/');
      if (dateParts.length !== 3) {
        return; // Skip invalid format
      }

      const expenseDay = parseInt(dateParts[0], 10);    // DD
      const expenseMonth = parseInt(dateParts[1], 10);  // MM
      const expenseYear = parseInt(dateParts[2], 10);   // YYYY

      // Validate parsed values
      if (!isNaN(expenseDay) && !isNaN(expenseMonth) && !isNaN(expenseYear) &&
        expenseMonth >= 1 && expenseMonth <= 12 &&
        expenseDay >= 1 && expenseDay <= 31 &&
        expenseYear >= 1900 && expenseYear <= 2100
      ) {
        return;
      }

      // Filter by requested month and year
      if (expenseYear !== year || expenseMonth !== month) {
        return;
      }

      // Parse price
      let priceValue: number;
      if (typeof data.price === 'number') {
        priceValue = data.price;
      } else if (typeof data.price === 'string') {
        // Fallback: if old data still has string, try to clean it
        const cleaned = data.price.replace?.(/\./g, '') || data.price;
        const parsed = parseFloat(cleaned);
        priceValue = isNaN(parsed) ? 0 : parsed;
      } else {
        priceValue = 0;
      }

      // Build Expense Object 
      expenses.push({
        id: doc.id,
        date: data.date,
        description: data.description || '',
        price: priceValue,
        tag: data.tag || 'Unknown'
      });
    });
      
// Sort by date descending
    expenses.sort((a, b) => {
      const parseDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        return !isNaN(day) && !isNaN(month) && !isNaN(year)
          ? new Date(year, month - 1, day).getTime()
          : 0;
      };
      return parseDate(b.date) - parseDate(a.date);
    });

    return expenses;
  } catch (error) {
    if (error instanceof Error && error.message.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    console.error("Error fetching expenses by month: ", error);
    return [];
  }
};

export const getAllAvailableMonths = async (): Promise<string[]> => {
  try {
    const uid = getCurrentUserId();
    const q = query(
      collection(db, "users", uid, "expenses"),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    const months = new Set<string>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dateParts = data.date.split('/');
      if (dateParts.length === 3) {
        const expenseMonth = parseInt(dateParts[1], 10);  // MM
        const expenseYear = parseInt(dateParts[2], 10);   // YYYY

        if (!isNaN(expenseMonth) && !isNaN(expenseYear)) {
          const monthKey = `${expenseYear}-${expenseMonth.toString().padStart(2, '0')}`;
          months.add(monthKey);
        }
      }
    });

    const sortedMonths = Array.from(months).sort().reverse();
    console.log('Available months:', sortedMonths);
    return sortedMonths;
  } catch (error) {
    console.error("Error fetching available months: ", error);
    return [];
  }
};

// export const getAllExpenses = async (): Promise<Expense[]> => {
//   try {
//     const uid = getCurrentUserId();
//     console.log('Fetching all expenses from Firestore...');
//     const q = query(
//       collection(db, "users", uid, "expenses"),
//       orderBy("date", "desc")
//     );
//     const querySnapshot = await getDocs(q);
//     const expenses: Expense[] = [];
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       expenses.push({
//         id: doc.id,
//         date: data.date,
//         description: data.description,
//         price: data.price,
//         tag: data.tag
//       } as Expense);
//     });
//     console.log(`Fetched ${expenses.length} total expenses:`, expenses.map(e => `${e.tag}: ${e.price} (${e.date})`));
//     return expenses;
//   } catch (error) {
//     console.error("Error fetching all expenses: ", error);
//     return [];
//   }
// };

// Goal-related functions
export const getAllExpenses = async (): Promise<Expense[]> => {
  try {
    const uid = getCurrentUserId();
    console.log('Fetching all expenses from Firestore...');
    const q = query(
      collection(db, "users", uid, "expenses"),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // --- Parse Price ---
      let priceValue: number;
      if (typeof data.price === 'number') {
        priceValue = data.price;
      } else if (typeof data.price === 'string') {
        const cleaned = data.price.replace?.(/\./g, '') || data.price;
        const parsed = parseFloat(cleaned);
        priceValue = isNaN(parsed) ? 0 : parsed;
      } else {
        priceValue = 0;
      }

      expenses.push({
        id: doc.id,
        date: data.date,
        description: data.description || '',
        price: priceValue,
        tag: data.tag || 'Unknown'
      });
    });

    console.log(`Fetched ${expenses.length} total expenses:`, expenses.map(e => `${e.tag}: ${e.price} (${e.date})`));
    return expenses;
  } catch (error) {
    console.error("Error fetching all expenses: ", error);
    return [];
  }
};

export const addGoalToFirestore = async (goal: Omit<Goal, 'id'>): Promise<void> => {
  try {
    const uid = getCurrentUserId();
    const docRef = await addDoc(collection(db, "users", uid, "goals"), goal);
    console.log("Goal stored with ID: ", docRef.id);
    notifyDataChange();
  } catch (error) {
    console.error("Error adding goal to Firestore: ", error);
    throw error;
  }
};

export const deleteGoalFromFirestore = async (goalId: string): Promise<void> => {
  try {
    const uid = getCurrentUserId();
    await deleteDoc(doc(db, "users", uid, "goals", goalId));
    console.log("Goal deleted with ID: ", goalId);
    notifyDataChange();
  } catch (error) {
    console.error("Error deleting goal from Firestore: ", error);
    throw error;
  }
};

export const updateGoalInFirestore = async (goalId: string, updates: Partial<Omit<Goal, 'id'>>): Promise<void> => {
  try {
    const uid = getCurrentUserId();
    await updateDoc(doc(db, "users", uid, "goals", goalId), updates);
    console.log("Goal updated with ID: ", goalId);
    notifyDataChange();
  } catch (error) {
    console.error("Error updating goal in Firestore: ", error);
    throw error;
  }
};

export const getGoalsByMonthYear = async (monthYear: string): Promise<Goal[]> => {
  try {
    console.log(`Fetching goals for month-year: ${monthYear}`);
    const uid = getCurrentUserId();
    // Remove orderBy to avoid composite index requirement
    const q = query(
      collection(db, "users", uid, "goals"),
      where("monthYear", "==", monthYear)
    );

    const querySnapshot = await getDocs(q);
    const goals: Goal[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      goals.push({
        id: doc.id,
        text: data.text,
        completed: data.completed,
        monthYear: data.monthYear,
        createdAt: data.createdAt
      } as Goal);
    });

    // Sort on client side by createdAt descending (newest first)
    goals.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    console.log(`Fetched ${goals.length} goals for ${monthYear}`);
    return goals;
  } catch (error) {
    console.error("Error fetching goals by month-year: ", error);
    return [];
  }
};

export const getAllAvailableGoalMonths = async (): Promise<string[]> => {
  try {
    // Remove orderBy to avoid index requirements
    const uid = getCurrentUserId();
    const q = query(collection(db, "users", uid, "goals"));

    const querySnapshot = await getDocs(q);
    const months = new Set<string>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.monthYear) {
        months.add(data.monthYear);
      }
    });

    const sortedMonths = Array.from(months).sort((a, b) => {
      // Sort by year then month
      const [aMonth, aYear] = a.split(' ');
      const [bMonth, bYear] = b.split(' ');

      if (aYear !== bYear) {
        return parseInt(bYear) - parseInt(aYear); // Descending year
      }

      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return monthOrder.indexOf(bMonth) - monthOrder.indexOf(aMonth); // Descending month
    });

    console.log('Available goal months:', sortedMonths);
    return sortedMonths;
  } catch (error) {
    console.error("Error fetching available goal months: ", error);
    return [];
  }
};

// Debug function to test basic Firebase connectivity
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase connection...');
    const uid = getCurrentUserId();
    const q = query(collection(db, "users", uid, "expenses"));
    const querySnapshot = await getDocs(q);
    console.log(`Firebase connection successful. Found ${querySnapshot.size} total documents in expenses collection`);

    // Log first few documents for debugging
    let count = 0;
    querySnapshot.forEach((doc) => {
      if (count < 3) {
        console.log(`Sample expense ${count + 1}:`, {
          id: doc.id,
          data: doc.data()
        });
        count++;
      }
    });

    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};
