import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - ดึงรายชื่อผู้ถูกรางวัล
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      return NextResponse.json(
        { error: "กรุณาระบุ roundId" },
        { status: 400 }
      );
    }

    const winners = await prisma.bet.findMany({
      where: {
        roundId,
        isWin: true,
      },
      include: {
        agent: true,
        round: {
          include: {
            lotteryType: true,
          },
        },
      },
      orderBy: { winAmount: "desc" },
    });

    const formattedWinners = winners.map((bet) => ({
      id: bet.id,
      agent: { code: bet.agent.code, name: bet.agent.name },
      number: bet.number,
      betType: bet.betType,
      amount: bet.amount,
      payRate: bet.payRate,
      winAmount: bet.winAmount || 0,
    }));

    const totalWinAmount = winners.reduce((sum, bet) => sum + (bet.winAmount || 0), 0);

    return NextResponse.json({
      winners: formattedWinners,
      total: winners.length,
      totalWinAmount,
    });
  } catch (error) {
    console.error("Get winners error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
