import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Get counts
    const [agentCount, activeRounds, todayBets, lotteryTypes] = await Promise.all([
      prisma.agent.count({ where: { isActive: true } }),
      prisma.lotteryRound.count({ where: { status: "OPEN" } }),
      prisma.bet.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          status: "ACTIVE",
        },
      }),
      prisma.lotteryType.findMany({
        where: { isActive: true },
      }),
    ]);

    // Calculate today's stats
    let todayAmount = 0;
    for (const bet of todayBets) {
      todayAmount += bet.netAmount;
    }
    const todayBetCount = todayBets.length;

    // Get recent bets
    const recentBets = await prisma.bet.findMany({
      include: {
        agent: true,
        round: {
          include: { lotteryType: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get open rounds
    const openRounds = await prisma.lotteryRound.findMany({
      where: { status: "OPEN" },
      include: {
        lotteryType: true,
        _count: {
          select: { bets: true },
        },
      },
      orderBy: { roundDate: "asc" },
    });

    // Get risk summary (top numbers by amount)
    const riskData = await prisma.bet.groupBy({
      by: ["number", "betType"],
      where: {
        status: "ACTIVE",
        round: { status: "OPEN" },
      },
      _sum: {
        netAmount: true,
      },
      orderBy: {
        _sum: {
          netAmount: "desc",
        },
      },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        agentCount,
        activeRounds,
        todayBetCount,
        todayAmount,
      },
      lotteryTypes,
      recentBets,
      openRounds,
      riskData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูล Dashboard ได้" },
      { status: 500 }
    );
  }
}
