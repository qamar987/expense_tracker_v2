import React, { useState } from 'react';
import { X, UserPlus, Key, Hash, Phone, Home, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (data: {
    studentCustomId: string;
    name: string;
    username: string;
    password?: string;
    initialBalance: number;
    phone?: string;
    roomNumber?: string;
  }) => Promise<void>;
  existingCount: number;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  existingCount,
}) => {
  const [name, setName] = useState('');
  const [studentCustomId, setStudentCustomId] = useState(
    `STU-${String(existingCount + 101).padStart(3, '0')}`
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [initialBalance, setInitialBalance] = useState<string>('500');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate username from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username === name.toLowerCase().replace(/\s+/g, '')) {
      setUsername(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter the student full name.');
      return;
    }
    if (!username.trim()) {
      setError('Please enter a login username for the student.');
      return;
    }
    if (!password.trim()) {
      setError('Please assign a password for the student login.');
      return;
    }

    try {
      setLoading(true);
      await onAddStudent({
        name: name.trim(),
        studentCustomId: studentCustomId.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        initialBalance: parseFloat(initialBalance) || 0,
        phone: phone.trim(),
        roomNumber: roomNumber.trim(),
      });
      onClose();
      // Reset form
      setName('');
      setUsername('');
      setPassword('');
      setInitialBalance('500');
      setPhone('');
      setRoomNumber('');
    } catch (err: any) {
      setError(err.message || 'Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-2xl shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">Add New Student</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Admin-assigned profile and login credentials
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student ID
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={studentCustomId}
                  onChange={(e) => setStudentCustomId(e.target.value)}
                  placeholder="e.g. STU-101"
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Room / Bed */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room / Flat # (Optional)
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 402-A"
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Student Login Credentials Section */}
          <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Student Login Credentials
              </span>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Auto-generate
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 text-base sm:text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 pr-8 py-2 text-base sm:text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Student uses these simple credentials to log in and track their share.
            </p>
          </div>

          {/* Initial Balance Top-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Balance Top-up (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400 pointer-events-none">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="500"
                  className="w-full pl-11 pr-3 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Cash handed over upfront.
              </span>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 / +91..."
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
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
            className="flex-2 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            {loading ? (
              <span>Adding Student...</span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Student</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
