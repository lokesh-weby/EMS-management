export function mapEventRow(e) {
  if (!e) return null;
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    department: e.department || 'Computer Science & Engineering',
    eventScope: e.event_scope || e.eventScope || 'National',
    eventType: e.event_type || e.eventType || 'Competition',
    bannerUrl: e.banner_url || e.bannerUrl,
    eventDate: e.event_date || e.eventDate,
    startTime: e.start_time || e.startTime,
    endTime: e.end_time || e.endTime,
    registrationDeadline: e.registration_deadline || e.registrationDeadline,
    venue: e.venue,
    registrationFee: Number(e.registration_fee || e.registrationFee || 0),
    maxTeamSize: Number(e.max_team_size || e.maxTeamSize || 1),
    whatsappGroupLink: e.whatsapp_group_link || e.whatsappGroupLink,
    upiId: e.upi_id || e.upiId,
    accountHolderName: e.account_holder_name || e.accountHolderName,
    upiQrUrl: e.upi_qr_url || e.upiQrUrl,
    status: e.status,
    createdById: e.created_by || e.createdById,
    createdAt: e.created_at || e.createdAt,
    updatedAt: e.updated_at || e.updatedAt,
    organizers: e.organizers || []
  };
}
