import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Mail,
  Lock,
  User,
  Building2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import {
  signInAdmin,
  signUpAdmin,
  signInAdminWithGoogle,
  loginStudent,
} from '../services/authService';
import { Student } from '../types';

interface AuthModalProps {
  onAdminAuthenticated: (user: { adminId: string; email: string; name: string }) => void;
  onStudentAuthenticated: (session: { adminId: string; student: Student }) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onAdminAuthenticated,
  onStudentAuthenticated,
  theme,
  onToggleTheme,
}) => {
  const [roleTab, setRoleTab] = useState<'admin' | 'student'>('admin');

  // Admin state
  const [adminMode, setAdminMode] = useState<'signin' | 'signup'>('signin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminGroup, setAdminGroup] = useState('Room 402 / Flatmates');

  // Student state
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [specificAdminId, setSpecificAdminId] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);

  // Google Sign In handler for Admin
  const handleGoogleSignIn = async () => {
    setError(null);
    setErrorHint(null);
    setLoading(true);

    try {
      const result = await signInAdminWithGoogle();
      onAdminAuthenticated({
        adminId: result.adminId,
        email: result.user.email || '',
        name: result.name || result.user.displayName || 'Admin',
      });
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Only one popup request is allowed at a time.');
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Admin Email/Password login / signup handler
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorHint(null);
    setLoading(true);

    try {
      if (adminMode === 'signup') {
        if (!adminEmail || !adminPassword || !adminName) {
          throw new Error('Please fill in all required fields.');
        }
        const result = await signUpAdmin(
          adminEmail,
          adminPassword,
          adminName,
          adminGroup
        );
        onAdminAuthenticated({
          adminId: result.adminId,
          email: result.email,
          name: result.name,
        });
      } else {
        if (!adminEmail || !adminPassword) {
          throw new Error('Please enter both email and password.');
        }
        const result = await signInAdmin(adminEmail, adminPassword);
        onAdminAuthenticated({
          adminId: result.adminId,
          email: result.email,
          name: result.name,
        });
      }
    } catch (err: any) {
      console.error('Admin Auth Error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password authentication is disabled in this Firebase project.';
        setErrorHint(
          'Please click "Continue with Google" above for instant 1-click sign in, or enable Email/Password in Firebase Console.'
        );
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        msg = 'Invalid email or password. Please try again or create a new account.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Student login handler
  const handleStudentSubmit = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setErrorHint(null);
    setLoading(true);

    const userToLogin = customUser || studentUsername;
    const passToLogin = customPass || studentPassword;

    try {
      if (!userToLogin || !passToLogin) {
        throw new Error('Please enter both student username and password.');
      }
      const result = await loginStudent(
        userToLogin,
        passToLogin,
        specificAdminId.trim() || undefined
      );
      onStudentAuthenticated(result);
    } catch (err: any) {
      console.error('Student login error:', err);
      setError(err.message || 'Login failed. Please check credentials assigned by your Admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-4 sm:py-8 px-2 sm:px-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Top App Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white text-center relative">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-2.5 border border-white/20 shadow-inner">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            My Spends
          </h2>
          <p className="text-[11px] sm:text-xs text-indigo-100 mt-0.5">
            Group balance pooling, split calculations, & real-time alerts
          </p>

          {/* Role Tabs */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-black/20 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setRoleTab('admin');
                setError(null);
                setErrorHint(null);
              }}
              className={`py-2 px-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleTab === 'admin'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-100 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Admin Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('student');
                setError(null);
                setErrorHint(null);
              }}
              className={`py-2 px-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleTab === 'student'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-100 hover:text-white'
              }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>Student Portal</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 rounded-xl text-xs space-y-1">
              <div className="flex items-start gap-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {errorHint && (
                <div className="pl-6 text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">
                  💡 {errorHint}
                </div>
              )}
            </div>
          )}

          {/* ADMIN AUTHENTICATION TAB */}
          {roleTab === 'admin' && (
            <div className="space-y-3.5">
              {/* Primary: Google Sign In Button */}
              <div className="relative group">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Recommended (Instant 1-Click)</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Active & Ready
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-bold text-xs rounded-xl border-2 border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-400 dark:text-slate-500 text-[10px] sm:text-[11px] font-semibold uppercase">
                  or email / password
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* Admin Signin / Signup Switch */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {adminMode === 'signin' ? 'Email Sign In' : 'Create Admin Account'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminMode(adminMode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                    setErrorHint(null);
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {adminMode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3">
                {adminMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="e.g. Nasir Bhatti"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hostel / Group Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={adminGroup}
                          onChange={(e) => setAdminGroup(e.target.value)}
                          placeholder="e.g. Room 402 Flatmates"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 min-h-[42px]"
                >
                  {loading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>{adminMode === 'signin' ? 'Sign In' : 'Complete Registration'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STUDENT AUTHENTICATION TAB */}
          {roleTab === 'student' && (
            <div className="space-y-3.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Student Sign In
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter credentials provided by your hostel admin.
                </p>
              </div>

              <form onSubmit={(e) => handleStudentSubmit(e)} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={studentUsername}
                      onChange={(e) => setStudentUsername(e.target.value)}
                      placeholder="e.g. aarav or rohan"
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 min-h-[42px]"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Open Student Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

