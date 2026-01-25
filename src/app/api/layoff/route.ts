import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - ดึงข้อมูลสำหรับตีออก
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("roundId");

    // Get open rounds
    const openRounds = await prisma.lotteryRound.findMany({
      where: { status: "OPEN" },
      include: { lotteryType: true },
      orderBy: { roundDate: "asc" },
    });

    // Get bets for specific round or all open rounds
    const betsWhere: Record<string, unknown> = { status: "ACTIVE" };
    if (roundId) {
      betsWhere.roundId = roundId;
    } else if (openRounds.length > 0) {
      betsWhere.roundId = { in: openRounds.map((r) => r.id) };
    }

    const bets = await prisma.bet.findMany({
      where: betsWhere,
      include: {
        round: { include: { lotteryType: true } },
      },
    });

    // Get global limits
    const globalLimitsData = await prisma.globalLimit.findMany({
      where: { isActive: true },
      include: { lotteryType: true },
    });

    // Build lookup map
    const globalLimits: Record<string, Record<string, number>> = {};
    for (const limit of globalLimitsData) {
      const code = limit.lotteryType.code;
      if (!globalLimits[code]) globalLimits[code] = {};
      globalLimits[code][limit.betType] = limit.limitAmount;
    }

    // Aggregate bets by number and bet type
    const numberSummary = new Map<string, {
      number: string;
      betType: string;
      lottery: string;
      roundId: string;
      totalAmount: number;
      potentialPayout: number;
      limit: number;
      overLimit: number;
      layoffAmount: number;
    }>();

    for (const bet of bets) {
      const key = `${bet.roundId}-${bet.number}-${bet.betType}`;
      const lotteryCode = bet.round.lotteryType.code;
      
      // Get limit for this bet type and lottery
      const lotteryLimits = globalLimits[lotteryCode] || {};
      const limit = lotteryLimits[bet.betType] || 10000;

      if (!numberSummary.has(key)) {
        numberSummary.set(key, {
          number: bet.number,
          betType: bet.betType,
          lottery: lotteryCode,
          roundId: bet.roundId,
          totalAmount: 0,
          potentialPayout: 0,
          limit,
          overLimit: 0,
          layoffAmount: 0,
        });
      }

      const summary = numberSummary.get(key)!;
      summary.totalAmount += bet.netAmount;
      summary.potentialPayout += bet.amount * bet.payRate;
      summary.overLimit = Math.max(0, summary.totalAmount - summary.limit);
      summary.layoffAmount = summary.overLimit;
    }

    // Filter to only numbers over limit
    const layoffNumbers = Array.from(numberSummary.values())
      .filter((n) => n.overLimit > 0)
      .sort((a, b) => b.overLimit - a.overLimit);

    // Get layoff history
    const layoffHistory = await prisma.layoff.findMany({
      include: {
        round: { include: { lotteryType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      rounds: openRounds,
      layoffNumbers,
      history: layoffHistory.map((l) => ({
        id: l.id,
        roundId: l.roundId,
        lottery: l.round.lotteryType.code,
        lotteryName: l.round.lotteryType.name,
        roundDate: l.round.roundDate,
        number: l.number,
        betType: l.betType,
        totalAmount: l.totalAmount,
        limitAmount: l.limitAmount,
        excessAmount: l.excessAmount,
        layoffAmount: l.layoffAmount,
        keepAmount: l.keepAmount,
        sentTo: l.sentTo,
        status: l.status,
        createdAt: l.createdAt,
      })),
      summary: {
        totalOverLimit: layoffNumbers.reduce((sum, n) => sum + n.overLimit, 0),
        numbersOverLimit: layoffNumbers.length,
      },
    });
  } catch (error) {
    console.error("Get layoff error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// POST - บันทึกการตีออก
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId, number, betType, totalAmount, limitAmount, layoffAmount, sentTo } = body;

    if (!roundId || !number || !betType || !totalAmount) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    const excessAmount = Math.max(0, totalAmount - (limitAmount || 0));
    const keepAmount = totalAmount - (layoffAmount || excessAmount);

    const layoff = await prisma.layoff.create({
      data: {
        roundId,
        number,
        betType,
        totalAmount,
        limitAmount: limitAmount || 0,
        excessAmount,
        layoffAmount: layoffAmount || excessAmount,
        keepAmount,
        sentTo,
        status: "PENDING",
      },
    });

    return NextResponse.json({ layoff });
  } catch (error) {
    console.error("Create layoff error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึก" },
      { status: 500 }
    );
  }
}
