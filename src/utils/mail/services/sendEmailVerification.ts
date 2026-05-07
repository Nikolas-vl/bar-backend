import { sendEmail } from '../mailer';
import { emailVerificationTemplate } from '../templates/sendEmailVerification';

interface SendEmailVerificationOptions {
  to: string;
  verifyUrl: string;
}

export const sendEmailVerification = async ({ to, verifyUrl }: SendEmailVerificationOptions) => {
  const html = emailVerificationTemplate({ verifyUrl });

  await sendEmail({
    to,
    subject: 'Verify Your Email',
    html,
  });
};
