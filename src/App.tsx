/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import {
  AuthState,
  Student,
  Expense,
  HistoryRecord,
  AdminProfile,
  LOW_BALANCE_THRESHOLD,
} from './types';
import {
  subscribeToStudents,
  subscribeToExpenses,
  subscribeToHistory,
  subscribeToStudent,
  getAdminProfile,
  addStudent,
  addExpense,
  topUpStudentBalance,
  deleteStudent,
  deleteExpense,
  deleteHistoryRecord,
  clearAllHistory,
} from './services/firestoreService';
import {
  logout,
  getStoredStudentSession,
  getStoredAdminSession,
  loginStudent,
} from './services/authService';

import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { AddStudentModal } from './components/modals/AddStudentModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { TopUpModal } from './components/modals/TopUpModal';
import { StudentDetailsModal } from './components/modals/StudentDetailsModal';
import { Wallet, Sparkles } from 'lucide-react';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Theme State (Dark / Light Mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('expensetrack_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('expensetrack_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Group Data State (Real-time Firestore)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Modals state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpTargetStudent, setTopUpTargetStudent] = useState<Student | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // 1. Check Initial Authentication (Firebase Auth for Admin, Session for Student)
  useEffect(() => {
    let isMounted = true;

    // Check Firebase Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Admin is signed in
        let profile: AdminProfile | null = null;
        try {
          profile = await getAdminProfile(firebaseUser.uid);
        } catch (err) {
          console.warn('Could not fetch admin profile in onAuthStateChanged:', err);
        }
        if (isMounted) {
          setAdminProfile(profile);
          setAuthState({
            role: 'admin',
            adminId: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: profile?.name || firebaseUser.displayName || 'Admin',
          });
          setLoadingAuth(false);
        }
      } else {
        // Check if admin session exists in localStorage (e.g. Email/Password directory or demo session)
        const adminSession = getStoredAdminSession();
        if (adminSession && isMounted) {
          let profile: AdminProfile | null = null;
          try {
            profile = await getAdminProfile(adminSession.adminId);
          } catch (err) {
            console.warn('Could not fetch stored admin profile:', err);
          }
          if (isMounted) {
            setAdminProfile(profile);
            setAuthState({
              role: 'admin',
              adminId: adminSession.adminId,
              email: adminSession.email,
              name: profile?.name || adminSession.name || 'Admin',
            });
            setLoadingAuth(false);
          }
          return;
        }

        // Check if student session exists in localStorage
        const studentSession = getStoredStudentSession();
        if (studentSession && isMounted) {
          // Verify student existence in Firestore
          setAuthState({
            role: 'student',
            adminId: studentSession.adminId,
            student: {
              id: studentSession.studentId,
              studentCustomId: '',
              name: studentSession.name,
              username: studentSession.username,
              balance: 0,
              totalTopup: 0,
              totalExpense: 0,
              createdAt: Date.now(),
            },
          });
        } else if (isMounted) {
          setAuthState(null);
        }
        if (isMounted) setLoadingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  // 2. Real-time Firestore Subscriptions when logged in
  useEffect(() => {
    if (!authState) {
      setStudents([]);
      setExpenses([]);
      setHistory([]);
      return;
    }

    const adminId = authState.adminId;

    // Load admin profile metadata
    getAdminProfile(adminId)
      .then((prof) => {
        if (prof) setAdminProfile(prof);
      })
      .catch((err) => {
        console.warn('Could not load admin profile:', err);
      });

    // Subscribe to students
    const unsubStudents = subscribeToStudents(adminId, (updatedStudents) => {
      setStudents(updatedStudents);

      // If logged in as student, update current student object
      if (authState.role === 'student') {
        const found = updatedStudents.find((s) => s.id === authState.student.id);
        if (found) {
          setAuthState({
            role: 'student',
            adminId: adminId,
            student: found,
          });
        }
      }
    });

    // Subscribe to expenses
    const unsubExpenses = subscribeToExpenses(adminId, (updatedExpenses) => {
      setExpenses(updatedExpenses);
    });

    // Subscribe to history
    const unsubHistory = subscribeToHistory(adminId, (updatedHistory) => {
      setHistory(updatedHistory);
    });

    return () => {
      unsubStudents();
      unsubExpenses();
      unsubHistory();
    };
  }, [authState?.adminId, authState?.role]);

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setAuthState(null);
    setStudents([]);
    setExpenses([]);
    setHistory([]);
    setAdminProfile(null);
    showToast('Successfully logged out.');
  };

  // Admin Actions
  const handleAddStudent = async (data: {
    studentCustomId: string;
    name: string;
    username: string;
    password?: string;
    initialBalance: number;
    phone?: string;
    roomNumber?: string;
  }) => {
    if (authState?.role !== 'admin') return;
    await addStudent(authState.adminId, data);
    showToast(`Added student ${data.name} with initial balance of Rs. ${data.initialBalance}`);
  };

  const handleAddExpense = async (data: {
    name: string;
    totalCost: number;
    selectedStudentIds: string[];
    category: Expense['category'];
    date: string;
    notes?: string;
  }) => {
    if (authState?.role !== 'admin') return;
    await addExpense(authState.adminId, data);
    const count = data.selectedStudentIds.length;
    const perShare = (data.totalCost / count).toFixed(2);
    showToast(`Recorded "${data.name}" (Rs. ${data.totalCost}). Deducted Rs. ${perShare} each from ${count} students.`);
  };

  const handleTopUp = async (studentId: string, amount: number, note?: string) => {
    if (authState?.role !== 'admin') return;
    await topUpStudentBalance(authState.adminId, studentId, amount, note);
    const student = students.find((s) => s.id === studentId);
    showToast(`Successfully credited Rs. ${amount} to ${student?.name || 'student'}'s balance.`);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (authState?.role !== 'admin') return;
    const student = students.find((s) => s.id === studentId);
    try {
      await deleteStudent(authState.adminId, studentId);
      showToast(`Deleted student ${student?.name || ''}`);
    } catch (err: any) {
      console.error('Error deleting student:', err);
      showToast('Failed to delete student: ' + (err?.message || 'Error occurred'));
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (authState?.role !== 'admin') return;
    try {
      await deleteExpense(authState.adminId, expenseId);
      showToast('Deleted expense and refunded per-student shares.');
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      showToast('Failed to delete expense: ' + (err?.message || 'Error occurred'));
    }
  };

  const handleDeleteHistory = async (historyId: string) => {
    if (authState?.role !== 'admin') return;
    try {
      await deleteHistoryRecord(authState.adminId, historyId);
      showToast('Deleted history record.');
    } catch (err: any) {
      console.error('Error deleting history record:', err);
      showToast('Failed to delete history: ' + (err?.message || 'Permission denied'));
    }
  };

  const handleClearHistory = async () => {
    if (authState?.role !== 'admin') return;
    try {
      await clearAllHistory(authState.adminId);
      showToast('Cleared all history logs.');
    } catch (err: any) {
      console.error('Error clearing history:', err);
      showToast('Failed to clear history: ' + (err?.message || 'Permission denied'));
    }
  };

  const lowBalanceCount = students.filter((s) => s.balance <= LOW_BALANCE_THRESHOLD).length;

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute w-80 h-80 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl pointer-events-none -top-12 -left-12 animate-pulse"></div>
        <div className="absolute w-80 h-80 rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-3xl pointer-events-none -bottom-12 -right-12 animate-pulse delay-500"></div>

        <div className="relative text-center flex flex-col items-center space-y-4 max-w-sm w-full px-8 py-10 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl shadow-indigo-500/10">
          {/* Glowing Animated Icon Badge */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 opacity-60 blur-md animate-pulse"></div>
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Wallet className="h-8 w-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
          </div>

          {/* Title and Tagline */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-300 dark:to-purple-300 bg-clip-text text-transparent">
              My Spends
            </h1>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              Smart Shared Balances & Expenses
            </p>
          </div>

          {/* Smooth animated loader */}
          <div className="w-40 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full animate-pulse w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors overflow-x-hidden w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xl border border-slate-800 dark:border-slate-700 flex items-center gap-2 animate-bounce">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        authState={authState}
        onLogout={handleLogout}
        lowBalanceCount={lowBalanceCount}
        groupName={adminProfile?.groupName || 'Hostel Student Group'}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 overflow-x-hidden">
        {!authState ? (
          /* Authentication Screen (Admin & Student tabs) */
          <AuthModal
            onAdminAuthenticated={(user) => {
              setAuthState({
                role: 'admin',
                adminId: user.adminId,
                email: user.email,
                name: user.name,
              });
              showToast(`Welcome back, ${user.name}!`);
            }}
            onStudentAuthenticated={({ adminId, student }) => {
              setAuthState({
                role: 'student',
                adminId,
                student,
              });
              showToast(`Logged in as ${student.name}`);
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        ) : authState.role === 'admin' ? (
          /* Admin Dashboard */
          <AdminDashboard
            adminId={authState.adminId}
            adminName={authState.name}
            groupName={adminProfile?.groupName}
            students={students}
            expenses={expenses}
            history={history}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenAddStudent={() => setIsAddStudentOpen(true)}
            onOpenTopUp={(student) => {
              setTopUpTargetStudent(student || null);
              setIsTopUpOpen(true);
            }}
            onSelectStudent={(student) => {
              setSelectedStudentForModal(student);
            }}
            onDeleteExpense={handleDeleteExpense}
            onDeleteStudent={handleDeleteStudent}
            onDeleteHistory={handleDeleteHistory}
            onClearHistory={handleClearHistory}
          />
        ) : (
          /* Student Dashboard (Read-Only) */
          <StudentDashboard
            currentStudent={authState.student}
            allStudents={students}
            allExpenses={expenses}
            allHistory={history}
            groupName={adminProfile?.groupName}
          />
        )}
      </main>

      {/* MODALS */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
        existingCount={students.length}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        students={students}
        onAddExpense={handleAddExpense}
      />

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => {
          setIsTopUpOpen(false);
          setTopUpTargetStudent(null);
        }}
        students={students}
        preSelectedStudent={topUpTargetStudent}
        onTopUp={handleTopUp}
      />

      <StudentDetailsModal
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        student={selectedStudentForModal}
        expenses={expenses}
        history={history}
        isAdmin={authState?.role === 'admin'}
        onOpenTopUp={(student) => {
          setTopUpTargetStudent(student);
          setIsTopUpOpen(true);
        }}
        onDeleteStudent={handleDeleteStudent}
      />
    </div>
  );
}
