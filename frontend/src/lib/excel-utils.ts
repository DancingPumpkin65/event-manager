/**
 * Excel file parsing utilities for importing participants
 * Using ExcelJS for secure Excel file handling
 */

import ExcelJS from 'exceljs';

export interface ExcelRow {
  [key: string]: string | number | boolean | Date;
}

export interface ExcelColumn {
  field: string;
  header: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'phone' | 'date';
}

export interface ExcelImportResult<T> {
  data: T[];
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
}

/**
 * Export data to Excel file
 */
export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExcelColumn[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Add headers
  const headers = columns.map(col => col.header);
  worksheet.addRow(headers);

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  // Add data rows
  data.forEach(item => {
    const row = columns.map(col => {
      const value = item[col.field];
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value ?? '';
    });
    worksheet.addRow(row);
  });

  // Auto-width columns
  worksheet.columns.forEach((column, index) => {
    const header = columns[index]?.header || '';
    let maxLength = header.length;
    
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const cellLength = String(cell.value || '').length;
      if (cellLength > maxLength) maxLength = cellLength;
    });
    
    column.width = Math.min(maxLength + 2, 50);
  });

  // Download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Import data from Excel file with validation
 */
export async function importFromExcel<T extends Record<string, any>>(
  file: File,
  columns: ExcelColumn[]
): Promise<ExcelImportResult<T>> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const firstSheet = workbook.worksheets[0];
  if (!firstSheet || firstSheet.rowCount === 0) {
    return { data: [], errors: [], warnings: [] };
  }

  const errors: ExcelImportResult<T>['errors'] = [];
  const warnings: ExcelImportResult<T>['warnings'] = [];

  // Extract headers from first row
  const headerRow = firstSheet.getRow(1);
  const fileHeaders: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    fileHeaders[colNumber - 1] = String(cell.value || '');
  });

  // Map file headers to expected columns
  const columnMap = new Map<string, number>();
  columns.forEach(col => {
    const headerIndex = fileHeaders.findIndex(h =>
      h?.toLowerCase().trim() === col.header.toLowerCase().trim()
    );

    if (headerIndex === -1 && col.required) {
      errors.push({
        row: 0,
        field: col.field,
        message: `Required column "${col.header}" not found`,
      });
    } else if (headerIndex !== -1) {
      columnMap.set(col.field, headerIndex + 1); // ExcelJS is 1-indexed
    }
  });

  if (errors.length > 0) {
    return { data: [], errors, warnings };
  }

  // Parse data rows
  const parsedData: T[] = [];

  for (let i = 2; i <= firstSheet.rowCount; i++) {
    const row = firstSheet.getRow(i);
    const rowValues: any[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowValues[colNumber] = cell.value;
    });

    // Skip empty rows
    if (rowValues.every(cell => !cell)) continue;

    const item: any = {};
    let hasError = false;

    columns.forEach(col => {
      const colIndex = columnMap.get(col.field);
      if (colIndex === undefined) return;

      const value = rowValues[colIndex];

      // Validate required fields
      if (col.required && !value) {
        errors.push({
          row: i,
          field: col.field,
          message: `Required field "${col.header}" is empty`,
        });
        hasError = true;
        return;
      }

      // Type validation
      if (value) {
        switch (col.type) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
              errors.push({
                row: i,
                field: col.field,
                message: `Invalid email format: ${value}`,
              });
              hasError = true;
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              errors.push({
                row: i,
                field: col.field,
                message: `Invalid number: ${value}`,
              });
              hasError = true;
            }
            break;
          case 'phone':
            if (!/^[\d\s\-\+\(\)]+$/.test(String(value))) {
              warnings.push({
                row: i,
                message: `Unusual phone format in "${col.header}": ${value}`,
              });
            }
            break;
        }
      }

      item[col.field] = value || null;
    });

    if (!hasError) {
      parsedData.push(item as T);
    }
  }

  return { data: parsedData, errors, warnings };
}

/**
 * Generate Excel template for import
 */
export async function generateExcelTemplate(
  columns: ExcelColumn[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template');

  // Add headers
  const headers = columns.map(col => col.header);
  worksheet.addRow(headers);

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  // Add sample row
  const sampleRow = columns.map(col => {
    switch (col.type) {
      case 'email':
        return 'example@email.com';
      case 'phone':
        return '+1234567890';
      case 'number':
        return '123';
      case 'date':
        return '2025-01-01';
      default:
        return 'Sample data';
    }
  });
  worksheet.addRow(sampleRow);

  // Auto-width columns
  worksheet.columns.forEach((column, index) => {
    column.width = Math.max(columns[index]?.header.length || 10, 15);
  });

  // Download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Validate Excel file before parsing
 */
export function validateExcelFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  
  if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    return { valid: false, error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  return { valid: true };
}

// Legacy parseExcelFile function for backward compatibility
export async function parseExcelFile(file: File): Promise<ExcelRow[]> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const firstSheet = workbook.worksheets[0];
  if (!firstSheet || firstSheet.rowCount === 0) {
    return [];
  }

  // Get headers from first row
  const headerRow = firstSheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value || '');
  });

  // Parse data rows
  const data: ExcelRow[] = [];
  for (let i = 2; i <= firstSheet.rowCount; i++) {
    const row = firstSheet.getRow(i);
    const rowData: ExcelRow = {};
    
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        rowData[header] = cell.value as string | number | boolean | Date;
      }
    });

    // Skip empty rows
    if (Object.keys(rowData).length > 0) {
      data.push(rowData);
    }
  }

  return data;
}

