import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, verificationUrl, resetUrl, subject, message, actionUrl, actionText } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    if (type === 'verification' && verificationUrl) {
      const result = await emailService.sendVerificationEmail(email, verificationUrl);
      return NextResponse.json(result);
    }

    if (type === 'password_reset' && resetUrl) {
      const result = await emailService.sendPasswordResetEmail(email, resetUrl);
      return NextResponse.json(result);
    }

    if (type === 'notification' && subject && message) {
      const result = await emailService.sendNotificationEmail(email, subject, message, actionUrl, actionText);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid email type or missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
