import nodemailer from 'nodemailer';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !pass) {
    logger.warn('SMTP credentials missing — email sending will fail');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  logger.info({ host, port, user }, '📧 SMTP transporter created');

  return transporter;
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const info = await transport.sendMail({ from, to, subject, html });
    logger.info({ messageId: info.messageId, to }, '📧 Email sent successfully');
    return info;
  } catch (error) {
    logger.error({ error, to, subject }, '📧 Failed to send email');
    throw error;
  }
};

export const sendReservationConfirmation = async (options: {
  to: string;
  name: string;
  date: Date;
  guests: number;
  tableNumber: number;
  locationName: string;
  locationAddress: string;
  restaurantName: string;
  preOrders: { dishName: string; quantity: number }[];
}) => {
  const preOrderHtml =
    options.preOrders.length > 0
      ? `<h3>Pre-ordered dishes:</h3>
         <ul>${options.preOrders.map(p => `<li>${p.dishName} x${p.quantity}</li>`).join('')}</ul>`
      : '';

  await sendEmail({
    to: options.to,
    subject: `Reservation Confirmed — ${options.restaurantName}`,
    html: `
      <h2>Your reservation is confirmed!</h2>
      <p>Hi ${options.name},</p>
      <p><strong>Date:</strong> ${options.date.toLocaleString()}</p>
      <p><strong>Guests:</strong> ${options.guests}</p>
      <p><strong>Table:</strong> #${options.tableNumber}</p>
      <p><strong>Location:</strong> ${options.locationName} — ${options.locationAddress}</p>
      ${preOrderHtml}
      <p>See you soon!</p>
    `,
  });
};

export const sendPasswordResetEmail = async (options: { to: string; resetUrl: string }) => {
  await sendEmail({
    to: options.to,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${options.resetUrl}">${options.resetUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `,
  });
};

export const sendEmailVerification = async (options: { to: string; verifyUrl: string }) => {
  await sendEmail({
    to: options.to,
    subject: 'Verify Your Email',
    html: `
      <h2>Email Verification</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${options.verifyUrl}">${options.verifyUrl}</a></p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
};
