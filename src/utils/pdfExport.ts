import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HistoryRecord, Expense, Student } from '../types';

/**
 * Format timestamp into readable local date & time
 */
function formatDateTime(millis: number, originalDateStr?: string) {
  let dateFormatted = '';
  if (originalDateStr && originalDateStr.includes('-')) {
    const parts = originalDateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const localD = new Date(parts[0], parts[1] - 1, parts[2]);
      dateFormatted = localD.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  const dateObj = new Date(millis || Date.now());
  if (!dateFormatted) {
    dateFormatted = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const timeFormatted = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return { dateFormatted, timeFormatted };
}

/**
 * Export complete history & financial report as a beautifully formatted PDF
 */
export function exportHistoryPDF(options: {
  history: HistoryRecord[];
  expenses: Expense[];
  students: Student[];
  groupName?: string;
  adminName?: string;
  filterType?: 'all' | 'expense' | 'topup';
}) {
  const { history, expenses, students, groupName = 'Expense Group', adminName, filterType = 'all' } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette
  const primaryColor: [number, number, number] = [37, 99, 235]; // Indigo / Royal Blue
  const darkColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const grayColor: [number, number, number] = [100, 116, 139]; // Slate 500
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderCol: [number, number, number] = [226, 232, 240]; // Slate 200

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MY SPENDS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Financial & Transaction Audit Report • ${groupName}`,
    14,
    19
  );

  // Date Generated on Top Right
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated: ${generatedDate}`, pageWidth - 14, 19, { align: 'right' });

  // 2. Metrics Summary Box
  const totalTopUpAmount = history
    .filter((h) => h.type === 'topup')
    .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
  const totalExpenseAmount = expenses.reduce(
    (sum, e) => sum + (Number(e.totalCost) || 0),
    0
  );
  const totalBalanceInPool = students.reduce(
    (sum, s) => sum + (Number(s.balance) || 0),
    0
  );

  const startY = 32;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderCol);
  doc.roundedRect(14, startY, pageWidth - 28, 22, 3, 3, 'FD');

  const colW = (pageWidth - 28) / 4;

  // Box 1: Total Top-Ups
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...grayColor);
  doc.text('TOTAL DEPOSITED', 14 + colW * 0 + 6, startY + 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`Rs. ${totalTopUpAmount.toFixed(2)}`, 14 + colW * 0 + 6, startY + 16);

  // Box 2: Total Spent
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text('TOTAL EXPENSES', 14 + colW * 1 + 6, startY + 7);
  doc.setFontSize(11);
  doc.setTextColor(225, 29, 72); // rose
  doc.text(`Rs. ${totalExpenseAmount.toFixed(2)}`, 14 + colW * 1 + 6, startY + 16);

  // Box 3: Remaining Pool Balance
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text('CURRENT POOL BAL', 14 + colW * 2 + 6, startY + 7);
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235); // blue
  doc.text(`Rs. ${totalBalanceInPool.toFixed(2)}`, 14 + colW * 2 + 6, startY + 16);

  // Box 4: Total Students
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text('REGISTERED STUDENTS', 14 + colW * 3 + 6, startY + 7);
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(`${students.length} Students`, 14 + colW * 3 + 6, startY + 16);

  // 3. Transactions Table
  const expMap = new Map<string, Expense>();
  expenses.forEach((e) => expMap.set(e.id, e));

  const filtered = history
    .filter((h) => filterType === 'all' || h.type === filterType)
    .sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));

  const tableRows = filtered.map((h, index) => {
    const matchingExp = expMap.get(h.id);
    const validMillis =
      typeof h.createdAt === 'number' && h.createdAt > 0
        ? h.createdAt
        : typeof h.timestamp === 'number' && h.timestamp > 0
        ? h.timestamp
        : Date.now();

    const { dateFormatted, timeFormatted } = formatDateTime(
      validMillis,
      matchingExp?.date
    );

    const isTopUp = h.type === 'topup';
    const typeLabel = isTopUp ? 'Top-Up' : 'Expense';
    const amountStr = isTopUp
      ? `+ Rs. ${h.amount.toFixed(2)}`
      : `- Rs. ${h.amount.toFixed(2)}`;

    const perShareStr = isTopUp
      ? '—'
      : h.perStudentShare
      ? `Rs. ${h.perStudentShare.toFixed(2)}`
      : `Rs. ${(h.amount / Math.max(1, (h.studentNames || []).length)).toFixed(2)}`;

    const involvedNames = (h.studentNames || []).join(', ') || 'All';

    return [
      (index + 1).toString(),
      `${dateFormatted}\n${timeFormatted}`,
      typeLabel,
      h.description || '—',
      amountStr,
      perShareStr,
      involvedNames,
    ];
  });

  autoTable(doc, {
    startY: startY + 28,
    head: [
      [
        '#',
        'Date & Time',
        'Type',
        'Description / Notes',
        'Amount',
        'Per Head',
        'Students Involved',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      cellPadding: 2.5,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // #
      1: { cellWidth: 26, halign: 'left' }, // Date & Time
      2: { cellWidth: 18, halign: 'center' }, // Type
      3: { cellWidth: 'auto', halign: 'left' }, // Description
      4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }, // Amount
      5: { cellWidth: 20, halign: 'right' }, // Per Head
      6: { cellWidth: 42, halign: 'left' }, // Students Involved
    },
    didParseCell: (data) => {
      // Color code amount column
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129]; // emerald
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // rose
        }
      }
      // Color code Type badge column
      if (data.section === 'body' && data.column.index === 2) {
        const text = String(data.cell.raw);
        if (text === 'Top-Up') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate 400

      doc.text(
        `My Spends • ${groupName} • Confidential Audit Log`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${data.pageNumber} of ${pageNum}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  // Download PDF
  const filename = `expense_report_${groupName.toLowerCase().replace(/\s+/g, '_')}_${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  doc.save(filename);
}

/**
 * Export Individual Student Financial Statement as PDF
 */
export function exportStudentStatementPDF(options: {
  student: Student;
  allExpenses: Expense[];
  allHistory: HistoryRecord[];
  groupName?: string;
}) {
  const { student, allExpenses, allHistory, groupName = 'Expense Group' } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Header Banner
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('STUDENT FINANCIAL STATEMENT', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Official Individual Account Statement • ${groupName}`, 14, 19);

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated: ${generatedDate}`, pageWidth - 14, 19, { align: 'right' });

  // 2. Student Info Card & Financial Summary
  const startY = 34;

  // Student Profile Card (Left)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, (pageWidth - 32) * 0.5, 30, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('STUDENT INFORMATION', 18, startY + 7);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(student.name, 18, startY + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Student ID: ${student.studentCustomId}`, 18, startY + 20);
  doc.text(
    `Username: ${student.username} ${student.roomNumber ? `• Room: ${student.roomNumber}` : ''}`,
    18,
    startY + 25
  );

  // Financial Balance Card (Right)
  const rightCardX = 14 + (pageWidth - 32) * 0.5 + 4;
  const rightCardW = (pageWidth - 32) * 0.5;

  const isLow = student.balance <= 50;
  if (isLow) {
    doc.setFillColor(254, 242, 242); // red 50
    doc.setDrawColor(254, 202, 202); // red 200
  } else {
    doc.setFillColor(240, 253, 244); // emerald 50
    doc.setDrawColor(187, 247, 208); // emerald 200
  }
  doc.roundedRect(rightCardX, startY, rightCardW, 30, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('AVAILABLE BALANCE', rightCardX + 5, startY + 7);

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  if (isLow) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(5, 150, 105);
  }
  doc.text(`Rs. ${student.balance.toFixed(2)}`, rightCardX + 5, startY + 17);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total Top-Ups: Rs. ${(student.totalTopup || 0).toFixed(2)}  |  Total Spent: Rs. ${(
      student.totalExpense || 0
    ).toFixed(2)}`,
    rightCardX + 5,
    startY + 25
  );

  // 3. Transactions involving this student
  const studentHistory = allHistory
    .filter((h) => h.studentIds.includes(student.id))
    .sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));

  const tableRows = studentHistory.map((h, index) => {
    const isTopUp = h.type === 'topup';
    const { dateFormatted, timeFormatted } = formatDateTime(
      h.createdAt || h.timestamp
    );

    // If expense, show this student's exact personal share
    const myShare = isTopUp
      ? h.amount
      : h.perStudentShare || h.amount / Math.max(1, (h.studentIds || []).length);

    const shareStr = isTopUp
      ? `+ Rs. ${myShare.toFixed(2)}`
      : `- Rs. ${myShare.toFixed(2)}`;

    return [
      (index + 1).toString(),
      `${dateFormatted}\n${timeFormatted}`,
      isTopUp ? 'Top-Up' : 'Expense Share',
      h.description,
      `Rs. ${h.amount.toFixed(2)}`,
      shareStr,
    ];
  });

  autoTable(doc, {
    startY: startY + 36,
    head: [
      [
        '#',
        'Date & Time',
        'Transaction Type',
        'Description',
        'Total Bill',
        'Your Share / Credit',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 2.5,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, halign: 'left' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 'auto', halign: 'left' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);

      doc.text(
        `Student Statement • ${student.name} (${student.studentCustomId}) • ${groupName}`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${data.pageNumber} of ${pageNum}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  const filename = `statement_${student.studentCustomId}_${student.name.toLowerCase().replace(/\s+/g, '_')}_${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  doc.save(filename);
}
