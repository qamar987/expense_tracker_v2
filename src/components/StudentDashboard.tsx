import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Users,
  Receipt,
  AlertCircle,
  Clock,
  Tag,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Download,
} from 'lucide-react';
import { Student, Expense, HistoryRecord, LOW_BALANCE_THRESHOLD } from '../types';
import { LowBalanceAlert } from './LowBalanceAlert';
import { exportStudentStatementPDF } from '../utils/pdfExport';

interface StudentDashboardProps {
  currentStudent: Student;
  allStudents: Student[];
  allExpenses: Expense[];
  allHistory: HistoryRecord[];
  groupName?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentStudent,
  allStudents,
  allExpenses,
  allHistory,
  groupName = 'Student Group',
}) => {
  const [activeTab, setActiveTab] = useState<'my-expenses' | 'my-topups' | 'group-balances' | 'group-history'>('my-expenses');

  const isLowBalance = currentStudent.balance <= LOW_BALANCE_THRESHOLD;

  // Filter expenses where this student is a participant
  const myExpenses = useMemo(() => {
    return allExpenses.filter((e) =>
      e.splitAmongStudentIds.includes(currentStudent.id)
    );
  }, [allExpenses, currentStudent.id]);

  // Filter top-ups for this student
  const myTopUps = useMemo(() => {
    return allHistory.filter(
      (h) => h.type === 'topup' && h.studentIds.includes(currentStudent.id)
    );
  }, [allHistory, currentStudent.id]);

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome, {currentStudent.name}
            </h1>
            <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/80">
              Student Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Student ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{currentStudent.studentCustomId}</strong>
            {currentStudent.roomNumber && ` • Room: ${currentStudent.roomNumber}`}
            {` • ${groupName}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              exportStudentStatementPDF({
                student: currentStudent,
                allExpenses,
                allHistory,
                groupName,
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Download your personal financial statement as PDF"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Download Statement PDF</span>
          </button>

          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Real-time Synced</span>
          </div>
        </div>
      </div>

      {/* Low Balance Alert Banner for Student */}
      <LowBalanceAlert
        role="student"
        currentStudent={currentStudent}
      />

      {/* Personal Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Main Available Balance Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${
          isLowBalance
            ? 'bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-950/40 dark:to-amber-950/30 border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-200'
            : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-950/20 border-emerald-600 dark:border-emerald-700'
        }`}>
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              My Available Balance
            </span>
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight mt-1 sm:mt-2">
            Rs. {currentStudent.balance.toFixed(2)}
          </div>
          <div className="mt-2 text-xs font-medium flex items-center justify-between">
            <span>
              {isLowBalance
                ? '⚠️ Low Balance (≤ Rs. 50)'
                : 'Account in good standing'}
            </span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              isLowBalance ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-white/20 text-white'
            }`}>
              {isLowBalance ? 'Top-Up Needed' : 'Active'}
            </span>
          </div>
        </div>

        {/* Total Contributed / Top-up */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
              Total Added (Top-Ups)
            </span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 sm:mt-2">
            Rs. {currentStudent.totalTopup.toFixed(2)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Cumulative money handed over to admin
          </p>
        </div>

        {/* Total Spent / Expense Share */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
              Total Expenses Share
            </span>
            <div className="p-1.5 sm:p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 sm:mt-2">
            Rs. {currentStudent.totalExpense.toFixed(2)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across {myExpenses.length} shared group expense{myExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('my-expenses')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'my-expenses'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>My Expenses ({myExpenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-topups')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'my-topups'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>My Top-Ups ({myTopUps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('group-balances')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'group-balances'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Group Balances (Read-Only)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('group-history')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'group-history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Group History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MY EXPENSES & SPLITS */}
      {activeTab === 'my-expenses' && (
        <div className="space-y-4">
          {myExpenses.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No Shared Expenses Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You haven't been included in any split expenses by the admin yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myExpenses.map((expense) => {
                const totalParticipants = expense.splitAmongStudentIds.length;
                return (
                  <div
                    key={expense.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between"
                  >
                    <div>
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

                        {/* Student's deducted share */}
                        <div className="text-right shrink-0">
                          <div className="text-base font-mono font-extrabold text-rose-600 dark:text-rose-400">
                            -Rs. {expense.perStudentShare.toFixed(2)}
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            Total: Rs. {expense.totalCost.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {expense.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-3 italic">
                          "{expense.notes}"
                        </p>
                      )}

                      <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold block mb-1">
                          Split among {totalParticipants} students ({expense.perStudentShare.toFixed(2)} each):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {expense.splitAmongStudentIds.map((sId) => {
                            const isMe = sId === currentStudent.id;
                            const name = isMe
                              ? 'You'
                              : expense.studentNames?.[sId] ||
                                allStudents.find((s) => s.id === sId)?.name ||
                                'Student';
                            return (
                              <span
                                key={sId}
                                className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                  isMe
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      Logged on {new Date(expense.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY TOP-UPS */}
      {activeTab === 'my-topups' && (
        <div className="space-y-4">
          {myTopUps.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No Top-ups Recorded Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When you hand over funds to the admin, your top-up records will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {myTopUps.map((topup) => (
                <div
                  key={topup.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-xl">
                      <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {topup.description}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {new Date(topup.timestamp || topup.createdAt).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                    +Rs. {topup.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GROUP BALANCES (READ-ONLY) */}
      {activeTab === 'group-balances' && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>
              Showing read-only balances of all students in <strong>{groupName}</strong>
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{allStudents.length} Students</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {allStudents.map((student) => {
              const isMe = student.id === currentStudent.id;
              const isLow = student.balance <= LOW_BALANCE_THRESHOLD;
              return (
                <div
                  key={student.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs transition-all ${
                    isMe
                      ? 'ring-2 ring-indigo-500 border-indigo-200 dark:border-indigo-700 bg-indigo-50/10 dark:bg-indigo-950/20'
                      : isLow
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                            {student.name}
                          </h4>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-600 text-white font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {student.studentCustomId}
                        </span>
                      </div>
                    </div>

                    {isLow && (
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/60">
                        Low Bal
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Current Balance
                    </span>
                    <span
                      className={`font-mono text-sm sm:text-base font-extrabold ${
                        isLow ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      Rs. {student.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: GROUP HISTORY (READ-ONLY) */}
      {activeTab === 'group-history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
            {allHistory.map((item) => {
              const isTopup = item.type === 'topup';
              const includesMe = item.studentIds.includes(currentStudent.id);
              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    includesMe ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isTopup
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {isTopup ? 'Top-Up' : 'Expense'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(item.timestamp || item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">
                        {item.description}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Involved: <span className="font-medium text-slate-700 dark:text-slate-300">{item.studentNames.join(', ')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {isTopup ? '+' : '-'}Rs. {item.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
