// Auth Stack Navigation Types
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

// Main App Tab Navigation Types
export type AppTabParamList = {
  Home: undefined;
  Budget: undefined;
  Expenses: undefined;
  Profile: undefined;
  Add: undefined;
  Goals: undefined;
  History: undefined;
  Investments: undefined;
  Calculator: undefined;
  CalculatorInfo: undefined;
};

// Root Navigation Types (if you need nested navigators)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};