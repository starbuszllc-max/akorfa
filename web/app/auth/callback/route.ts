import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { profiles } from '@akorfa/shared';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/auth/login?error=Configuration error`);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          const existing = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
          
          if (existing.length === 0) {
            const username = user.user_metadata?.full_name || user.email?.split('@')[0] || `User_${user.id.slice(0, 8)}`;
            await db.insert(profiles).values({
              id: user.id,
              username: username,
              fullName: user.user_metadata?.full_name || null,
            });
          }
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`);
}
