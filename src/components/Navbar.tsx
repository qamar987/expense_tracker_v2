import React from 'react';
import {
  Wallet,
  ShieldCheck,
  GraduationCap,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { AuthState } from '../types';

interface NavbarProps {
  authState: AuthState;
  onLogout: () => void;
  lowBalanceCount?: number;
  onOpenLowBalanceModal?: () => void;
  groupName?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  authState,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-xs shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base leading-tight">
                Expense Tracker
              </span>
              {authState && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.5 rounded border border-indigo-200/70 dark:border-indigo-800/70 inline-block leading-none">
                    {authState.role === 'admin' ? 'ADMIN' : 'STUDENT'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Actions Toolbar (Right Corner) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle Dark Mode"
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>

            {/* User Profile with Logout Button directly underneath in the right corner */}
            {authState && (
              <div className="flex flex-col items-end justify-center shrink-0 text-right pl-1">
                <div className="flex items-center gap-1.5">
                  {authState.role === 'admin' ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  ) : (
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[180px]">
                    {authState.role === 'admin'
                      ? authState.name || 'Admin'
                      : authState.student.name}
                  </span>
                </div>
                
                {/* Logout Button placed right below */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-all cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="h-3 w-3 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

