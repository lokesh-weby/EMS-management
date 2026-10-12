import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateRegistrationReceiptPDF = ({ registration, event }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('NATIONAL INTER-COLLEGE FEST 2026', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('OFFICIAL REGISTRATION ACKNOWLEDGEMENT RECEIPT', 14, 26);

  // Status Badge
  const statusText = (registration.status || 'PENDING').toUpperCase();
  doc.setFillColor(registration.status === 'approved' ? 16 : registration.status === 'rejected' ? 225 : 217, registration.status === 'approved' ? 185 : registration.status === 'rejected' ? 29 : 119, registration.status === 'approved' ? 129 : registration.status === 'rejected' ? 72 : 6);
  doc.roundedRect(pageWidth - 65, 12, 51, 16, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth - 39.5, 22, { align: 'center' });

  let yPos = 48;

  const refIdStr = registration.id || registration.registrationNumber || 'N/A';

  // Highlighted Team Reference ID Banner
  doc.setDrawColor(79, 70, 229); // Indigo border
  doc.setFillColor(238, 242, 255); // Indigo light fill
  doc.roundedRect(14, yPos, pageWidth - 28, 14, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202); // Indigo-700
  doc.text(`TEAM REFERENCE ID (For Live Status Lookup): ${refIdStr}`, 20, yPos + 9);

  yPos += 18;

  // Registration Summary Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPos, pageWidth - 28, 38, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Team Captain / Participant Details`, 20, yPos + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Participant / Leader: ${registration.leaderName || registration.teamLeaderName || 'N/A'}`, 20, yPos + 18);
  doc.text(`Email: ${registration.leaderEmail || registration.teamLeaderEmail || 'N/A'}`, 20, yPos + 25);
  doc.text(`Phone: ${registration.leaderPhone || registration.teamLeaderPhone || 'N/A'}`, 20, yPos + 32);

  doc.text(`College: ${registration.college || 'N/A'}`, pageWidth / 2 + 10, yPos + 18);
  doc.text(`Department: ${registration.department || 'N/A'}`, pageWidth / 2 + 10, yPos + 25);
  const regDateStr = registration.registrationDate || registration.createdAt;
  doc.text(`Reg Date: ${regDateStr ? new Date(regDateStr).toLocaleDateString() : 'Today'}`, pageWidth / 2 + 10, yPos + 32);

  yPos += 46;

  // Event Details Box
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('EVENT INFORMATION', 14, yPos);

  yPos += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, yPos, pageWidth - 28, 36, 3, 3, 'FD');

  const evTitle = event?.title || registration.event?.title || 'College Event';
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(evTitle, 20, yPos + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Category: ${event?.category || registration.event?.category || 'Technical'}`, 20, yPos + 18);
  doc.text(`Date & Time: ${event?.eventDate || registration.event?.eventDate || 'TBA'} (${event?.startTime || '09:00'} - ${event?.endTime || '17:00'})`, 20, yPos + 25);
  doc.text(`Venue: ${event?.venue || registration.event?.venue || 'Campus Auditorium'}`, 20, yPos + 32);

  const feeVal = event?.registrationFee ?? registration.event?.registrationFee ?? 0;
  doc.text(`Registration Fee: ${feeVal === 0 ? 'FREE ENTRY' : `INR ${feeVal}`}`, pageWidth / 2 + 10, yPos + 18);
  doc.text(`Max Team Members: Up to ${event?.maxTeamSize || registration.event?.maxTeamSize || 4}`, pageWidth / 2 + 10, yPos + 25);

  yPos += 44;

  // Team Members Roster Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTERED TEAM MEMBERS ROSTER', 14, yPos);

  yPos += 4;

  const membersList = registration.members || [];
  const tableData = membersList.length > 0
    ? membersList.map((m, i) => [
        i + 1,
        m.name,
        m.registerNumber || '-',
        m.department || registration.department || '-',
        m.email || '-',
        m.phone || '-'
      ])
    : [
        [1, registration.teamLeaderName, '-', registration.department || '-', registration.teamLeaderEmail, registration.teamLeaderPhone]
      ];

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Member Name', 'Reg / Roll No', 'Department', 'Email', 'Phone']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  const finalY = doc.lastAutoTable.finalY || (yPos + 40);

  // Footer Instructions
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Important Entry Instructions:', 14, finalY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('1. Please carry this printed receipt or digital PDF pass on event day for venue check-in.', 14, finalY + 18);
  doc.text('2. All team members must bring valid college ID cards for registration desk verification.', 14, finalY + 23);
  doc.text('3. For any queries, contact event coordinators listed on the public portal.', 14, finalY + 28);

  // Download PDF file
  const fileName = `Registration_Receipt_${registration.id || 'Pass'}.pdf`;
  doc.save(fileName);
};
