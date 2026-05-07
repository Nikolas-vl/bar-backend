import { baseTemplate } from './baseTemplate';

interface PasswordResetProps {
  resetUrl: string;
}

export const passwordResetTemplate = ({ resetUrl }: PasswordResetProps) => {
  const content = `
    <h2 style="margin-top:0;">Password Reset</h2>

    <p>You requested a password reset.</p>
    <p>Click the button below to set a new password:</p>

    <div style="margin:20px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>

    <p style="word-break:break-all; font-size:12px; color:#757575;">
      Or copy this link:<br/>
      ${resetUrl}
    </p>

    <p style="margin-top:16px; color:#757575;">
      If you didn't request this, you can safely ignore this email.<br/>
      This link will expire in 1 hour.
    </p>
  `;

  return baseTemplate(content, 'Password Reset');
};
