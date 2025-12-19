# Resend Email Setup Guide

This guide explains how to configure Resend for sending transactional emails in Akorfa.

## Critical Setup: Domain Configuration for Deliverability

Email verification going to spam is almost always a domain configuration issue. Follow these steps exactly:

### 1. Verify Your Domain in Resend

1. Go to https://resend.com/domains
2. Click **"Add Domain"** and enter your domain (e.g., `akorfa.publicvm.com`)
3. Resend will provide DNS records that YOU MUST add to your domain provider:
   - **SPF Record** (prevents spoofing)
   - **DKIM Record** (verifies authenticity)
   - **DMARC Record** (sets policy for authentication failures)
4. Add these records to your domain's DNS settings (GoDaddy, Vercel, etc.)
5. Return to Resend and click "Verify" - wait until all records show ✓

**⚠️ This is the most important step. Without DNS verification, emails will go to spam.**

### 2. Set Resend API Key

- Ensure `RESEND_API_KEY` is set as an environment variable in Vercel
- Get your API key at: https://resend.com/settings/api-keys

### 3. Configure Environment Variables

In your Vercel project settings, ensure these are set:
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_FROM_DOMAIN` - Your verified domain (e.g., `akorfa.publicvm.com`)

### 4. Test Email Sending

Run a test verification email to yourself:
1. Sign up for a new account with your email
2. Check inbox AND spam folder
3. If still in spam after domain verification, contact Resend support

## Email Templates (Updated Dec 2024)

All emails now feature:
- Professional gradient header with Akorfa branding
- Proper email structure with semantic HTML
- Plain text version for better client compatibility
- Clear security messaging and expiration warnings
- Mobile-responsive design
- Both HTML and text versions sent (improves deliverability)

### Improved Email Features

The updated email templates include:
- **Professional styling** - Gradient headers, proper spacing, modern design
- **Dual format** - HTML and plain text versions for maximum compatibility
- **Security messaging** - Link expiration times and clear action buttons
- **Spam-safe content** - No spam trigger words, proper formatting
- **Mobile optimized** - Responsive tables instead of divs

## Using the Email Service

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

## API Endpoint

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

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Emails going to spam** | Verify your domain in Resend (add SPF/DKIM/DMARC records to DNS). This is the #1 cause. |
| **Domain not verifying** | Wait 24-48 hours after adding DNS records. ISPs cache DNS entries. Check your domain provider for proper record format. |
| **Low deliverability** | Ensure both HTML and text versions are being sent. Check that sender name matches domain. |
| **Rate limiting** | Check your Resend plan limits at https://resend.com/pricing |
| **SMTP connection issues** | If using SMTP, verify credentials and port settings (465 for SSL, 587 for TLS) |

## Email Sender Configuration

Emails are sent from: `noreply@[your-verified-domain]`

Example:
- Domain configured in Resend: `akorfa.publicvm.com`
- Sender email: `noreply@akorfa.publicvm.com`
- This must match your verified domain for SPF/DKIM to work

## Related Files

- Email service: `/web/lib/resend.ts` (updated Dec 2024)
- Email API endpoint: `/web/app/api/email/send/route.ts`
- Signup page: `/web/app/(auth)/signup/page.tsx`
