import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Receipt,
  Users,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  AlertCircle,
  Calculator,
  Search,
  Check,
  Building,
  Sparkles,
  RotateCcw,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Student, Expense, EXPENSE_CATEGORIES, LOW_BALANCE_THRESHOLD } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAddExpense: (data: {
    name: string;
    totalCost: number;
    selectedStudentIds: string[];
    category: Expense['category'];
    date: string;
    notes?: string;
  }) => Promise<void>;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  students,
  onAddExpense,
}) => {
  const [name, setName] = useState('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [category, setCategory] = useState<Expense['category']>('Food');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected students when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default: select all students if none selected
      if (selectedStudentIds.length === 0 && students.length > 0) {
        setSelectedStudentIds(students.map((s) => s.id));
      }
      setStudentSearch('');
      setSelectedRoomFilter('all');
      setError(null);
    }
  }, [isOpen, students]);

  // Unique rooms list
  const availableRooms = useMemo(() => {
    const rooms = new Set<string>();
    students.forEach((s) => {
      if (s.roomNumber && s.roomNumber.trim()) {
        rooms.add(s.roomNumber.trim());
      }
    });
    return Array.from(rooms);
  }, [students]);

  // Filter students based on search and room
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = studentSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.studentCustomId.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(q));

      const matchesRoom =
        selectedRoomFilter === 'all' ||
        (s.roomNumber && s.roomNumber.trim() === selectedRoomFilter);

      return matchesSearch && matchesRoom;
    });
  }, [students, studentSearch, selectedRoomFilter]);

  const costNumber = parseFloat(totalCost) || 0;
  const participantCount = selectedStudentIds.length;
  const perStudentShareNum = participantCount > 0 ? costNumber / participantCount : 0;
  const perStudentShare = perStudentShareNum.toFixed(2);

  if (!isOpen) return null;

  // Toggle specific student
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  // Select all students
  const selectAll = () => {
    setSelectedStudentIds(students.map((s) => s.id));
  };

  // Clear / Deselect all
  const deselectAll = () => {
    setSelectedStudentIds([]);
  };

  // Invert current selection
  const invertSelection = () => {
    setSelectedStudentIds((prev) =>
      students.map((s) => s.id).filter((id) => !prev.includes(id))
    );
  };

  // Select all students in currently filtered view
  const selectFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  // Select only students from a specific room
  const selectByRoom = (room: string) => {
    setSelectedRoomFilter(room);
    const roomStudentIds = students
      .filter((s) => s.roomNumber && s.roomNumber.trim() === room)
      .map((s) => s.id);
    setSelectedStudentIds(roomStudentIds);
  };

  // Remove specific student from selection chip
  const removeSpecificStudent = (id: string) => {
    setSelectedStudentIds((prev) => prev.filter((sId) => sId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a name/title for the expense.');
      return;
    }
    if (costNumber <= 0) {
      setError('Please enter a valid total expense cost greater than zero.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setError('Please select at least one specific student to split this expense.');
      return;
    }

    try {
      setLoading(true);
      await onAddExpense({
        name: name.trim(),
        totalCost: costNumber,
        selectedStudentIds,
        category,
        date,
        notes: notes.trim(),
      });
      onClose();
      // Reset form
      setName('');
      setTotalCost('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to record expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-2xl shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                Record Shared Expense
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Equal split among chosen student participants
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
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl font-medium flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Expense Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expense Title / Purpose *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. WiFi Bill, Grocery, Dinner, Cleaning"
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Cost (Rs.) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400 dark:text-slate-500 pointer-events-none">
                  Rs.
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  placeholder="1200"
                  className="w-full pl-11 pr-3.5 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Category and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Expense
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: SPECIFIC STUDENTS SELECTION AREA */}
          <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
            
            {/* Top Bar with Selection Stats and Fast Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-lg">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Choose Specific Students to Split
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedStudentIds.length}</strong> of{' '}
                    <strong>{students.length}</strong> students selected
                  </span>
                </div>
              </div>

              {/* Quick Select & Filter Action Pills */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold text-slate-700 dark:text-slate-300 text-[11px] transition-all cursor-pointer shadow-2xs"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 font-semibold text-slate-700 dark:text-slate-300 text-[11px] transition-all cursor-pointer shadow-2xs"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={invertSelection}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-600 dark:text-slate-400 text-[11px] transition-all cursor-pointer shadow-2xs"
                  title="Invert current student selection"
                >
                  Invert
                </button>
              </div>
            </div>

            {/* Room Filter Pills (if rooms exist) */}
            {availableRooms.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Room:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRoomFilter('all')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedRoomFilter === 'all'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  All Rooms
                </button>
                {availableRooms.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => selectByRoom(room)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                      selectedRoomFilter === room
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Room {room}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input for Specific Students */}
            {students.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student by name, ID, or room..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* Student Checkboxes List */}
            {students.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                No students added yet! Please add students first to record shared expenses.
              </p>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No students matched "{studentSearch}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStudentSearch('');
                    setSelectedRoomFilter('all');
                  }}
                  className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className="max-h-52 sm:max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                {filteredStudents.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  const isLowBal = student.balance <= LOW_BALANCE_THRESHOLD;
                  const balanceAfter = student.balance - perStudentShareNum;

                  return (
                    <button
                      type="button"
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer min-h-[44px] ${
                        isChecked
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-600 text-indigo-950 dark:text-indigo-200 font-medium ring-1 ring-indigo-200 dark:ring-indigo-700 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0">
                          {isChecked ? (
                            <div className="h-5 w-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center justify-center"></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {student.name}
                            </span>
                            {student.roomNumber && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono shrink-0">
                                R-{student.roomNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block truncate">
                            {student.studentCustomId}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span
                          className={`text-[11px] font-mono font-bold block ${
                            isLowBal ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          Rs. {student.balance.toFixed(0)}
                        </span>
                        {isChecked && participantCount > 0 && costNumber > 0 && (
                          <span className={`text-[10px] font-mono block ${balanceAfter < 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                            rem: Rs.{balanceAfter.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Specific Students Summary Chips */}
            {selectedStudentIds.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Currently Split Among ({selectedStudentIds.length} students):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {selectedStudentIds.map((id) => {
                    const student = students.find((s) => s.id === id);
                    if (!student) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        <span className="truncate max-w-[120px]">{student.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSpecificStudent(id);
                          }}
                          className="hover:text-red-600 dark:hover:text-red-400 font-bold ml-0.5 text-xs cursor-pointer"
                          title="Remove from split"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split Share Summary Calculation Card */}
            {participantCount > 0 && costNumber > 0 && (
              <div className="mt-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">
                      Each selected student will pay:
                    </span>
                    <span className="font-mono text-base font-extrabold text-emerald-950 dark:text-emerald-200">
                      Rs. {perStudentShare}{' '}
                      <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">/ student</span>
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right font-medium text-[11px] text-emerald-800 dark:text-emerald-300 bg-white/60 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 self-start sm:self-auto">
                  Total: Rs. {costNumber.toFixed(2)} ÷ {participantCount} students
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Notes / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid online by Admin, bill receipt attached"
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </form>

        {/* Sticky Action Footer (Optimized for Mobile Touch) */}
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
            disabled={loading || students.length === 0 || selectedStudentIds.length === 0}
            className="flex-2 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            {loading ? (
              <span>Recording...</span>
            ) : (
              <>
                <Receipt className="h-4 w-4" />
                <span>
                  Save & Split ({selectedStudentIds.length})
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

