export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  groupName?: string;
  createdAt: number;
}

export interface Student {
  id: string;
  studentCustomId: string; // e.g. STU-101
  name: string;
  username: string;
  password?: string; // stored for student login checking by admin/student portal
  balance: number; // Current remaining balance ("Added Amount" minus expenses)
  totalTopup: number; // Cumulative total contributed/handed over
  totalExpense: number; // Cumulative total spent
  phone?: string;
  roomNumber?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Expense {
  id: string;
  name: string; // Expense title e.g. "Monthly Wifi Bill", "Dinner & Snacks"
  totalCost: number;
  splitAmongStudentIds: string[]; // List of student IDs this expense applies to
  studentNames?: Record<string, string>; // Map of studentId -> student name at time of expense
  perStudentShare: number; // Calculated share = totalCost / splitAmongStudentIds.length
  category: 'Food' | 'Groceries' | 'Rent' | 'Utilities' | 'Study Material' | 'Outing' | 'Travel' | 'Other';
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
  createdBy?: string;
}

export interface HistoryRecord {
  id: string;
  type: 'expense' | 'topup';
  studentIds: string[]; // IDs of students involved
  studentNames: string[]; // Names of students involved
  amount: number; // Total amount of transaction
  perStudentShare?: number; // Per-student amount if expense
  description: string;
  category?: string;
  timestamp: number; // Unix timestamp
  createdAt: number;
}

export type AuthState = 
  | { role: 'admin'; adminId: string; email: string; name: string }
  | { role: 'student'; adminId: string; student: Student }
  | null;

export const LOW_BALANCE_THRESHOLD = 50; // Rs. 50 warning limit

export const EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Rent',
  'Utilities',
  'Study Material',
  'Outing',
  'Travel',
  'Other',
] as const;
