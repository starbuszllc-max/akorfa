import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { creditScores, loans, loanRepayments, wallets, profiles } from '@akorfa/shared/src/schema';
import { eq, sql, and, desc } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CREDIT_TIERS = {
  bronze: { minScore: 0, maxScore: 399, limit: 100, interestRate: 10 },
  silver: { minScore: 400, maxScore: 549, limit: 300, interestRate: 7.5 },
  gold: { minScore: 550, maxScore: 699, limit: 500, interestRate: 5 },
  platinum: { minScore: 700, maxScore: 799, limit: 1000, interestRate: 3 },
  diamond: { minScore: 800, maxScore: 850, limit: 2000, interestRate: 2 }
};

function getTier(score: number): string {
  if (score >= 800) return 'diamond';
  if (score >= 700) return 'platinum';
  if (score >= 550) return 'gold';
  if (score >= 400) return 'silver';
  return 'bronze';
}

async function calculateCreditScore(userId: string): Promise<{ score: number; tier: string; creditLimit: number }> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
  const [existingCredit] = await db.select().from(creditScores).where(eq(creditScores.userId, userId));
  
  let score = 300;
  
  if (wallet) {
    score += Math.min((wallet.creatorLevel || 1) * 30, 300);
    score += Math.min(Math.floor((wallet.totalEarned || 0) / 100), 100);
    score += Math.min((wallet.followerCount || 0) * 2, 50);
  }
  
  if (profile) {
    score += Math.min(Math.floor((profile.totalXp || 0) / 500), 50);
    score += Math.min((profile.level || 1) * 5, 50);
    
    if (profile.createdAt) {
      const accountAgeDays = Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      score += Math.min(Math.floor(accountAgeDays / 30) * 10, 50);
    }
  }
  
  if (existingCredit) {
    score += (existingCredit.totalLoansCompleted || 0) * 20;
    score += (existingCredit.onTimePayments || 0) * 10;
    score -= (existingCredit.latePayments || 0) * 30;
    score -= (existingCredit.totalLoansDefaulted || 0) * 100;
  }
  
  score = Math.max(100, Math.min(850, score));
  
  const tier = getTier(score);
  const tierConfig = CREDIT_TIERS[tier as keyof typeof CREDIT_TIERS];
  
  return { score, tier, creditLimit: tierConfig.limit };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    const { score, tier, creditLimit } = await calculateCreditScore(userId);
    const tierConfig = CREDIT_TIERS[tier as keyof typeof CREDIT_TIERS];

    let [creditRecord] = await db.select().from(creditScores).where(eq(creditScores.userId, userId));
    
    if (!creditRecord) {
      [creditRecord] = await db.insert(creditScores).values({
        userId,
        score,
        tier,
        creditLimit
      }).returning();
    } else {
      [creditRecord] = await db.update(creditScores)
        .set({ score, tier, creditLimit, lastCalculatedAt: new Date(), updatedAt: new Date() })
        .where(eq(creditScores.userId, userId))
        .returning();
    }

    const activeLoans = await db.select()
      .from(loans)
      .where(and(eq(loans.userId, userId), eq(loans.status, 'active')))
      .orderBy(desc(loans.createdAt));

    const loanHistory = await db.select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt))
      .limit(10);

    const hasActiveLoan = activeLoans.length > 0;
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));

    return NextResponse.json({
      creditScore: {
        ...creditRecord,
        interestRate: tierConfig.interestRate
      },
      activeLoans,
      loanHistory,
      canBorrow: !hasActiveLoan,
      maxBorrowAmount: hasActiveLoan ? 0 : creditLimit,
      tiers: CREDIT_TIERS,
      currentBalance: wallet?.coinsBalance || 0
    });
  } catch (error) {
    console.error('Credit fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch credit info' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, amount, termDays = 7 } = body;

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid loan amount required' }, { status: 400 });
    }

    if (![7, 14, 30].includes(termDays)) {
      return NextResponse.json({ error: 'Term must be 7, 14, or 30 days' }, { status: 400 });
    }

    const activeLoans = await db.select()
      .from(loans)
      .where(and(eq(loans.userId, userId), eq(loans.status, 'active')));

    if (activeLoans.length > 0) {
      return NextResponse.json({ error: 'You have an active loan. Repay it first.' }, { status: 400 });
    }

    const { score, tier, creditLimit } = await calculateCreditScore(userId);
    
    if (amount > creditLimit) {
      return NextResponse.json({ 
        error: `Loan amount exceeds your credit limit of ${creditLimit} coins` 
      }, { status: 400 });
    }

    const tierConfig = CREDIT_TIERS[tier as keyof typeof CREDIT_TIERS];
    const interestRate = tierConfig.interestRate;
    const interest = Math.ceil(amount * (interestRate / 100));
    const totalDue = amount + interest;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + termDays);

    const [loan] = await db.insert(loans).values({
      userId,
      amount,
      interestRate: interestRate.toString(),
      totalDue,
      termDays,
      dueDate,
      status: 'active'
    }).returning();

    let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    
    if (wallet) {
      await db.update(wallets)
        .set({ 
          coinsBalance: sql`${wallets.coinsBalance} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, userId));
    } else {
      await db.insert(wallets).values({
        userId,
        coinsBalance: amount,
        pointsBalance: 0,
        totalEarned: 0,
        creatorLevel: 1
      });
    }

    return NextResponse.json({
      success: true,
      loan,
      message: `Loan of ${amount} coins approved! Due: ${dueDate.toLocaleDateString()}`
    });
  } catch (error) {
    console.error('Loan request error:', error);
    return NextResponse.json({ error: 'Failed to process loan request' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, loanId, amount } = body;

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    if (!loanId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid loanId and amount required' }, { status: 400 });
    }

    const [loan] = await db.select()
      .from(loans)
      .where(and(eq(loans.id, loanId), eq(loans.userId, userId)));

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    if (loan.status !== 'active') {
      return NextResponse.json({ error: 'Loan is not active' }, { status: 400 });
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    
    if (!wallet || (wallet.coinsBalance || 0) < amount) {
      return NextResponse.json({ error: 'Insufficient coin balance' }, { status: 400 });
    }

    const remainingDue = loan.totalDue - (loan.amountRepaid || 0);
    const paymentAmount = Math.min(amount, remainingDue);

    const isLate = new Date() > new Date(loan.dueDate);

    await db.insert(loanRepayments).values({
      loanId,
      userId,
      amount: paymentAmount,
      isLate
    });

    const newAmountRepaid = (loan.amountRepaid || 0) + paymentAmount;
    const isFullyRepaid = newAmountRepaid >= loan.totalDue;

    await db.update(loans)
      .set({
        amountRepaid: newAmountRepaid,
        status: isFullyRepaid ? 'repaid' : 'active',
        repaidAt: isFullyRepaid ? new Date() : null
      })
      .where(eq(loans.id, loanId));

    await db.update(wallets)
      .set({
        coinsBalance: sql`${wallets.coinsBalance} - ${paymentAmount}`,
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, userId));

    if (isFullyRepaid) {
      const updateData: Record<string, unknown> = {
        totalLoansCompleted: sql`${creditScores.totalLoansCompleted} + 1`,
        updatedAt: new Date()
      };
      
      if (isLate) {
        updateData.latePayments = sql`${creditScores.latePayments} + 1`;
      } else {
        updateData.onTimePayments = sql`${creditScores.onTimePayments} + 1`;
      }

      await db.update(creditScores)
        .set(updateData)
        .where(eq(creditScores.userId, userId));
    }

    return NextResponse.json({
      success: true,
      paymentAmount,
      remainingBalance: remainingDue - paymentAmount,
      isFullyRepaid,
      message: isFullyRepaid ? 'Loan fully repaid! Your credit score will improve.' : `Payment of ${paymentAmount} coins applied.`
    });
  } catch (error) {
    console.error('Loan repayment error:', error);
    return NextResponse.json({ error: 'Failed to process repayment' }, { status: 500 });
  }
}
