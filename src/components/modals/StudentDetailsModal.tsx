import React, { useState } from 'react';
import {
  X,
  User,
  Hash,
  Home,
  Phone,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Trash2,
  Edit2,
  Key,
  ShieldAlert,
  FileText,
  Download,
} from 'lucide-react';
import { Student, Expense, HistoryRecord, LOW_BALANCE_THRESHOLD } from '../../types';
import { exportStudentStatementPDF } from '../../utils/pdfExport';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  expenses: Expense[];
  history: HistoryRecord[];
  onOpenTopUp: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => Promise<void>;
  isAdmin?: boolean;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  onClose,
  student,
  expenses,
  history,
  onOpenTopUp,
  onDeleteStudent,
  isAdmin = false,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !student) return null;

  // Filter expenses and transactions relevant to this student
  const studentExpenses = expenses.filter((e) =>
    e.splitAmongStudentIds.includes(student.id)
  );

  const studentHistory = history.filter((h) =>
    h.studentIds.includes(student.id)
  );

  const isLowBalance = student.balance <= LOW_BALANCE_THRESHOLD;

  const handleDelete = async () => {
    if (!onDeleteStudent) return;
    try {
      setDeleting(true);
      await onDeleteStudent(student.id);
      onClose();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-lg truncate">
                  {student.name}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {student.studentCustomId}
                </span>
                {isLowBalance && (
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                    Low Balance
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                <span>User: <strong className="font-mono text-slate-700 dark:text-slate-300">{student.username}</strong></span>
                {student.roomNumber && (
                  <>
                    <span>•</span>
                    <span>Room: {student.roomNumber}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className={`p-3.5 sm:p-4 rounded-2xl border ${
              isLowBalance
                ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Available Balance
                </span>
                <Wallet className={`h-4 w-4 ${isLowBalance ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono mt-1 text-slate-900 dark:text-white">
                Rs. {student.balance.toFixed(2)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isLowBalance ? '⚠️ Needs top-up (≤ Rs. 50)' : 'Healthy account balance'}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Top-ups
                </span>
                <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                Rs. {student.totalTopup.toFixed(2)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Total funds handed over</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Spent
                </span>
                <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                Rs. {student.totalExpense.toFixed(2)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                From {studentExpenses.length} shared expense{studentExpenses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTopUp(student);
                }}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer min-h-[42px]"
              >
                <Wallet className="h-4 w-4" />
                <span>Top Up Balance for {student.name.split(' ')[0]}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                exportStudentStatementPDF({
                  student,
                  allExpenses: expenses,
                  allHistory: history,
                  groupName: 'Hostel / Mess Group',
                });
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer min-h-[42px]"
              title="Download official statement PDF"
            >
              <FileText className="h-4 w-4" />
              <span>Statement PDF</span>
            </button>

            {isAdmin && onDeleteStudent && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-colors cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center"
                title="Delete student"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Confirm Delete Banner */}
          {confirmDelete && (
            <div className="p-3.5 sm:p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
                <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                <span>
                  Delete <strong>{student.name}</strong>? This action cannot be undone.
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
                >
                  {deleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

          {/* Student Statement & Activity Timeline */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
              Activity History ({studentHistory.length} events)
            </h4>

            {studentHistory.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                No activity recorded yet for this student.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                {studentHistory.map((item) => {
                  const isTopup = item.type === 'topup';
                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs gap-2"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isTopup
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isTopup ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {item.description}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>
                              {new Date(item.timestamp || item.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                            {item.category && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">{item.category}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-1">
                        <div
                          className={`font-mono font-bold text-xs sm:text-sm ${
                            isTopup ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isTopup ? '+' : '-'}Rs.{' '}
                          {(item.perStudentShare || item.amount).toFixed(2)}
                        </div>
                        <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 block">
                          {isTopup ? 'Top-up' : 'Deducted'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer text-center min-h-[42px] flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
