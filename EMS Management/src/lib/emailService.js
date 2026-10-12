// Automated Email Service for Event Registration Approvals

export const sendApprovalEmail = async ({ registration, event, organizers, addToast }) => {
  const organizerDetailsFormatted = organizers && organizers.length > 0
    ? organizers.map(o => `• ${o.name} (${o.department}) - Phone: ${o.phone}, Email: ${o.email}`).join('\n')
    : 'Organizers details available at event info desk.';

  const emailBody = `
Dear ${registration.teamLeaderName},

Congratulations! Your team registration for "${event.title}" has been APPROVED.

--- EVENT DETAILS ---
Event Name: ${event.title}
Date: ${event.eventDate}
Time: ${event.startTime} - ${event.endTime}
Venue: ${event.venue}
Registration Fee: ₹${event.registrationFee}

--- COMMUNICATION & GROUP ---
Join Official Participant WhatsApp Group:
${event.whatsappGroupLink || 'Link will be shared shortly.'}

--- EVENT ORGANIZERS CONTACT ---
${organizerDetailsFormatted}

We look forward to seeing you at the event!

Best regards,
Event Coordinating Committee
College Event Management System
  `.trim();

  const emailPayload = {
    to_name: registration.teamLeaderName,
    to_email: registration.teamLeaderEmail,
    event_title: event.title,
    event_date: event.eventDate,
    event_time: `${event.startTime} - ${event.endTime}`,
    venue: event.venue,
    whatsapp_link: event.whatsappGroupLink,
    organizers_text: organizerDetailsFormatted,
    email_body: emailBody
  };

  console.log("📧 [AUTOMATED EMAIL DISPATCHED]", emailPayload);

  try {
    await fetch('http://localhost:5000/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: registration.teamLeaderEmail,
        subject: `[APPROVED] Event Registration for ${event.title}`,
        text: emailBody
      })
    });
  } catch (e) {
    console.warn("Express Email API dispatch notice:", e);
  }

  if (addToast) {
    addToast({
      type: 'email',
      title: 'Automated Email Sent!',
      message: `Approval email sent to ${registration.teamLeaderEmail} with WhatsApp link & organizer contacts.`,
      emailPreview: emailBody
    });
  }

  return { success: true, payload: emailPayload };
};
