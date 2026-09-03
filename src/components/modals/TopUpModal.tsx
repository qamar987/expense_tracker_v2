import React, { useState, useEffect } from 'react';
import { X, PlusCircle, ArrowUpRight, CheckCircle2, User, Wallet, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student } from '../../types';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preSelectedStudent?: Student | null;
  onTopUp: (studentId: string, amount: number, note?: string) => Promise<void>;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  students,
  preSelectedStudent,
  onTopUp,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [amount, setAmount] = useState<string>('500');
  const [note, setNote] = useState<string>('Cash contribution handed over');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedStudent) {
        setSelectedStudentId(preSelectedStudent.id);
      } else if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(students[0].id);
      }
      setAmount('500');
      setError(null);
    }
  }, [isOpen, preSelectedStudent, students]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const currentBalance = currentStudent ? currentStudent.balance : 0;
  const numAmount = parseFloat(amount) || 0;
  const projectedBalance = currentBalance + numAmount;

  const quickAmounts = [100, 200, 500, 1000, 2000];

  const handleQuickSelect = (amt: number) => {
    setAmount(amt.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStudentId) {
      setError('Please select a student to top up.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter an amount greater than zero.');
      return;
    }

    try {
      setLoading(true);
      await onTopUp(selectedStudentId, numAmount, note.trim());

      // Trigger celebratory confetti on top-up!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record balance top-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-2xl shrink-0">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">Record Balance Top-Up</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Credit funds contributed by student
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Student Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Student *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.studentCustomId}) — Current: Rs. {student.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top-up Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount Handed Over (Rs.) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400 pointer-events-none">
                Rs.
              </span>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="w-full pl-11 pr-3.5 py-2.5 text-base border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickSelect(amt)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-semibold transition-all cursor-pointer min-h-[36px] flex items-center justify-center ${
                    numAmount === amt
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  +Rs.{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Balance Preview Card */}
          {currentStudent && (
            <div className="p-3.5 sm:p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>Current Balance:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  Rs. {currentBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>Top-up Credit:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +Rs. {numAmount.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-emerald-200/60 dark:border-emerald-800/60 my-2"></div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="h-4 w-4" />
                  New Balance:
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  Rs. {projectedBalance.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Note / Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Handover Note / Remarks (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid in Cash, UPI ref #12345"
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer text-center min-h-[42px] flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-2 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            {loading ? (
              <span>Crediting...</span>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                <span>Credit Rs. {numAmount || 0}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
