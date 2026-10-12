import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (reportType, data, filters = {}) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Brand Indigo
  doc.text('College Event Management System (EMS)', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(`${reportType.toUpperCase()} REPORT`, 14, 28);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${dateStr} | Category Filter: ${filters.category || 'All'} | Status: ${filters.status || 'All'}`, 14, 34);

  if (reportType === 'events') {
    const tableHeaders = [['Title', 'Category', 'Date', 'Venue', 'Fee (₹)', 'Max Team', 'Status']];
    const tableData = data.map(item => [
      item.title,
      item.category,
      item.eventDate,
      item.venue,
      `₹${item.registrationFee}`,
      item.maxTeamSize,
      item.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 40,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }
    });
  } else if (reportType === 'registrations') {
    const tableHeaders = [['Event Name', 'Team Leader', 'College', 'Department', 'Team Size', 'Status', 'Date']];
    const tableData = data.map(item => [
      item.eventName || 'N/A',
      item.teamLeaderName,
      item.college,
      item.department,
      item.teamSize,
      item.status.toUpperCase(),
      new Date(item.registrationDate).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 40,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }
    });
  } else if (reportType === 'coordinators') {
    const tableHeaders = [['Full Name', 'Email', 'Phone', 'Firebase UID', 'Status', 'Joined Date']];
    const tableData = data.map(item => [
      item.fullName,
      item.email,
      item.phone,
      item.firebaseUid || 'N/A',
      item.status.toUpperCase(),
      new Date(item.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 40,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }
    });
  }

  doc.save(`EMS_${reportType}_report_${Date.now()}.pdf`);
};
