/**
 * Utility functions for exporting data to CSV/Excel formats
 */

export function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] ?? '';
      // Escape quotes and wrap in quotes if contains comma or quote
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
        ? `"${escaped}"`
        : escaped;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export function exportParticipantsToCSV(
  participants: any[],
  eventName: string,
  fieldDefinitions: any[]
) {
  const headers = ['ID', ...fieldDefinitions.map(f => f.label)];
  const data = participants.map(p => {
    const row: any = { ID: p.id };
    fieldDefinitions.forEach(field => {
      row[field.label] = p.dynamicFields[field.name] || '';
    });
    return row;
  });
  
  const csv = convertToCSV(data, headers);
  const filename = `${eventName.replace(/[^a-z0-9]/gi, '_')}_participants_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}

export function exportAttendanceToCSV(
  attendance: any[],
  participants: Map<string, any>,
  courses: Map<string, any>,
  salles: Map<string, any>,
  eventName: string
) {
  const headers = [
    'Scan Time',
    'Participant Name',
    'Email',
    'Course',
    'Salle',
    'Barcode',
  ];
  
  const data = attendance.map(a => {
    const participant = participants.get(a.participantId);
    const course = courses.get(a.courseId);
    const salle = salles.get(a.salleId);
    
    return {
      'Scan Time': new Date(a.scannedAt).toLocaleString(),
      'Participant Name': participant
        ? `${participant.dynamicFields.firstName} ${participant.dynamicFields.lastName}`
        : 'Unknown',
      'Email': participant?.dynamicFields.email || '',
      'Course': course?.title || 'Unknown',
      'Salle': salle?.name || 'Unknown',
      'Barcode': a.badgeId,
    };
  });
  
  const csv = convertToCSV(data, headers);
  const filename = `${eventName.replace(/[^a-z0-9]/gi, '_')}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}

export function exportCourseRegistrationsToCSV(
  course: any,
  participants: any[],
  eventName: string
) {
  const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Phone'];
  const data = participants.map(p => ({
    'First Name': p.dynamicFields.firstName || '',
    'Last Name': p.dynamicFields.lastName || '',
    'Email': p.dynamicFields.email || '',
    'Company': p.dynamicFields.company || '',
    'Phone': p.dynamicFields.phone || '',
  }));
  
  const csv = convertToCSV(data, headers);
  const filename = `${eventName.replace(/[^a-z0-9]/gi, '_')}_${course.title.replace(/[^a-z0-9]/gi, '_')}_registrations_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}
