import { transporter, isConfigured } from '../config/email.js';

const FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || 'classmentor@localhost';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter || !isConfigured) {
    console.log('[Email mock]', { to, subject });
    return { messageId: 'mock-' + Date.now() };
  }
  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
  });
  return info;
};

export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to classMentor AI';
  const text = `Hi ${name},\n\nWelcome to classMentor AI! You can now sign in and start chatting.\n\n${APP_URL}`;
  const html = `
    <p>Hi ${name},</p>
    <p>Welcome to <strong>classMentor AI</strong>! You can now sign in and start chatting.</p>
    <p><a href="${APP_URL}">Go to classMentor AI</a></p>
  `;
  return sendMail({ to: email, subject, text, html });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  const subject = 'Reset your classMentor AI password';
  const text = `You requested a password reset. Click the link below (valid for 1 hour):\n\n${resetUrl}`;
  const html = `
    <p>You requested a password reset.</p>
    <p>Click the link below to set a new password (valid for 1 hour):</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>If you didn't request this, you can ignore this email.</p>
  `;
  return sendMail({ to: email, subject, text, html });
};
