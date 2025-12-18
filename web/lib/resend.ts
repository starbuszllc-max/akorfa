import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendVerificationEmail(email: string, verificationUrl: string) {
    try {
      const result = await resend.emails.send({
        from: 'noreply@akorfa.com',
        to: email,
        subject: 'Verify your Akorfa account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Akorfa!</h2>
            <p style="color: #666;">Thank you for signing up. Please verify your email address to get started.</p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Verify Email
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't sign up for Akorfa, please ignore this email.
            </p>
          </div>
        `,
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error };
    }
  },

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    try {
      const result = await resend.emails.send({
        from: 'noreply@akorfa.com',
        to: email,
        subject: 'Reset your Akorfa password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666;">We received a request to reset your password. Click the link below to create a new password.</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Reset Password
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This link expires in 24 hours. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }
  },

  async sendNotificationEmail(email: string, subject: string, message: string, actionUrl?: string, actionText?: string) {
    try {
      const actionButton = actionUrl && actionText ? `
        <a href="${actionUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          ${actionText}
        </a>
      ` : '';

      const result = await resend.emails.send({
        from: 'noreply@akorfa.com',
        to: email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p style="color: #666; line-height: 1.6;">${message}</p>
            ${actionButton}
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              © 2025 Akorfa. All rights reserved.
            </p>
          </div>
        `,
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending notification email:', error);
      return { success: false, error };
    }
  },
};

export default resend;
