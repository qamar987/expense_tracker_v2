import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  writeBatch,
  where,
  collectionGroup,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Student, Expense, HistoryRecord, AdminProfile } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Creates or updates the Admin profile document in Firestore
 */
export async function setAdminProfile(adminId: string, data: Partial<AdminProfile>): Promise<void> {
  const path = `admins/${adminId}`;
  try {
    const adminRef = doc(db, 'admins', adminId);
    await setDoc(adminRef, {
      ...data,
      id: adminId,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Gets Admin profile
 */
export async function getAdminProfile(adminId: string): Promise<AdminProfile | null> {
  const path = `admins/${adminId}`;
  try {
    const adminRef = doc(db, 'admins', adminId);
    const snap = await getDoc(adminRef);
    if (snap.exists()) {
      return snap.data() as AdminProfile;
    }
    return null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('unavailable')) {
      console.warn(`Firestore getAdminProfile offline/unavailable for ${adminId}:`, msg);
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Register Admin in directory (Works even if Firebase Auth email provider is disabled in console)
 */
export async function registerAdminInDirectory(
  email: string,
  pass: string,
  name: string,
  groupName: string = 'My Student Group'
): Promise<{ adminId: string; name: string; email: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const cleanName = name.trim() || 'Admin';
  const adminId = `adm_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

  const adminDirRef = doc(db, 'admin_directory', cleanEmail);
  const existingDir = await getDoc(adminDirRef);
  if (existingDir.exists()) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const batch = writeBatch(db);
  batch.set(adminDirRef, {
    email: cleanEmail,
    password: cleanPass,
    adminId: adminId,
    name: cleanName,
    groupName: groupName.trim() || 'My Student Group',
    createdAt: Date.now(),
  });

  const adminRef = doc(db, 'admins', adminId);
  batch.set(adminRef, {
    id: adminId,
    email: cleanEmail,
    name: cleanName,
    groupName: groupName.trim() || 'My Student Group',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, { merge: true });

  await batch.commit();
  return { adminId, name: cleanName, email: cleanEmail };
}

/**
 * Authenticate Admin from directory (Works even if Firebase Auth email provider is disabled in console)
 */
export async function authenticateAdminInDirectory(
  email: string,
  pass: string
): Promise<{ adminId: string; name: string; email: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  const adminDirRef = doc(db, 'admin_directory', cleanEmail);
  const snap = await getDoc(adminDirRef);
  if (!snap.exists()) {
    throw new Error('No admin account found with this email. Please sign up or continue with Google.');
  }

  const data = snap.data();
  if (data.password !== cleanPass) {
    throw new Error('Incorrect password. Please try again or use Continue with Google.');
  }

  return {
    adminId: data.adminId,
    name: data.name || 'Admin',
    email: data.email || cleanEmail,
  };
}


/**
 * Subscribe in real-time to the students subcollection of an admin
 */
export function subscribeToStudents(
  adminId: string,
  onUpdate: (students: Student[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `admins/${adminId}/students`;
  const studentsRef = collection(db, 'admins', adminId, 'students');
  const q = query(studentsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const students: Student[] = [];
      snapshot.forEach((docSnap) => {
        students.push({ id: docSnap.id, ...docSnap.data() } as Student);
      });
      onUpdate(students);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Subscribe in real-time to the expenses subcollection of an admin
 */
export function subscribeToExpenses(
  adminId: string,
  onUpdate: (expenses: Expense[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `admins/${adminId}/expenses`;
  const expensesRef = collection(db, 'admins', adminId, 'expenses');
  const q = query(expensesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses: Expense[] = [];
      snapshot.forEach((docSnap) => {
        expenses.push({ id: docSnap.id, ...docSnap.data() } as Expense);
      });
      onUpdate(expenses);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Subscribe in real-time to the history subcollection of an admin
 */
export function subscribeToHistory(
  adminId: string,
  onUpdate: (history: HistoryRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `admins/${adminId}/history`;
  const historyRef = collection(db, 'admins', adminId, 'history');
  const q = query(historyRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const history: HistoryRecord[] = [];
      snapshot.forEach((docSnap) => {
        history.push({ id: docSnap.id, ...docSnap.data() } as HistoryRecord);
      });
      onUpdate(history);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Subscribe in real-time to a specific student's record
 */
export function subscribeToStudent(
  adminId: string,
  studentId: string,
  onUpdate: (student: Student | null) => void
): () => void {
  const path = `admins/${adminId}/students/${studentId}`;
  const studentRef = doc(db, 'admins', adminId, 'students', studentId);
  return onSnapshot(
    studentRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as Student);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

/**
 * Add a new student created by the Admin
 */
export async function addStudent(
  adminId: string,
  data: {
    studentCustomId: string;
    name: string;
    username: string;
    password?: string;
    initialBalance: number;
    phone?: string;
    roomNumber?: string;
  }
): Promise<string> {
  const studentsColRef = collection(db, 'admins', adminId, 'students');
  const newStudentRef = doc(studentsColRef);
  const now = Date.now();

  const studentDoc: Student = {
    id: newStudentRef.id,
    studentCustomId: data.studentCustomId || `STU-${Date.now().toString().slice(-4)}`,
    name: data.name.trim(),
    username: data.username.trim().toLowerCase(),
    password: data.password || '123456',
    balance: Number(data.initialBalance) || 0,
    totalTopup: Number(data.initialBalance) || 0,
    totalExpense: 0,
    phone: data.phone?.trim() || '',
    roomNumber: data.roomNumber?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(newStudentRef, studentDoc);

  // Maintain fast student directory index
  const lookupRef = doc(db, 'student_directory', studentDoc.username);
  batch.set(lookupRef, {
    username: studentDoc.username,
    password: studentDoc.password,
    studentId: newStudentRef.id,
    adminId: adminId,
    name: studentDoc.name,
    studentCustomId: studentDoc.studentCustomId,
    updatedAt: now,
  });

  // If initial balance was given, add a top-up entry in history
  if (data.initialBalance > 0) {
    const historyColRef = collection(db, 'admins', adminId, 'history');
    const newHistoryRef = doc(historyColRef);
    const historyItem: HistoryRecord = {
      id: newHistoryRef.id,
      type: 'topup',
      studentIds: [newStudentRef.id],
      studentNames: [studentDoc.name],
      amount: data.initialBalance,
      description: `Initial balance top-up on student creation (${studentDoc.name})`,
      timestamp: now,
      createdAt: now,
    };
    batch.set(newHistoryRef, historyItem);
  }

  await batch.commit();
  return newStudentRef.id;
}

/**
 * Update student info (name, room, phone, username, password)
 */
export async function updateStudent(
  adminId: string,
  studentId: string,
  data: Partial<Student>
): Promise<void> {
  const studentRef = doc(db, 'admins', adminId, 'students', studentId);
  const now = Date.now();
  await updateDoc(studentRef, {
    ...data,
    updatedAt: now,
  });

  if (data.username || data.password || data.name) {
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      const s = snap.data() as Student;
      const lookupRef = doc(db, 'student_directory', s.username);
      await setDoc(lookupRef, {
        username: s.username,
        password: s.password,
        studentId: s.id,
        adminId: adminId,
        name: s.name,
        studentCustomId: s.studentCustomId,
        updatedAt: now,
      }, { merge: true });
    }
  }
}

/**
 * Delete a student and their references
 */
export async function deleteStudent(adminId: string, studentId: string): Promise<void> {
  const studentRef = doc(db, 'admins', adminId, 'students', studentId);
  const snap = await getDoc(studentRef);
  if (snap.exists()) {
    const s = snap.data() as Student;
    if (s.username) {
      try {
        await deleteDoc(doc(db, 'student_directory', s.username));
      } catch (err) {
        console.warn('Failed to delete student directory record:', err);
      }
    }
  }
  await deleteDoc(studentRef);
}

/**
 * Top up a student's balance (Adds amount handed over by the student)
 */
export async function topUpStudentBalance(
  adminId: string,
  studentId: string,
  amount: number,
  note?: string
): Promise<void> {
  if (amount <= 0) {
    throw new Error('Top-up amount must be greater than zero.');
  }

  const studentRef = doc(db, 'admins', adminId, 'students', studentId);
  const historyRef = doc(collection(db, 'admins', adminId, 'history'));
  const now = Date.now();

  await runTransaction(db, async (transaction) => {
    const studentDoc = await transaction.get(studentRef);
    if (!studentDoc.exists()) {
      throw new Error('Student does not exist.');
    }

    const studentData = studentDoc.data() as Student;
    const currentBalance = Number(studentData.balance) || 0;
    const currentTopup = Number(studentData.totalTopup) || 0;

    const newBalance = currentBalance + amount;
    const newTotalTopup = currentTopup + amount;

    // Update student document
    transaction.update(studentRef, {
      balance: newBalance,
      totalTopup: newTotalTopup,
      updatedAt: now,
    });

    // Create history entry
    const historyItem: HistoryRecord = {
      id: historyRef.id,
      type: 'topup',
      studentIds: [studentId],
      studentNames: [studentData.name],
      amount: amount,
      description: note ? `Top-up: ${note}` : `Balance top-up of Rs. ${amount}`,
      timestamp: now,
      createdAt: now,
    };
    transaction.set(historyRef, historyItem);
  });
}

/**
 * Add a new expense and split it among selected students
 */
export async function addExpense(
  adminId: string,
  data: {
    name: string;
    totalCost: number;
    selectedStudentIds: string[];
    category: Expense['category'];
    date: string;
    notes?: string;
  }
): Promise<string> {
  const { name, totalCost, selectedStudentIds, category, date, notes } = data;

  if (!selectedStudentIds || selectedStudentIds.length === 0) {
    throw new Error('Please select at least one student to split the expense.');
  }
  if (totalCost <= 0) {
    throw new Error('Total cost must be greater than zero.');
  }

  // Calculate equal split per student
  const perStudentShare = Number((totalCost / selectedStudentIds.length).toFixed(2));
  const expenseRef = doc(collection(db, 'admins', adminId, 'expenses'));
  const historyRef = doc(collection(db, 'admins', adminId, 'history'));
  const now = Date.now();

  await runTransaction(db, async (transaction) => {
    const studentNames: string[] = [];
    const studentNameMap: Record<string, string> = {};

    // Read all selected student documents first in transaction
    const studentSnapshots = await Promise.all(
      selectedStudentIds.map(async (sId) => {
        const snap = await transaction.get(doc(db, 'admins', adminId, 'students', sId));
        return { sId, snap };
      })
    );

    // Validate and update each student's balance
    for (const { sId, snap } of studentSnapshots) {
      if (!snap.exists()) {
        throw new Error(`Student ${sId} not found.`);
      }
      const sData = snap.data() as Student;
      studentNames.push(sData.name);
      studentNameMap[sId] = sData.name;

      const currentBalance = Number(sData.balance) || 0;
      const currentExpense = Number(sData.totalExpense) || 0;

      const newBalance = Number((currentBalance - perStudentShare).toFixed(2));
      const newTotalExpense = Number((currentExpense + perStudentShare).toFixed(2));

      transaction.update(snap.ref, {
        balance: newBalance,
        totalExpense: newTotalExpense,
        updatedAt: now,
      });
    }

    // Save expense document
    const expenseRecord: Expense = {
      id: expenseRef.id,
      name: name.trim(),
      totalCost,
      splitAmongStudentIds: selectedStudentIds,
      studentNames: studentNameMap,
      perStudentShare,
      category: category || 'Food',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes?.trim() || '',
      createdAt: now,
    };
    transaction.set(expenseRef, expenseRecord);

    // Save history record
    const historyItem: HistoryRecord = {
      id: historyRef.id,
      type: 'expense',
      studentIds: selectedStudentIds,
      studentNames: studentNames,
      amount: totalCost,
      perStudentShare: perStudentShare,
      description: `${name} (Split among ${selectedStudentIds.length} student${selectedStudentIds.length > 1 ? 's' : ''})`,
      category: category,
      timestamp: now,
      createdAt: now,
    };
    transaction.set(historyRef, historyItem);
  });

  return expenseRef.id;
}

/**
 * Deletes an expense and safely refunds the per-student share back to students
 */
export async function deleteExpense(adminId: string, expenseId: string): Promise<void> {
  const expenseRef = doc(db, 'admins', adminId, 'expenses', expenseId);
  const now = Date.now();

  await runTransaction(db, async (transaction) => {
    // 1. Read the expense document first
    const expenseSnap = await transaction.get(expenseRef);
    if (!expenseSnap.exists()) {
      throw new Error('Expense record does not exist.');
    }

    const expenseData = expenseSnap.data() as Expense;
    const { splitAmongStudentIds = [], perStudentShare = 0 } = expenseData;

    // 2. Read all involved student documents BEFORE any writes (Firestore Transaction Rule)
    const studentSnaps = await Promise.all(
      splitAmongStudentIds.map(async (studentId) => {
        const studentRef = doc(db, 'admins', adminId, 'students', studentId);
        const studentSnap = await transaction.get(studentRef);
        return { studentRef, studentSnap };
      })
    );

    // 3. Perform all student balance updates (refunds)
    for (const { studentRef, studentSnap } of studentSnaps) {
      if (studentSnap.exists()) {
        const sData = studentSnap.data() as Student;
        const currentBalance = Number(sData.balance) || 0;
        const currentExpense = Number(sData.totalExpense) || 0;

        transaction.update(studentRef, {
          balance: Number((currentBalance + perStudentShare).toFixed(2)),
          totalExpense: Math.max(0, Number((currentExpense - perStudentShare).toFixed(2))),
          updatedAt: now,
        });
      }
    }

    // 4. Delete the expense document
    transaction.delete(expenseRef);
  });
}

/**
 * Delete an individual history log record
 */
export async function deleteHistoryRecord(adminId: string, historyId: string): Promise<void> {
  const historyRef = doc(db, 'admins', adminId, 'history', historyId);
  await deleteDoc(historyRef);
}

/**
 * Clear all history log records for the admin
 */
export async function clearAllHistory(adminId: string): Promise<void> {
  const historyCol = collection(db, 'admins', adminId, 'history');
  const snapshot = await getDocs(historyCol);
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

/**
 * Authentication lookup for Student:
 * Given a username & password (and optional adminId or admin email/code),
 * finds the student record matching credentials.
 */
export async function authenticateStudent(
  username: string,
  password: string,
  specificAdminId?: string
): Promise<{ adminId: string; student: Student } | null> {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  // 1. Direct fast lookup in student_directory/{cleanUsername}
  try {
    const lookupRef = doc(db, 'student_directory', cleanUsername);
    const lookupSnap = await getDoc(lookupRef);
    if (lookupSnap.exists()) {
      const lookupData = lookupSnap.data();
      if (lookupData.password === cleanPassword) {
        const studentSnap = await getDoc(doc(db, 'admins', lookupData.adminId, 'students', lookupData.studentId));
        if (studentSnap.exists()) {
          return {
            adminId: lookupData.adminId,
            student: { id: studentSnap.id, ...studentSnap.data() } as Student,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Fast student_directory lookup failed, falling back:', err);
  }

  // 2. If adminId is provided, query that admin's students collection directly
  if (specificAdminId) {
    try {
      const studentsCol = collection(db, 'admins', specificAdminId, 'students');
      const q = query(studentsCol, where('username', '==', cleanUsername));
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Student;
        if (data.password === cleanPassword) {
          // Re-index into student_directory for future fast lookups
          try {
            await setDoc(doc(db, 'student_directory', cleanUsername), {
              username: cleanUsername,
              password: cleanPassword,
              studentId: docSnap.id,
              adminId: specificAdminId,
              name: data.name,
              studentCustomId: data.studentCustomId,
              updatedAt: Date.now(),
            });
          } catch (e) {
            // Ignore index write error if any
          }
          return { adminId: specificAdminId, student: { id: docSnap.id, ...data } };
        }
      }
    } catch (err) {
      console.warn('Specific admin query error:', err);
    }
  }

  // 3. Search across all admins (collectionGroup)
  try {
    const groupQuery = query(collectionGroup(db, 'students'), where('username', '==', cleanUsername));
    const groupSnap = await getDocs(groupQuery);

    for (const docSnap of groupSnap.docs) {
      const data = docSnap.data() as Student;
      if (data.password === cleanPassword) {
        // Path is "admins/{adminId}/students/{studentId}"
        const pathSegments = docSnap.ref.path.split('/');
        const adminId = pathSegments[1];

        try {
          await setDoc(doc(db, 'student_directory', cleanUsername), {
            username: cleanUsername,
            password: cleanPassword,
            studentId: docSnap.id,
            adminId,
            name: data.name,
            studentCustomId: data.studentCustomId,
            updatedAt: Date.now(),
          });
        } catch (e) {
          // Ignore index write error
        }

        return { adminId, student: { id: docSnap.id, ...data } };
      }
    }
  } catch (err) {
    console.warn('Collection group query error, falling back:', err);
  }

  // 4. Auto-initialize demo group if demo accounts are attempted on fresh database
  const demoAccounts = ['aarav', 'rohan', 'zaid', 'priya'];
  if (demoAccounts.includes(cleanUsername) && (cleanPassword === 'password123' || cleanPassword === '123456')) {
    try {
      const demoAdminId = 'demo-admin-hostel';
      await seedDemoData(demoAdminId, 'Hostel Room 402 Flatmates');
      // Retry reading student
      const retrySnap = await getDoc(doc(db, 'student_directory', cleanUsername));
      if (retrySnap.exists()) {
        const lData = retrySnap.data();
        const sSnap = await getDoc(doc(db, 'admins', lData.adminId, 'students', lData.studentId));
        if (sSnap.exists()) {
          return { adminId: lData.adminId, student: { id: sSnap.id, ...sSnap.data() } as Student };
        }
      }
    } catch (seedErr) {
      console.error('Demo auto-seed error:', seedErr);
    }
  }

  return null;
}

/**
 * Seeds comprehensive initial sample data for quick preview / demo testing
 */
export async function seedDemoData(adminId: string, adminName: string = 'Hostel Admin'): Promise<void> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. Setup Admin profile
  await setAdminProfile(adminId, {
    name: adminName,
    groupName: 'Room 402 / Flatmates Hub',
    createdAt: now - 30 * dayMs,
  });

  // 2. Add 4 sample students with varied balances (including low-balance to test alerts)
  const sampleStudents = [
    {
      studentCustomId: 'STU-101',
      name: 'Aarav Sharma',
      username: 'aarav',
      password: 'password123',
      initialBalance: 650,
      phone: '+91 98765 43210',
      roomNumber: '402-A',
    },
    {
      studentCustomId: 'STU-102',
      name: 'Rohan Verma',
      username: 'rohan',
      password: 'password123',
      initialBalance: 35, // Low balance (<= 50) to test warning alert!
      phone: '+91 98111 22334',
      roomNumber: '402-B',
    },
    {
      studentCustomId: 'STU-103',
      name: 'Zaid Khan',
      username: 'zaid',
      password: 'password123',
      initialBalance: 1200,
      phone: '+91 97222 33445',
      roomNumber: '402-C',
    },
    {
      studentCustomId: 'STU-104',
      name: 'Priya Patel',
      username: 'priya',
      password: 'password123',
      initialBalance: 40, // Low balance (<= 50) to test warning alert!
      phone: '+91 96333 44556',
      roomNumber: '402-D',
    },
  ];

  const studentIds: string[] = [];
  for (const s of sampleStudents) {
    const id = await addStudent(adminId, s);
    studentIds.push(id);
  }

  // 3. Add realistic sample expenses with equal split
  const sampleExpenses = [
    {
      name: 'High-Speed Fiber Wifi (Monthly)',
      totalCost: 1000,
      selectedStudentIds: studentIds, // Split among all 4 (250 each)
      category: 'Utilities' as const,
      date: new Date(now - 5 * dayMs).toISOString().split('T')[0],
      notes: 'Airtel Xstream broadband bill for this month',
    },
    {
      name: 'Hostel Grocery & Cooking Oil',
      totalCost: 600,
      selectedStudentIds: [studentIds[0], studentIds[1], studentIds[2]], // 3 students (200 each)
      category: 'Groceries' as const,
      date: new Date(now - 3 * dayMs).toISOString().split('T')[0],
      notes: 'Rice, oil, spices, and tea powder',
    },
    {
      name: 'Weekend Pizza & Biryani Dinner',
      totalCost: 800,
      selectedStudentIds: [studentIds[0], studentIds[2], studentIds[3]], // 3 students (266.67 each)
      category: 'Food' as const,
      date: new Date(now - 1 * dayMs).toISOString().split('T')[0],
      notes: 'Exam celebration dinner treat split',
    },
  ];

  for (const exp of sampleExpenses) {
    await addExpense(adminId, exp);
  }
}
