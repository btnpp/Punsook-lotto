import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - ดึงข้อมูลความเสี่ยง
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("roundId");
    const lotteryTypeCode = searchParams.get("lotteryType");

    // Get open rounds
    const roundsWhere: Record<string, unknown> = { status: "OPEN" };
    if (lotteryTypeCode) {
      const lotteryType = await prisma.lotteryType.findUnique({
        where: { code: lotteryTypeCode },
      });
      if (lotteryType) {
        roundsWhere.lotteryTypeId = lotteryType.id;
      }
    }

    const openRounds = await prisma.lotteryRound.findMany({
      where: roundsWhere,
      include: { lotteryType: true },
      orderBy: { roundDate: "asc" },
    });

    // Get bets for analysis
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

    // Aggregate by number and bet type
    const riskMap = new Map<string, {
      number: string;
      betType: string;
      lottery: string;
      totalAmount: number;
      betCount: number;
      potentialPayout: number;
    }>();

    for (const bet of bets) {
      const key = `${bet.number}-${bet.betType}-${bet.round.lotteryType.code}`;
      
      if (!riskMap.has(key)) {
        riskMap.set(key, {
          number: bet.number,
          betType: bet.betType,
          lottery: bet.round.lotteryType.code,
          totalAmount: 0,
          betCount: 0,
          potentialPayout: 0,
        });
      }

      const risk = riskMap.get(key)!;
      risk.totalAmount += bet.netAmount;
      risk.betCount += 1;
      risk.potentialPayout += bet.amount * bet.payRate;
    }

    // Convert to array and sort by potential payout
    const riskNumbers = Array.from(riskMap.values())
      .sort((a, b) => b.potentialPayout - a.potentialPayout)
      .slice(0, 100);

    // Calculate totals
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.netAmount, 0);
    const totalPotentialPayout = riskNumbers.reduce((sum, r) => sum + r.potentialPayout, 0);

    return NextResponse.json({
      rounds: openRounds,
      riskNumbers,
      summary: {
        totalBetAmount,
        totalPotentialPayout,
        totalBets: bets.length,
        uniqueNumbers: riskNumbers.length,
      },
    });
  } catch (error) {
    console.error("Get risk error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
