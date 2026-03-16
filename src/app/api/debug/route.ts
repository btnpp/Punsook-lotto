import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      return NextResponse.json({ error: "roundId required" }, { status: 400 });
    }

    const round = await prisma.lotteryRound.findUnique({
      where: { id: roundId },
      include: { lotteryType: true },
    });

    if (!round) {
      return NextResponse.json({ error: "round not found" }, { status: 404 });
    }

    // Get sample bets
    const sampleBets = await prisma.bet.findMany({
      where: { roundId, status: { not: "CANCELLED" } },
      select: { 
        id: true, agentId: true, number: true, betType: true, 
        amount: true, payRate: true, isWin: true, winAmount: true, isFullPay: true,
        status: true,
      },
      take: 10,
      orderBy: { winAmount: "desc" },
    });

    // Get unique agent IDs
    const allBets = await prisma.bet.findMany({
      where: { roundId, status: { not: "CANCELLED" } },
      select: { agentId: true },
    });
    const agentIds = [...new Set(allBets.map(b => b.agentId))];

    // Get agent pay rates
    const agentPayRates = await prisma.agentPayRate.findMany({
      where: { 
        agentId: { in: agentIds },
        lotteryType: round.lotteryType.code,
      },
    });

    // Get ALL agent pay rates for these agents (without lotteryType filter)
    const allAgentPayRates = await prisma.agentPayRate.findMany({
      where: { agentId: { in: agentIds } },
    });

    // Get global pay rates
    const globalPayRates = await prisma.payRate.findMany({
      where: { lotteryTypeId: round.lotteryTypeId },
    });

    // Get restrictions
    const restrictions = await prisma.numberRestriction.findMany({
      where: { roundId },
      take: 20,
    });

    // Get agents info
    const agents = await prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, code: true, name: true },
    });

    return NextResponse.json({
      round: {
        id: round.id,
        lotteryTypeId: round.lotteryTypeId,
        lotteryTypeCode: round.lotteryType.code,
        lotteryTypeName: round.lotteryType.name,
        status: round.status,
      },
      agents,
      agentPayRates_filtered: agentPayRates,
      agentPayRates_all: allAgentPayRates,
      globalPayRates: globalPayRates.map(p => ({ betType: p.betType, payRate: p.payRate })),
      restrictions_sample: restrictions.map(r => ({ number: r.number, betType: r.betType, type: r.restrictionType })),
      sampleBets_winners: sampleBets,
      totalBets: allBets.length,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
