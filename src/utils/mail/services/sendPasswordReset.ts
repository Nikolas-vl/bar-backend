import { sendEmail } from '../mailer';
import { passwordResetTemplate } from '../templates/resetPassword';

interface SendPasswordResetOptions {
  to: string;
  resetUrl: string;
}

export const sendPasswordReset = async ({ to, resetUrl }: SendPasswordResetOptions) => {
  const html = passwordResetTemplate({ resetUrl });

  await sendEmail({
    to,
    subject: 'Password Reset Request',
    html,
  });
};
