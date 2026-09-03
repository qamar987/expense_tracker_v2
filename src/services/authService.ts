import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthState, Student, AdminProfile } from '../types';
import {
  setAdminProfile,
  getAdminProfile,
  authenticateStudent,
  registerAdminInDirectory,
  authenticateAdminInDirectory,
} from './firestoreService';

const ADMIN_SESSION_KEY = 'student_expense_tracker_admin_session';
const STUDENT_SESSION_KEY = 'student_expense_tracker_student_session';

export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
}

export interface StudentSession {
  adminId: string;
  studentId: string;
  username: string;
  name: string;
}

/**
 * Sign in Admin with Google via Popup
 */
export async function signInAdminWithGoogle(): Promise<{ user: User; adminId: string; name: string }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  let existingProfile: AdminProfile | null = null;
  try {
    existingProfile = await getAdminProfile(user.uid);
  } catch (err) {
    console.warn('Could not fetch existing admin profile on Google sign-in:', err);
  }

  const adminName = user.displayName || user.email?.split('@')[0] || 'Admin';

  if (!existingProfile) {
    try {
      await setAdminProfile(user.uid, {
        email: user.email || '',
        name: adminName,
        groupName: `${adminName}'s Student Group`,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn('Could not create initial admin profile on Google sign-in:', err);
    }
  }

  const sessionData: AdminSession = {
    adminId: user.uid,
    email: user.email || '',
    name: existingProfile?.name || adminName,
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));

  return {
    user,
    adminId: user.uid,
    name: existingProfile?.name || adminName,
  };
}

/**
 * Sign up a new Admin:
 * Attempts Firebase Auth first. If Email/Password is disabled in Firebase console,
 * seamlessly falls back to Firestore admin registration.
 */
export async function signUpAdmin(
  email: string,
  pass: string,
  name: string,
  groupName: string = 'My Student Group'
): Promise<{ user: User | null; adminId: string; name: string; email: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'Admin';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    if (cleanName) {
      await updateProfile(user, { displayName: cleanName });
    }

    await setAdminProfile(user.uid, {
      email: user.email || cleanEmail,
      name: cleanName,
      groupName: groupName || 'My Student Group',
      createdAt: Date.now(),
    });

    const sessionData: AdminSession = {
      adminId: user.uid,
      email: user.email || cleanEmail,
      name: cleanName,
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));

    return { user, adminId: user.uid, name: cleanName, email: cleanEmail };
  } catch (err: any) {
    // If Email/Password provider is disabled in Firebase Console, fallback to Firestore registration
    if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
      console.info('Firebase Auth email provider not enabled. Using Firestore Admin Directory fallback.');
      const result = await registerAdminInDirectory(cleanEmail, pass, cleanName, groupName);
      
      const sessionData: AdminSession = {
        adminId: result.adminId,
        email: result.email,
        name: result.name,
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));

      return { user: null, adminId: result.adminId, name: result.name, email: result.email };
    }
    throw err;
  }
}

/**
 * Sign in existing Admin:
 * Attempts Firebase Auth first. If Email/Password is disabled in Firebase console,
 * seamlessly authenticates against Firestore Admin Directory.
 */
export async function signInAdmin(
  email: string,
  pass: string
): Promise<{ user: User | null; adminId: string; name: string; email: string }> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;
    const profile = await getAdminProfile(user.uid);
    const adminName = profile?.name || user.displayName || cleanEmail.split('@')[0] || 'Admin';

    const sessionData: AdminSession = {
      adminId: user.uid,
      email: user.email || cleanEmail,
      name: adminName,
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));

    return { user, adminId: user.uid, name: adminName, email: user.email || cleanEmail };
  } catch (err: any) {
    // If Email/Password is disabled or user not found in Firebase Auth, check Firestore Admin Directory
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.message?.includes('operation-not-allowed')
    ) {
      console.info('Attempting Firestore Admin Directory authentication...');
      try {
        const result = await authenticateAdminInDirectory(cleanEmail, pass);
        const sessionData: AdminSession = {
          adminId: result.adminId,
          email: result.email,
          name: result.name,
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
        return { user: null, adminId: result.adminId, name: result.name, email: result.email };
      } catch (fallbackErr) {
        // If operation-not-allowed was the original error and directory lookup also failed, throw helpful message
        if (err.code === 'auth/operation-not-allowed') {
          throw new Error('Email/Password authentication is disabled in this Firebase project. You can Sign In with Google or create an account here.');
        }
        throw fallbackErr;
      }
    }
    throw err;
  }
}

/**
 * Sign out either Admin (Firebase Auth / local session) or Student (Session Clear)
 */
export async function logout(): Promise<void> {
  // Clear local sessions
  sessionStorage.removeItem(STUDENT_SESSION_KEY);
  localStorage.removeItem(STUDENT_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);

  // Sign out Firebase Auth
  if (auth.currentUser) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
  }
}

/**
 * Login for Student via username and password
 */
export async function loginStudent(
  username: string,
  password: string,
  adminId?: string
): Promise<{ adminId: string; student: Student }> {
  const result = await authenticateStudent(username, password, adminId);
  if (!result) {
    throw new Error('Invalid username or password. Please check credentials assigned by your Admin.');
  }

  const sessionData: StudentSession = {
    adminId: result.adminId,
    studentId: result.student.id,
    username: result.student.username,
    name: result.student.name,
  };

  localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(sessionData));
  return result;
}

/**
 * Get stored student session if present
 */
export function getStoredStudentSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(STUDENT_SESSION_KEY) || sessionStorage.getItem(STUDENT_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse student session:', e);
  }
  return null;
}

/**
 * Get stored admin session if present
 */
export function getStoredAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse admin session:', e);
  }
  return null;
}


