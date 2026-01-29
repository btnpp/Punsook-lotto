import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List bets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("roundId");
    const agentId = searchParams.get("agentId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};
    
    if (roundId) where.roundId = roundId;
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    // Use select instead of include for better performance
    const bets = await prisma.bet.findMany({
      where,
      select: {
        id: true,
        number: true,
        betType: true,
        amount: true,
        discountPct: true,
        discountAmt: true,
        netAmount: true,
        payRate: true,
        isFullPay: true,
        isWin: true,
        winAmount: true,
        status: true,
        createdAt: true,
        agent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        round: {
          select: {
            id: true,
            roundDate: true,
            status: true,
            lotteryType: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Calculate totals
    let totalAmount = 0;
    let totalNetAmount = 0;
    for (const bet of bets) {
      totalAmount += bet.amount;
      totalNetAmount += bet.netAmount;
    }

    return NextResponse.json({
      bets,
      summary: {
        count: bets.length,
        totalAmount,
        totalNetAmount,
      },
    });
  } catch (error) {
    console.error("Get bets error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลการแทงได้" },
      { status: 500 }
    );
  }
}

// Helper function to get discount from preset (simplified - single discount per lottery type)
function getDiscountFromPreset(preset: { 
  discount: number;
  isFullPay: boolean;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} | null, _betType: string): number {
  if (!preset || preset.isFullPay) return 0;
  return preset.discount;
}

// POST - Create new bet(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId, agentId, discountPresetId, isFullPay, bets: betItems, note, userId } = body;

    if (!roundId || !agentId || !betItems || !Array.isArray(betItems)) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    // Get round
    const round = await prisma.lotteryRound.findUnique({
      where: { id: roundId },
      include: { lotteryType: true },
    });

    if (!round) {
      return NextResponse.json(
        { error: "ไม่พบงวดหวย" },
        { status: 400 }
      );
    }

    if (round.status !== "OPEN") {
      return NextResponse.json(
        { error: "งวดนี้ปิดรับแทงแล้ว" },
        { status: 400 }
      );
    }

    // Get agent with discounts
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { discounts: true },
    });

    if (!agent || !agent.isActive) {
      return NextResponse.json(
        { error: "Agent ไม่ถูกต้องหรือถูกระงับ" },
        { status: 400 }
      );
    }

    // Get discount preset if provided
    let discountPreset = null;
    if (discountPresetId) {
      discountPreset = await prisma.discountPreset.findUnique({
        where: { id: discountPresetId },
      });
    }

    // Get pay rates for this lottery type
    const payRates = await prisma.payRate.findMany({
      where: { lotteryTypeId: round.lotteryTypeId },
    });

    const payRateMap = new Map<string, number>();
    for (const pr of payRates) {
      payRateMap.set(pr.betType, pr.payRate);
    }

    // Prepare all bets data first (no DB calls in loop)
    const useFullPay = isFullPay || discountPreset?.isFullPay || false;
    
    // Calculate agent discount once (fallback)
    let agentDiscount = 0;
    for (const d of agent.discounts) {
      if (d.lotteryType === round.lotteryType.code) {
        agentDiscount = d.discount;
        break;
      }
    }

    // Prepare bet data array
    const betsToCreate: Array<{
      roundId: string;
      agentId: string;
      number: string;
      betType: string;
      amount: number;
      discountPct: number;
      discountAmt: number;
      netAmount: number;
      payRate: number;
      isFullPay: boolean;
      status: string;
      createdById: string | undefined;
    }> = [];
    for (const item of betItems) {
      const { number, betType, amount } = item;
      if (!number || !betType || !amount) continue;

      const payRate = payRateMap.get(betType) || 0;
      
      // Get discount from preset or fallback to agent discount
      const discountPct = discountPreset 
        ? getDiscountFromPreset(discountPreset, betType)
        : agentDiscount;

      const discountAmt = (amount * discountPct) / 100;
      const netAmount = amount - discountAmt;

      betsToCreate.push({
        roundId,
        agentId,
        number,
        betType,
        amount,
        discountPct,
        discountAmt,
        netAmount,
        payRate,
        isFullPay: useFullPay,
        status: "ACTIVE",
        createdById: userId || undefined,
      });
    }

    if (betsToCreate.length === 0) {
      return NextResponse.json(
        { error: "ไม่มีรายการแทง" },
        { status: 400 }
      );
    }

    // Use transaction for atomic operation - much faster than individual creates
    const result = await prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.betSession.create({
        data: {
          agentId,
          discountPresetId: discountPresetId || undefined,
          note: note || undefined,
        },
      });

      // Batch create all bets with createMany (single query)
      await tx.bet.createMany({
        data: betsToCreate.map(bet => ({
          ...bet,
          sessionId: session.id,
        })),
      });

      return { sessionId: session.id, count: betsToCreate.length };
    });

    return NextResponse.json(
      {
        success: true,
        count: result.count,
        sessionId: result.sessionId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create bet error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกการแทงได้" },
      { status: 500 }
    );
  }
}
