import React, { useState, useMemo } from 'react';
import {
  Users,
  Receipt,
  PlusCircle,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Calendar,
  Wallet,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Eye,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Layers,
  LayoutGrid,
  List,
  Building,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Student, Expense, HistoryRecord, LOW_BALANCE_THRESHOLD, EXPENSE_CATEGORIES } from '../types';
import { LowBalanceAlert } from './LowBalanceAlert';
import { exportHistoryPDF } from '../utils/pdfExport';

interface AdminDashboardProps {
  adminId: string;
  adminName: string;
  groupName?: string;
  students: Student[];
  expenses: Expense[];
  history: HistoryRecord[];
  onOpenAddExpense: () => void;
  onOpenAddStudent: () => void;
  onOpenTopUp: (student?: Student) => void;
  onSelectStudent: (student: Student) => void;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onDeleteHistory?: (historyId: string) => Promise<void>;
  onClearHistory?: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminId,
  adminName,
  groupName = 'Student Group',
  students,
  expenses,
  history,
  onOpenAddExpense,
  onOpenAddStudent,
  onOpenTopUp,
  onSelectStudent,
  onDeleteExpense,
  onDeleteStudent,
  onDeleteHistory,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'expenses' | 'history' | 'analytics'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'expense' | 'topup'>('all');
  const [studentViewMode, setStudentViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'name' | 'balance-asc' | 'balance-desc' | 'created'>('balance-asc');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    isProcessing?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Computed Metrics
  const totalStudents = students.length;
  const totalGroupBalance = useMemo(
    () => students.reduce((acc, s) => acc + (s.balance || 0), 0),
    [students]
  );
  const totalExpensesRecorded = useMemo(
    () => expenses.reduce((acc, e) => acc + (e.totalCost || 0), 0),
    [expenses]
  );
  const totalTopupsRecorded = useMemo(
    () => students.reduce((acc, s) => acc + (s.totalTopup || 0), 0),
    [students]
  );
  const lowBalanceStudents = useMemo(
    () => students.filter((s) => s.balance <= LOW_BALANCE_THRESHOLD),
    [students]
  );

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.studentCustomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.roomNumber && s.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'balance-asc') return a.balance - b.balance;
        if (sortBy === 'balance-desc') return b.balance - a.balance;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [students, searchQuery, sortBy]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const matchesType = historyTypeFilter === 'all' || h.type === historyTypeFilter;
      const matchesSearch =
        h.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.studentNames.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [history, historyTypeFilter, searchQuery]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + e.totalCost;
    });
    return map;
  }, [expenses]);

  // Handle Export PDF (Clean, formatted financial statement for mobile/print)
  const handleExportPDF = () => {
    if (history.length === 0 && expenses.length === 0) {
      alert('No history or expenses to export yet.');
      return;
    }
    exportHistoryPDF({
      history,
      expenses,
      students,
      groupName: groupName || 'Expense Group',
      adminName,
      filterType: historyTypeFilter,
    });
  };

  // Handle Export CSV (Raw data backup)
  const handleExportCSV = () => {
    if (history.length === 0 && expenses.length === 0) {
      alert('No history or expenses to export yet.');
      return;
    }

    const headers = [
      'Date',
      'Time',
      'Type',
      'Category',
      'Description / Title',
      'Total Cost (Rs)',
      'Per Student Share (Rs)',
      'Total Students Involved',
      'Students Involved',
    ];

    // Expense lookup map to get original picked date if available
    const expMap = new Map<string, Expense>();
    expenses.forEach((e) => expMap.set(e.id, e));

    const records = [...history].sort(
      (a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0)
    );

    const rows = records.map((h) => {
      const matchingExp = expMap.get(h.id);
      let formattedDate = '';

      if (matchingExp && matchingExp.date && matchingExp.date.includes('-')) {
        // Parse "YYYY-MM-DD" safely in local date to prevent timezone shift
        const parts = matchingExp.date.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          const localD = new Date(parts[0], parts[1] - 1, parts[2]);
          formattedDate = localD.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        }
      }

      const validMillis =
        typeof h.createdAt === 'number' && h.createdAt > 0
          ? h.createdAt
          : typeof h.timestamp === 'number' && h.timestamp > 0
          ? h.timestamp
          : Date.now();

      const timeObj = new Date(validMillis);

      if (!formattedDate) {
        formattedDate = timeObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }

      const formattedTime = timeObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const typeLabel = h.type === 'topup' ? 'Balance Top-Up' : 'Split Expense';
      const categoryLabel = h.category || (h.type === 'topup' ? 'Top-Up' : 'Expense');
      const escapedDesc = `"${(h.description || '').replace(/"/g, '""')}"`;
      const escapedStudents = `"${(h.studentNames || []).join(', ')}"`;
      const perShare =
        h.type === 'topup'
          ? '-'
          : h.perStudentShare
          ? h.perStudentShare.toFixed(2)
          : (h.amount / Math.max(1, (h.studentNames || []).length)).toFixed(2);

      return [
        `"${formattedDate}"`,
        `"${formattedTime}"`,
        `"${typeLabel}"`,
        `"${categoryLabel}"`,
        escapedDesc,
        h.amount.toFixed(2),
        perShare,
        (h.studentNames || []).length,
        escapedStudents,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `expense_tracker_history_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Admin Overview
            </h1>
            <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/80">
              Hostel / Group Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage students, add split expenses, and record balance top-ups.
          </p>
        </div>

        {/* Primary Action CTA Buttons */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px]"
          >
            <Receipt className="h-4 w-4" />
            <span>➕ Add Expense</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddStudent}
            className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Student</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTopUp()}
            className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px]"
          >
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span>Record Top-Up</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px]"
            title="Download complete financial and expense report as PDF"
          >
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Low Balance Warning Banner (≤ Rs. 50) */}
      <LowBalanceAlert
        role="admin"
        students={students}
        onQuickTopUp={(s) => onOpenTopUp(s)}
      />

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Students</span>
            <div className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalStudents}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {lowBalanceStudents.length > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
                {lowBalanceStudents.length} alert(s) ≤ Rs.{LOW_BALANCE_THRESHOLD}
              </span>
            ) : (
              'All balances healthy'
            )}
          </p>
        </div>

        {/* Group Pool Balance */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Pool Balance</span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 truncate">
            Rs. {totalGroupBalance.toFixed(0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">Across all students</p>
        </div>

        {/* Total Expenses Incurred */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Expenses</span>
            <div className="p-1.5 sm:p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white truncate">
            Rs. {totalExpensesRecorded.toFixed(0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{expenses.length} split records</p>
        </div>

        {/* Total Top-ups Contributed */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Top-ups</span>
            <div className="p-1.5 sm:p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl">
              <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white truncate">
            Rs. {totalTopupsRecorded.toFixed(0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">Handed over to admin</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Students ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Expenses ({expenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Audit Log ({history.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENTS & BALANCES */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Sort, & Layout switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name, ID, or room..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs py-1.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="balance-asc">Lowest Balance First (Alerts)</option>
                <option value="balance-desc">Highest Balance First</option>
                <option value="name">Name (A-Z)</option>
                <option value="created">Recently Added</option>
              </select>

              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setStudentViewMode('cards')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    studentViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="Card Grid"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStudentViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    studentViewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty Students State */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">No Students Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? 'No students matching your search criteria.'
                  : 'Start by adding students to your group so you can track top-ups and split expenses.'}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAddStudent}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Add First Student
                </button>
              </div>
            </div>
          ) : studentViewMode === 'cards' ? (
            /* CARD GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredStudents.map((student) => {
                const isLow = student.balance <= LOW_BALANCE_THRESHOLD;
                return (
                  <div
                    key={student.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                      isLow
                        ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-xs ${
                              isLow
                                ? 'bg-gradient-to-br from-amber-500 to-rose-600'
                                : 'bg-gradient-to-br from-indigo-600 to-violet-600'
                            }`}
                          >
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                              {student.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <span>{student.studentCustomId}</span>
                              {student.roomNumber && (
                                <>
                                  <span>•</span>
                                  <span>Room {student.roomNumber}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Low Balance Badge */}
                        {isLow && (
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-900/60 px-2 py-0.5 rounded-full animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            <span>≤ Rs.50</span>
                          </span>
                        )}
                      </div>

                      {/* Credentials Info */}
                      <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-2.5 mb-3 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Username:</span>
                          <strong className="font-mono text-slate-800 dark:text-slate-100">{student.username}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Password:</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">{student.password || '••••••'}</span>
                        </div>
                      </div>

                      {/* Balance & Spending Stat */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                            Available Balance
                          </span>
                          <span
                            className={`font-mono text-sm sm:text-base font-extrabold ${
                              isLow ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            Rs. {student.balance.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                            Total Spent
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            Rs. {student.totalExpense.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => onOpenTopUp(student)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Top Up</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectStudent(student)}
                        className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Details
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Student',
                            description: `Are you sure you want to remove "${student.name}" (${student.username})? This action cannot be undone.`,
                            confirmText: 'Delete Student',
                            onConfirm: async () => {
                              await onDeleteStudent(student.id);
                            },
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete student"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Student ID & Name</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Room #</th>
                      <th className="py-3 px-4">Available Balance</th>
                      <th className="py-3 px-4">Total Top-up</th>
                      <th className="py-3 px-4">Total Spent</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.map((student) => {
                      const isLow = student.balance <= LOW_BALANCE_THRESHOLD;
                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                            isLow ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                                  isLow ? 'bg-amber-500' : 'bg-indigo-600'
                                }`}
                              >
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{student.name}</span>
                                  {isLow && (
                                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-950/80 px-1.5 py-0.2 rounded-full">
                                      ≤50
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                  {student.studentCustomId}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {student.username}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {student.roomNumber || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isLow ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              Rs. {student.balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            Rs. {student.totalTopup.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            Rs. {student.totalExpense.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenTopUp(student)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] cursor-pointer"
                              >
                                Top Up
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectStudent(student)}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-[11px] cursor-pointer"
                              >
                                Statement
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Delete Student',
                                    description: `Are you sure you want to remove "${student.name}" (${student.username})? This action cannot be undone.`,
                                    confirmText: 'Delete Student',
                                    onConfirm: async () => {
                                      await onDeleteStudent(student.id);
                                    },
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                                title="Delete student"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expenses by title or note..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-1.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                title="Export all expenses to PDF report"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddExpense}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>New Expense</span>
              </button>
            </div>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">No Expenses Recorded</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Record an expense to split the cost automatically among student group members.
              </p>
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Record First Expense
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExpenses.map((expense) => {
                const participantCount = expense.splitAmongStudentIds.length;
                return (
                  <div
                    key={expense.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Title, Date, Category */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/80">
                              {expense.category || 'Expense'}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar className="h-3 w-3" />
                              {expense.date}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mt-1 line-clamp-1">
                            {expense.name}
                          </h4>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                            Rs. {expense.totalCost.toFixed(2)}
                          </div>
                          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold block">
                            Rs. {expense.perStudentShare.toFixed(2)} / person
                          </span>
                        </div>
                      </div>

                      {/* Notes if any */}
                      {expense.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-3 italic">
                          "{expense.notes}"
                        </p>
                      )}

                      {/* Split Participant Avatars / Names */}
                      <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 font-semibold text-[11px]">
                          <span>Split between {participantCount} student{participantCount > 1 ? 's' : ''}:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {expense.splitAmongStudentIds.map((sId) => {
                            const name = expense.studentNames?.[sId] || students.find((s) => s.id === sId)?.name || 'Student';
                            return (
                              <span
                                key={sId}
                                className="text-[11px] px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-200"
                              >
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom row delete / refund action */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Created: {new Date(expense.createdAt).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Expense & Refund',
                            description: `Are you sure you want to delete "${expense.name}" (Rs. ${expense.totalCost})? The split amount (Rs. ${expense.perStudentShare} per student) will be refunded automatically to all ${expense.splitAmongStudentIds.length} involved students.`,
                            confirmText: 'Delete & Refund',
                            onConfirm: async () => {
                              await onDeleteExpense(expense.id);
                            },
                          });
                        }}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Delete expense and refund student balances"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete & Refund</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT / TRANSACTION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction description or student..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="text-xs py-1.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses Only</option>
                <option value="topup">Top-Ups Only</option>
              </select>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={history.length === 0 && expenses.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Download formatted PDF Financial Report"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={history.length === 0 && expenses.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Export raw CSV data"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              {onClearHistory && history.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Clear All History Records',
                      description:
                        'Are you sure you want to clear all transaction logs? (Note: Student balances and expense records will remain untouched).',
                      confirmText: 'Clear All History',
                      onConfirm: async () => {
                        if (onClearHistory) {
                          await onClearHistory();
                        }
                      },
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer shrink-0"
                  title="Clear all transaction history logs"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span className="hidden sm:inline">Clear History</span>
                </button>
              )}
            </div>
          </div>

          {/* History Feed */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">No transaction records found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Every top-up and expense is logged here chronologically.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHistory.map((item) => {
                const isTopup = item.type === 'topup';
                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                          isTopup
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {isTopup ? (
                          <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isTopup
                                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {isTopup ? 'Balance Top-Up' : 'Split Expense'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(item.timestamp || item.createdAt).toLocaleDateString(
                              undefined,
                              { month: 'short', day: 'numeric', year: 'numeric' }
                            )}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1 break-words">
                          {item.description}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Involved: <strong className="text-slate-700 dark:text-slate-300">{item.studentNames.join(', ')}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <div className="sm:text-right">
                        <div
                          className={`text-base sm:text-lg font-extrabold font-mono ${
                            isTopup ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isTopup ? '+' : '-'}Rs. {item.amount.toFixed(2)}
                        </div>
                        {item.perStudentShare && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                            (Rs. {item.perStudentShare.toFixed(2)} per student)
                          </span>
                        )}
                      </div>

                      {/* Small Delete Button for History Item */}
                      {onDeleteHistory && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Delete History Record',
                              description: `Are you sure you want to delete this history log?\n\n"${item.description}"`,
                              confirmText: 'Delete Record',
                              onConfirm: async () => {
                                if (onDeleteHistory) {
                                  await onDeleteHistory(item.id);
                                }
                              },
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete this history record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ANALYTICS & CATEGORY BREAKDOWN */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Category-wise spending */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Expense Category Breakdown</h3>
            <div className="space-y-3">
              {EXPENSE_CATEGORIES.map((cat) => {
                const total = categoryBreakdown[cat] || 0;
                const pct = totalExpensesRecorded > 0 ? (total / totalExpensesRecorded) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>{cat}</span>
                      <span className="font-mono">
                        Rs. {total.toFixed(0)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Balance Distribution */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Student Balance Distribution</h3>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {students.map((student) => {
                const isLow = student.balance <= LOW_BALANCE_THRESHOLD;
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{student.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                          {student.studentCustomId}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono text-xs font-extrabold ${
                          isLow ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        Rs. {student.balance.toFixed(2)}
                      </span>
                      {isLow && (
                        <span className="text-[9px] text-red-600 dark:text-red-400 font-bold block uppercase">
                          Low Balance
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Custom In-App Confirmation Modal (Bypasses iframe alert/confirm limitations) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={confirmModal.isProcessing}
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmModal.isProcessing}
                onClick={async () => {
                  setConfirmModal((prev) => (prev ? { ...prev, isProcessing: true } : null));
                  try {
                    await confirmModal.onConfirm();
                  } finally {
                    setConfirmModal(null);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {confirmModal.isProcessing ? (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
