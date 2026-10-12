import nodemailer from 'nodemailer';

export const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER || 'lokesh87qw@gmail.com',
    pass: (process.env.SMTP_PASS || 'gkww hjeo llwg kbty').replace(/\s+/g, '')
  }
});

export const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"EMS College Events" <${process.env.SMTP_USER || 'lokesh87qw@gmail.com'}>`,
    to,
    subject,
    text: text || 'College Event Notification',
    html
  };

  return await smtpTransporter.sendMail(mailOptions);
};
