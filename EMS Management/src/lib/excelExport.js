import * as XLSX from 'xlsx';

export const exportToExcel = (reportType, data) => {
  let exportData = [];

  if (reportType === 'events') {
    exportData = data.map(item => ({
      'Event Title': item.title,
      'Category': item.category,
      'Event Date': item.eventDate,
      'Start Time': item.startTime,
      'End Time': item.endTime,
      'Registration Deadline': item.registrationDeadline,
      'Venue': item.venue,
      'Fee (INR)': item.registrationFee,
      'Max Team Size': item.maxTeamSize,
      'WhatsApp Group Link': item.whatsappGroupLink,
      'Status': item.status
    }));
  } else if (reportType === 'registrations') {
    exportData = data.map(item => ({
      'Event Name': item.eventName || 'N/A',
      'Team Leader Name': item.teamLeaderName,
      'Team Leader Email': item.teamLeaderEmail,
      'Team Leader Phone': item.teamLeaderPhone,
      'College': item.college,
      'Department': item.department,
      'Team Size': item.teamSize,
      'Registration Status': item.status,
      'Remarks': item.remarks || '',
      'Registration Date': new Date(item.registrationDate).toLocaleString()
    }));
  } else if (reportType === 'coordinators') {
    exportData = data.map(item => ({
      'Full Name': item.fullName,
      'Email': item.email,
      'Phone': item.phone,
      'Firebase UID': item.firebaseUid,
      'Status': item.status,
      'Created At': new Date(item.createdAt).toLocaleString()
    }));
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${reportType.toUpperCase()} Report`);

  XLSX.writeFile(workbook, `EMS_${reportType}_report_${Date.now()}.xlsx`);
};
