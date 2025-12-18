# Resend Email Setup Guide

This guide explains how to configure Resend for sending transactional emails in Akorfa.

## Setup Steps

### 1. Resend Account & API Key
- Your Resend API key is already configured as an environment variable: `RESEND_API_KEY`
- You can find your API key at: https://resend.com/settings/api-keys

### 2. Configure Supabase SMTP with Resend

To use Resend as the email provider for Supabase Auth emails (verification, password reset, etc.):

1. Go to your Supabase Dashboard → **Authentication → Providers**
2. Scroll down to **SMTP Settings**
3. Configure the following:
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL) or `587` (TLS)
   - **Username:** `resend`
   - **Password:** Your Resend API Key
   - **From Address:** `noreply@akorfa.com` (or your verified domain)
   - **From Name:** `Akorfa`

### 3. Using the Email Service

The email service is available at `/lib/resend.ts` and provides three main methods:

```typescript
import { emailService } from '@/lib/resend';

// Send verification email
await emailService.sendVerificationEmail(email, verificationUrl);

// Send password reset email
await emailService.sendPasswordResetEmail(email, resetUrl);

// Send custom notification email
await emailService.sendNotificationEmail(
  email,
  'Your Subject',
  'Your message here',
  'https://actionurl.com',
  'Action Button Text'
);
```

### 4. API Endpoint

Use the email API endpoint for sending emails:

```typescript
// POST /api/email/send
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'verification', // or 'password_reset', 'notification'
    email: 'user@example.com',
    verificationUrl: 'https://...',
    // Or for password reset:
    // resetUrl: 'https://...',
    // Or for notification:
    // subject: 'Title',
    // message: 'Your message',
    // actionUrl: 'https://...',
    // actionText: 'Button Text'
  })
});
```

## Email Templates

All emails are sent from `noreply@akorfa.com` with professional HTML templates that include:
- Branded header and styling
- Clear call-to-action buttons
- Footer with copyright information
- Mobile-responsive design

## Troubleshooting

- **Emails still going to spam:** Ensure your Resend domain is verified in your Resend account
- **SMTP connection issues:** Verify credentials and port settings in Supabase SMTP settings
- **Rate limiting:** Check your Resend plan limits at https://resend.com/pricing

## Related Files

- Email service: `/web/lib/resend.ts`
- Email API endpoint: `/web/app/api/email/send/route.ts`
