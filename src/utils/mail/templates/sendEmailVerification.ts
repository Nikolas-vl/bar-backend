import { baseTemplate } from './baseTemplate';

interface EmailVerificationProps {
  verifyUrl: string;
}

export const emailVerificationTemplate = ({ verifyUrl }: EmailVerificationProps) => {
  const content = `
    <h2 style="margin-top:0;">Email Verification</h2>

    <p>Please confirm your email address by clicking the button below:</p>

    <div style="margin:20px 0;">
      <a href="${verifyUrl}" class="btn">Verify Email</a>
    </div>

    <p style="word-break:break-all; font-size:12px; color:#757575;">
      Or copy this link:<br/>
      ${verifyUrl}
    </p>

    <p style="margin-top:16px; color:#757575;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  return baseTemplate(content, 'Verify Email');
};
