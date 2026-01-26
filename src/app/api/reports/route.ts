import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - ดึงรายงานการเงิน
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const agentId = searchParams.get("agentId");

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const where: Record<string, unknown> = {
      status: { not: "CANCELLED" }, // ไม่นับรายการที่ถูกยกเลิก
    };
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }
    if (agentId) {
      where.agentId = agentId;
    }

    // Get all bets in the period (excluding cancelled)
    const bets = await prisma.bet.findMany({
      where,
      include: {
        agent: true,
        round: { include: { lotteryType: true } },
      },
    });

    // Aggregate by agent
    const agentSummary = new Map<string, {
      agentId: string;
      agentCode: string;
      agentName: string;
      totalBets: number;
      totalAmount: number;
      totalDiscount: number;
      totalNetAmount: number;
      totalWinAmount: number;
      profit: number;
    }>();

    for (const bet of bets) {
      const key = bet.agentId;
      
      if (!agentSummary.has(key)) {
        agentSummary.set(key, {
          agentId: bet.agentId,
          agentCode: bet.agent.code,
          agentName: bet.agent.name,
          totalBets: 0,
          totalAmount: 0,
          totalDiscount: 0,
          totalNetAmount: 0,
          totalWinAmount: 0,
          profit: 0,
        });
      }

      const summary = agentSummary.get(key)!;
      summary.totalBets += 1;
      summary.totalAmount += bet.amount;
      summary.totalDiscount += bet.discountAmt;
      summary.totalNetAmount += bet.netAmount;
      summary.totalWinAmount += bet.winAmount || 0;
      summary.profit = summary.totalNetAmount - summary.totalWinAmount;
    }

    // Aggregate by lottery type
    const lotterySummary = new Map<string, {
      lotteryCode: string;
      lotteryName: string;
      totalBets: number;
      totalAmount: number;
      totalNetAmount: number;
      totalWinAmount: number;
      profit: number;
    }>();

    for (const bet of bets) {
      const key = bet.round.lotteryType.code;
      
      if (!lotterySummary.has(key)) {
        lotterySummary.set(key, {
          lotteryCode: key,
          lotteryName: bet.round.lotteryType.name,
          totalBets: 0,
          totalAmount: 0,
          totalNetAmount: 0,
          totalWinAmount: 0,
          profit: 0,
        });
      }

      const summary = lotterySummary.get(key)!;
      summary.totalBets += 1;
      summary.totalAmount += bet.amount;
      summary.totalNetAmount += bet.netAmount;
      summary.totalWinAmount += bet.winAmount || 0;
      summary.profit = summary.totalNetAmount - summary.totalWinAmount;
    }

    // Aggregate by date
    const dailySummary = new Map<string, {
      date: string;
      totalBets: number;
      totalAmount: number;
      totalNetAmount: number;
      totalWinAmount: number;
      profit: number;
    }>();

    for (const bet of bets) {
      const dateKey = bet.createdAt.toISOString().split("T")[0];
      
      if (!dailySummary.has(dateKey)) {
        dailySummary.set(dateKey, {
          date: dateKey,
          totalBets: 0,
          totalAmount: 0,
          totalNetAmount: 0,
          totalWinAmount: 0,
          profit: 0,
        });
      }

      const summary = dailySummary.get(dateKey)!;
      summary.totalBets += 1;
      summary.totalAmount += bet.amount;
      summary.totalNetAmount += bet.netAmount;
      summary.totalWinAmount += bet.winAmount || 0;
      summary.profit = summary.totalNetAmount - summary.totalWinAmount;
    }

    // Calculate totals
    const totalAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalDiscount = bets.reduce((sum, bet) => sum + bet.discountAmt, 0);
    const totalNetAmount = bets.reduce((sum, bet) => sum + bet.netAmount, 0);
    const totalWinAmount = bets.reduce((sum, bet) => sum + (bet.winAmount || 0), 0);
    const totalProfit = totalNetAmount - totalWinAmount;

    return NextResponse.json({
      summary: {
        totalBets: bets.length,
        totalAmount,
        totalDiscount,
        totalNetAmount,
        totalWinAmount,
        totalProfit,
      },
      byAgent: Array.from(agentSummary.values()).sort((a, b) => b.profit - a.profit),
      byLottery: Array.from(lotterySummary.values()).sort((a, b) => b.profit - a.profit),
      byDate: Array.from(dailySummary.values()).sort((a, b) => b.date.localeCompare(a.date)),
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