export function validateParticipantRow(
  row: ExcelRow,
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rowKeys = Object.keys(row);

  // Check for required fields
  for (const field of requiredFields) {
    if (!rowKeys.includes(field) || !row[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Excel Export Utilities for Attendance Reports
 * Uses xlsx library to create multi-tab workbooks
 */

export interface AttendanceExportData {
  // Event Info
  eventName: string;
  eventLocation?: string;
  startDate: string;
  endDate: string;
  reportDate: string;

  // Badge Stats
  totalRegistered: number;
  badgesPrinted: number;
  badgesNotPrinted: number;

  // Participant field headers
  participantFieldLabels: string[];
  participantFieldNames: string[];

  // Printed badges list
  printedBadges: Array<{
    badgeId: string | null;
    participantFields: Record<string, any>;
    badgePrintedAt: string | null;
  }>;

  // Not printed badges list
  notPrintedBadges: Array<{
    badgeId: string | null;
    participantFields: Record<string, any>;
  }>;

  // Course attendance
  coursesWithAttendees: Array<{
    title: string;
    hallName: string;
    startTime: string;
    endTime: string;
    attendeeCount: number;
    attendees: Array<{ nom: string; prenom: string; badgeId?: string }>;
  }>;
}

/**
 * Generate Excel workbook with multiple tabs for attendance data
 */
export async function generateAttendanceExcel(data: AttendanceExportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();

  // ========== TAB 1: Event Info & Badge Stats ==========
  const infoSheet = workbook.addWorksheet('Résumé');
  
  const infoData = [
    ['RAPPORT DE PRÉSENCE'],
    [],
    ['Événement', data.eventName],
    ['Lieu', data.eventLocation || '-'],
    ['Date début', data.startDate],
    ['Date fin', data.endDate],
    ['Date du rapport', data.reportDate],
    [],
    ['STATISTIQUES DES BADGES'],
    [],
    ['Total Inscrits', data.totalRegistered],
    ['Badges Imprimés', data.badgesPrinted],
    ['Badges Non Imprimés', data.badgesNotPrinted],
    ['Taux d\'impression', data.totalRegistered > 0
      ? `${Math.round((data.badgesPrinted / data.totalRegistered) * 100)}%`
      : '0%'],
  ];

  infoData.forEach(row => infoSheet.addRow(row));
  infoSheet.getColumn(1).width = 25;
  infoSheet.getColumn(2).width = 40;

  // ========== TAB 2: Printed Badges ==========
  const printedSheet = workbook.addWorksheet('Badges Imprimés');
  const printedHeaders = ['Badge ID', ...data.participantFieldLabels, 'Date Impression'];
  printedSheet.addRow(printedHeaders);
  printedSheet.getRow(1).font = { bold: true };

  data.printedBadges.forEach(p => {
    printedSheet.addRow([
      p.badgeId || '-',
      ...data.participantFieldNames.map(name => p.participantFields?.[name] ?? '-'),
      p.badgePrintedAt ? new Date(p.badgePrintedAt).toLocaleString() : '-',
    ]);
  });

  printedSheet.columns.forEach(col => { col.width = 20; });

  // ========== TAB 3: Not Printed Badges ==========
  const notPrintedSheet = workbook.addWorksheet('Badges Non Imprimés');
  const notPrintedHeaders = ['Badge ID', ...data.participantFieldLabels];
  notPrintedSheet.addRow(notPrintedHeaders);
  notPrintedSheet.getRow(1).font = { bold: true };

  data.notPrintedBadges.forEach(p => {
    notPrintedSheet.addRow([
      p.badgeId || '-',
      ...data.participantFieldNames.map(name => p.participantFields?.[name] ?? '-'),
    ]);
  });

  notPrintedSheet.columns.forEach(col => { col.width = 20; });

  // ========== TAB 4: Course Attendance ==========
  const attendanceSheet = workbook.addWorksheet('Présence Cours');

  data.coursesWithAttendees.forEach((course, index) => {
    // Add course header
    if (index > 0) attendanceSheet.addRow([]); // Empty row between courses

    attendanceSheet.addRow([`COURS: ${course.title}`]);
    attendanceSheet.addRow(['Salle', course.hallName]);
    attendanceSheet.addRow(['Horaire', `${new Date(course.startTime).toLocaleString()} - ${new Date(course.endTime).toLocaleString()}`]);
    attendanceSheet.addRow(['Nombre Participants', course.attendeeCount]);
    attendanceSheet.addRow([]);

    // Add attendee table
    if (course.attendees.length > 0) {
      attendanceSheet.addRow(['Badge ID', 'Nom', 'Prénom']);
      course.attendees.forEach(att => {
        attendanceSheet.addRow([att.badgeId || '-', att.nom, att.prenom]);
      });
    } else {
      attendanceSheet.addRow(['Aucun participant enregistré']);
    }
  });

  if (data.coursesWithAttendees.length === 0) {
    attendanceSheet.addRow(['Aucun cours trouvé']);
  }

  attendanceSheet.getColumn(1).width = 20;
  attendanceSheet.getColumn(2).width = 25;
  attendanceSheet.getColumn(3).width = 25;

  return workbook;
}

/**
 * Download Excel workbook as file
 */
export async function downloadExcel(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
