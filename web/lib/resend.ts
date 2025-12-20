import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

function getSenderEmail(): string {
  const domain = process.env.RESEND_FROM_DOMAIN || 'noreply@akorfa.publicvm.com';
  return `noreply@${domain}`;
}

function getEmailTemplate(heading: string, bodyText: string, buttonUrl?: string, buttonText?: string, footerText?: string): { html: string; text: string } {
  const actionButton = buttonUrl && buttonText ? `
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#16a34a" style="border-radius: 4px;">
                      <a href="${buttonUrl}" style="background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-weight: 600; display: inline-block; border: 1px solid #16a34a;">
                        ${buttonText}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333333; background-color: #ffffff; margin: 0; padding: 0;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <tr>
                  <td style="background-color: #16a34a; padding: 24px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold;">
                      ${heading}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; font-size: 14px; line-height: 1.6; color: #333333;">
                    ${bodyText}
                    ${actionButton}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px; border-top: 1px solid #dddddd; font-size: 12px; color: #666666; text-align: center;">
                    ${footerText || 'If you did not request this email, please ignore it.'}
                    <br><br>
                    © 2025 Akorfa. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
${heading}

${bodyText.replace(/<[^>]*>/g, '')}

${buttonUrl && buttonText ? `${buttonText}: ${buttonUrl}` : ''}

${footerText || 'If you did not request this email, please ignore it.'}

© 2025 Akorfa. All rights reserved.
  `.trim();

  return { html, text };
}

export const emailService = {
  async sendVerificationEmail(email: string, verificationUrl: string) {
    try {
      const { html, text } = getEmailTemplate(
        'Verify Your Email',
        `<p>Welcome to Akorfa!</p>
         <p>Please verify your email address to activate your account. Click the button below to proceed.</p>
         <p style="margin-top: 20px; font-size: 13px; color: #666666;">
           This verification link will expire in 24 hours.
         </p>`,
        verificationUrl,
        'Verify Email',
        'If you did not create this account, you can safely ignore this email.'
      );

      const result = await getResend().emails.send({
        from: getSenderEmail(),
        to: email,
        subject: 'Verify your Akorfa account',
        html,
        text,
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error };
    }
  },

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    try {
      const { html, text } = getEmailTemplate(
        'Reset Your Password',
        `<p>We received a request to reset your password.</p>
         <p>Click the button below to create a new password. This link will expire in 1 hour.</p>
         <p style="margin-top: 20px; font-size: 13px; color: #666666;">
           If you did not request this reset, you can safely ignore this email.
         </p>`,
        resetUrl,
        'Reset Password',
        'If you did not request this password reset, please ignore this email.'
      );

      const result = await getResend().emails.send({
        from: getSenderEmail(),
        to: email,
        subject: 'Reset your password',
        html,
        text,
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }
  },

  async sendNotificationEmail(email: string, subject: string, message: string, actionUrl?: string, actionText?: string) {
    try {
      const { html, text } = getEmailTemplate(
        subject,
        `<p>${message.replace(/\n/g, '</p><p>')}</p>`,
        actionUrl,
        actionText
      );

      const result = await getResend().emails.send({
        from: getSenderEmail(),
        to: email,
        subject,
        html,
        text,
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending notification email:', error);
      return { success: false, error };
    }
  },
};

export default getResend;
