import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { referrals, wallets, profiles } from '@akorfa/shared';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

function generateReferralCode(): string {
  return 'AKF' + uuidv4().slice(0, 8).toUpperCase();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const code = url.searchParams.get('code');

    if (code) {
      const [referral] = await db.select()
        .from(referrals)
        .where(eq(referrals.referralCode, code))
        .limit(1);
      
      if (!referral) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
      }

      return NextResponse.json({ referral, valid: true });
    }

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const userReferrals = await db.select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    let referralCode = userReferrals.find(r => r.status === 'pending' && !r.referredId)?.referralCode;
    
    if (!referralCode) {
      const newCode = generateReferralCode();
      await db.insert(referrals).values({
        referrerId: userId,
        referralCode: newCode,
        status: 'pending'
      });
      referralCode = newCode;
    }

    const stats = {
      totalReferrals: userReferrals.filter(r => r.referredId).length,
      pendingRewards: userReferrals.filter(r => r.referredId && !r.rewardClaimed).length,
      totalCoinsEarned: userReferrals
        .filter(r => r.rewardClaimed)
        .reduce((sum, r) => sum + (r.rewardCoins || 0), 0)
    };

    return NextResponse.json({ referralCode, referrals: userReferrals, stats });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, referral_code, action } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    if (action === 'use' && referral_code) {
      const [referral] = await db.select()
        .from(referrals)
        .where(eq(referrals.referralCode, referral_code))
        .limit(1);

      if (!referral) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
      }

      if (referral.referrerId === user_id) {
        return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
      }

      if (referral.referredId) {
        return NextResponse.json({ error: 'Referral code already used' }, { status: 400 });
      }

      const [updated] = await db.update(referrals)
        .set({
          referredId: user_id,
          status: 'completed'
        })
        .where(eq(referrals.id, referral.id))
        .returning();

      await db.update(wallets)
        .set({ coinsBalance: sql`COALESCE(${wallets.coinsBalance}, 0) + 25` })
        .where(eq(wallets.userId, user_id));

      return NextResponse.json({ success: true, referral: updated, bonusCoins: 25 });
    }

    if (action === 'claim') {
      const unclaimedReferrals = await db.select()
        .from(referrals)
        .where(eq(referrals.referrerId, user_id));

      const toClaim = unclaimedReferrals.filter(r => r.referredId && !r.rewardClaimed);
      
      if (toClaim.length === 0) {
        return NextResponse.json({ error: 'No rewards to claim' }, { status: 400 });
      }

      const totalCoins = toClaim.reduce((sum, r) => sum + (r.rewardCoins || 0), 0);

      for (const ref of toClaim) {
        await db.update(referrals)
          .set({ rewardClaimed: true, claimedAt: new Date() })
          .where(eq(referrals.id, ref.id));
      }

      await db.update(wallets)
        .set({ coinsBalance: sql`COALESCE(${wallets.coinsBalance}, 0) + ${totalCoins}` })
        .where(eq(wallets.userId, user_id));

      return NextResponse.json({ success: true, claimedCount: toClaim.length, totalCoins });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
