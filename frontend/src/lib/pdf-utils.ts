import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  title: string;
  subtitle?: string;
  date?: string;
  sections: ReportSection[];
  footer?: string;
}

export interface ReportSection {
  title: string;
  content?: string;
  table?: {
    headers: string[];
    rows: (string | number)[][];
  };
  stats?: {
    label: string;
    value: string | number;
  }[];
}

export interface EventReportData {
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  totalParticipants: number;
  checkedInCount: number;
  attendanceRate: number;
  participants: Array<{
    name: string;
    email: string;
    status: string;
    [key: string]: any;
  }>;
}

export interface AttendanceReportData {
  eventName: string;
  reportDate: string;
  totalParticipants: number;
  presentCount: number;
  absentCount: number;
  attendanceDetails: Array<{
    name: string;
    email: string;
    checkInTime: string;
    status: string;
  }>;
}

/**
 * Generate a generic PDF report
 */
export function generatePDFReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  let currentY = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 204);
  doc.text(data.title, 20, currentY);
  currentY += 10;

  if (data.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(data.subtitle, 20, currentY);
    currentY += 8;
  }

  if (data.date) {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${data.date}`, 20, currentY);
    currentY += 15;
  }

  // Sections
  data.sections.forEach((section) => {
    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // Section title
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(section.title, 20, currentY);
    currentY += 8;

    // Section content
    if (section.content) {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(section.content, 170);
      doc.text(lines, 20, currentY);
      currentY += lines.length * 5 + 10;
    }

    // Stats
    if (section.stats) {
      const statsPerRow = 3;
      const statWidth = 60;
      let statsX = 20;
      let statsY = currentY;

      section.stats.forEach((stat, index) => {
        if (index > 0 && index % statsPerRow === 0) {
          statsY += 20;
          statsX = 20;
        }

        doc.setFillColor(240, 240, 240);
        doc.rect(statsX, statsY, statWidth, 15, 'F');

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(stat.label, statsX + 3, statsY + 6);

        doc.setFontSize(14);
        doc.setTextColor(0, 102, 204);
        doc.text(String(stat.value), statsX + 3, statsY + 12);

        statsX += statWidth + 5;
      });

      currentY = statsY + 20;
    }

    // Table
    if (section.table) {
      autoTable(doc, {
        startY: currentY,
        head: [section.table.headers],
        body: section.table.rows,
        theme: 'striped',
        headStyles: {
          fillColor: [0, 102, 204],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }
  });

  // Footer
  if (data.footer) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `${data.footer} | Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }
  }

  return doc;
}

/**
 * Generate Event Summary Report
 */
export function generateEventReport(data: EventReportData): jsPDF {
  const reportData: ReportData = {
    title: 'Event Summary Report',
    subtitle: data.eventName,
    date: new Date().toLocaleDateString(),
    footer: 'Event Management System',
    sections: [
      {
        title: 'Event Overview',
        stats: [
          { label: 'Event Date', value: data.eventDate },
          { label: 'Location', value: data.eventLocation || 'N/A' },
        ],
      },
      {
        title: 'Attendance Statistics',
        stats: [
          { label: 'Total Participants', value: data.totalParticipants },
          { label: 'Checked In', value: data.checkedInCount },
          { label: 'Attendance Rate', value: `${data.attendanceRate}%` },
        ],
      },
      {
        title: 'Participant List',
        table: {
          headers: ['Name', 'Email', 'Status'],
          rows: data.participants.map(p => [
            p.name,
            p.email,
            p.status,
          ]),
        },
      },
    ],
  };

  return generatePDFReport(reportData);
}

/**
 * Generate Attendance Report
 */
export function generateAttendanceReport(data: AttendanceReportData): jsPDF {
  const reportData: ReportData = {
    title: 'Attendance Report',
    subtitle: data.eventName,
    date: data.reportDate,
    footer: 'Event Management System',
    sections: [
      {
        title: 'Attendance Summary',
        stats: [
          { label: 'Total Participants', value: data.totalParticipants },
          { label: 'Present', value: data.presentCount },
          { label: 'Absent', value: data.absentCount },
          {
            label: 'Attendance Rate',
            value: `${Math.round((data.presentCount / data.totalParticipants) * 100)}%`
          },
        ],
      },
      {
        title: 'Attendance Details',
        table: {
          headers: ['Name', 'Email', 'Check-in Time', 'Status'],
          rows: data.attendanceDetails.map(d => [
            d.name,
            d.email,
            d.checkInTime,
            d.status,
          ]),
        },
      },
    ],
  };

  return generatePDFReport(reportData);
}

