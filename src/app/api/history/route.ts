import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const bets = await prisma.bet.findMany({
      where,
      include: {
        agent: true,
        round: {
          include: {
            lotteryType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Group bets by slip (createdAt within same minute from same agent)
    const slipsMap = new Map<string, {
      id: string;
      date: Date;
      roundId: string;
      roundDate: Date;
      agent: { code: string; name: string };
      lottery: string;
      lotteryName: string;
      items: Array<{
        id: string;
        number: string;
        betType: string;
        amount: number;
        discount: number;
        netAmount: number;
        status: string;
        winAmount?: number;
      }>;
      totalAmount: number;
      totalDiscount: number;
      totalNetAmount: number;
      status: string;
    }>();

    for (const bet of bets) {
      // Create slip key based on agent, round, and time (within 1 minute)
      const slipTime = new Date(bet.createdAt);
      slipTime.setSeconds(0, 0);
      const slipKey = `${bet.agentId}-${bet.roundId}-${slipTime.getTime()}`;

      if (!slipsMap.has(slipKey)) {
        slipsMap.set(slipKey, {
          id: `SLIP-${bet.id.slice(0, 8)}`,
          date: bet.createdAt,
          roundId: bet.roundId,
          roundDate: bet.round.roundDate,
          agent: { code: bet.agent.code, name: bet.agent.name },
          lottery: bet.round.lotteryType.code,
          lotteryName: bet.round.lotteryType.name,
          items: [],
          totalAmount: 0,
          totalDiscount: 0,
          totalNetAmount: 0,
          status: bet.status,
        });
      }

      const slip = slipsMap.get(slipKey)!;
      slip.items.push({
        id: bet.id,
        number: bet.number,
        betType: bet.betType,
        amount: bet.amount,
        discount: bet.discountPct,
        netAmount: bet.netAmount,
        status: bet.status,
        winAmount: bet.winAmount || undefined,
      });
      slip.totalAmount += bet.amount;
      slip.totalDiscount += bet.discountAmt;
      slip.totalNetAmount += bet.netAmount;
    }

    // Calculate correct status for each slip based on all items
    const slips = Array.from(slipsMap.values()).map(slip => {
      const statuses = slip.items.map(i => i.status);
      
      // If ALL items are cancelled -> slip is cancelled
      if (statuses.every(s => s === "CANCELLED")) {
        slip.status = "CANCELLED";
      }
      // If any item has result (WON or LOST) -> slip is resulted
      else if (statuses.some(s => s === "WON" || s === "LOST")) {
        slip.status = "RESULTED";
      }
      // Otherwise -> active (waiting for result)
      else {
        slip.status = "ACTIVE";
      }
      
      return slip;
    });

    return NextResponse.json({ slips, total: slips.length });
  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
