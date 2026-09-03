import React from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, PlusCircle, Sparkles } from 'lucide-react';
import { Student, LOW_BALANCE_THRESHOLD } from '../types';

interface LowBalanceAlertProps {
  students?: Student[]; // for admin view
  currentStudent?: Student; // for student view
  onQuickTopUp?: (student: Student) => void;
  role: 'admin' | 'student';
}

export const LowBalanceAlert: React.FC<LowBalanceAlertProps> = ({
  students = [],
  currentStudent,
  onQuickTopUp,
  role,
}) => {
  if (role === 'student' && currentStudent) {
    if (currentStudent.balance > LOW_BALANCE_THRESHOLD) {
      return null;
    }

    const isZeroOrNegative = currentStudent.balance <= 0;

    return (
      <div
        className={`mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl border ${
          isZeroOrNegative
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
        } shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              isZeroOrNegative
                ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
            } shrink-0`}
          >
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm">
              {isZeroOrNegative
                ? 'Action Required: Your Balance is Exhausted!'
                : 'Low Balance Reminder (≤ Rs. 50)'}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              Your current available balance is{' '}
              <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                Rs. {currentStudent.balance.toFixed(2)}
              </span>
              . Please contact your Admin to record a balance top-up.
            </p>
          </div>
        </div>
        <div className="shrink-0 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300 shadow-2xs">
          Threshold: ≤ Rs. {LOW_BALANCE_THRESHOLD}
        </div>
      </div>
    );
  }

  // Admin View
  const lowStudents = students.filter((s) => s.balance <= LOW_BALANCE_THRESHOLD);
  if (lowStudents.length === 0) return null;

  return (
    <div className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              Low Balance Alerts ({lowStudents.length} Student{lowStudents.length > 1 ? 's' : ''})
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
              Students whose balance is Rs. {LOW_BALANCE_THRESHOLD} or below:
            </p>
          </div>
        </div>
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
          Alert Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {lowStudents.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between p-2.5 bg-white/90 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-900/60 rounded-xl shadow-2xs hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
          >
            <div className="min-w-0 pr-2">
              <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                {s.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {s.studentCustomId}
                </span>
                <span className="text-[11px] font-bold font-mono text-red-600 dark:text-red-400">
                  Rs. {s.balance.toFixed(2)}
                </span>
              </div>
            </div>

            {onQuickTopUp && (
              <button
                type="button"
                onClick={() => onQuickTopUp(s)}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="h-3 w-3" />
                <span>Top Up</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