/**
 * Event Stats Report Data (for attendance page)
 */
export interface EventStatsReportData {
  eventName: string;
  reportDate: string;
  totalRegistered: number;
  badgesPrinted: number;
  badgesNotPrinted: number;
  coursesWithAttendees: Array<{
    title: string;
    hallName: string;
    startTime: string;
    endTime: string;
    attendeeCount: number;
    attendees: Array<{ nom: string; prenom: string }>;
  }>;
}

/**
 * Generate Event Stats Report (for attendance page)
 */
export function generateEventStatsReport(data: EventStatsReportData): jsPDF {
  const sections: ReportSection[] = [
    {
      title: 'Résumé des Badges',
      stats: [
        { label: 'Total Inscrits', value: data.totalRegistered },
        { label: 'Badges Imprimés', value: data.badgesPrinted },
        { label: 'Badges Non Imprimés', value: data.badgesNotPrinted },
        {
          label: 'Taux Impression',
          value: data.totalRegistered > 0
            ? `${Math.round((data.badgesPrinted / data.totalRegistered) * 100)}%`
            : '0%'
        },
      ],
    },
  ];

  // Add course attendance sections
  data.coursesWithAttendees.forEach((course) => {
    sections.push({
      title: `${course.title} - ${course.hallName}`,
      content: `${new Date(course.startTime).toLocaleString()} - ${new Date(course.endTime).toLocaleString()} | ${course.attendeeCount} participants`,
      table: course.attendees.length > 0 ? {
        headers: ['Nom', 'Prénom'],
        rows: course.attendees.map(a => [a.nom, a.prenom]),
      } : undefined,
    });
  });

  const reportData: ReportData = {
    title: 'Rapport de Présence',
    subtitle: data.eventName,
    date: data.reportDate,
    footer: 'Event Management System',
    sections,
  };

  return generatePDFReport(reportData);
}

/**
 * Generate Participant List Report
 */
export function generateParticipantListReport(
  eventName: string,
  participants: Array<Record<string, any>>,
  columns: string[]
): jsPDF {
  const reportData: ReportData = {
    title: 'Participant List',
    subtitle: eventName,
    date: new Date().toLocaleDateString(),
    footer: 'Event Management System',
    sections: [
      {
        title: 'Statistics',
        stats: [
          { label: 'Total Participants', value: participants.length },
          { label: 'Report Date', value: new Date().toLocaleDateString() },
        ],
      },
      {
        title: 'Full Participant List',
        table: {
          headers: columns,
          rows: participants.map(p =>
            columns.map(col => {
              const value = p[col];
              return value !== undefined && value !== null ? String(value) : '-';
            })
          ),
        },
      },
    ],
  };

  return generatePDFReport(reportData);
}

/**
 * Download PDF file
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(`${filename}.pdf`);
}

/**
 * Open PDF in new window
 */
export function openPDFInNewWindow(doc: jsPDF): void {
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

/**
 * Get PDF as base64 string
 */
export function getPDFBase64(doc: jsPDF): string {
  return doc.output('datauristring');
}

/**
 * Quick export to PDF
 */
export function quickExportToPDF(
  title: string,
  data: Record<string, any>[],
  columns: string[],
  filename: string
): void {
  const reportData: ReportData = {
    title,
    date: new Date().toLocaleDateString(),
    footer: 'Event Management System',
    sections: [
      {
        title: 'Data Export',
        stats: [
          { label: 'Total Records', value: data.length },
          { label: 'Export Date', value: new Date().toLocaleDateString() },
        ],
      },
      {
        title: 'Records',
        table: {
          headers: columns,
          rows: data.map(row =>
            columns.map(col => {
              const value = row[col];
              return value !== undefined && value !== null ? String(value) : '-';
            })
          ),
        },
      },
    ],
  };

  const doc = generatePDFReport(reportData);
  downloadPDF(doc, filename);
}
