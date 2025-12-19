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
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0; width: 100%;">
              <tr>
                <td align="center">
                  <a href="${buttonUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #16a34a;">
                    ${buttonText}
                  </a>
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
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 32px 24px;
          }
          .content p {
            margin: 0 0 16px 0;
            font-size: 16px;
            color: #374151;
            line-height: 1.6;
          }
          .footer {
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            background-color: #f9fafb;
            font-size: 12px;
            color: #6b7280;
          }
          .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 24px 0;
          }
          .highlight {
            background-color: #f0fdf4;
            padding: 16px;
            border-left: 4px solid #16a34a;
            border-radius: 4px;
            margin: 16px 0;
          }
        </style>
      </head>
      <body>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 0;">
              <div class="container">
                <div class="header">
                  <h1>${heading}</h1>
                </div>
                <div class="content">
                  ${bodyText}
                  ${actionButton}
                </div>
                <div class="footer">
                  <p style="margin: 0; color: #6b7280;">
                    ${footerText || 'If you did not request this email, please ignore it. This email contains sensitive security information.'}
                  </p>
                  <p style="margin: 12px 0 0 0; color: #9ca3af;">
                    © 2025 Akorfa. All rights reserved.
                  </p>
                </div>
              </div>
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
        `<p>Welcome to Akorfa! We're excited to have you join our community.</p>
         <p>To get started, please verify your email address by clicking the button below. This helps us keep your account secure.</p>
         <div class="highlight">
           <p style="margin: 0; font-weight: 600;">This verification link will expire in 24 hours.</p>
         </div>`,
        verificationUrl,
        'Verify Email Address',
        'If you did not sign up for Akorfa, please disregard this email and do not click the link.'
      );

      const result = await getResend().emails.send({
        from: getSenderEmail(),
        to: email,
        subject: 'Verify your Akorfa account - Action required',
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
        `<p>We received a request to reset the password for your Akorfa account.</p>
         <p>Click the button below to create a new password. If you did not make this request, you can safely ignore this email.</p>
         <div class="highlight">
           <p style="margin: 0; font-weight: 600;">This link will expire in 1 hour for security reasons.</p>
         </div>`,
        resetUrl,
        'Reset Password',
        'If you did not request a password reset, please ignore this email. Your account remains secure.'
      );

      const result = await getResend().emails.send({
        from: getSenderEmail(),
        to: email,
        subject: 'Reset your Akorfa password - Action required',
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
