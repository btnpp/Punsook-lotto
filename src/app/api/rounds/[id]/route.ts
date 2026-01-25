import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single round with stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const round = await prisma.lotteryRound.findUnique({
      where: { id },
      include: {
        lotteryType: true,
        bets: {
          include: {
            agent: true,
          },
        },
        restrictions: true,
      },
    });

    if (!round) {
      return NextResponse.json(
        { error: "ไม่พบงวดหวย" },
        { status: 404 }
      );
    }

    // Calculate stats
    const totalBets = round.bets.length;
    let totalAmount = 0;
    for (const bet of round.bets) {
      totalAmount += bet.netAmount;
    }

    return NextResponse.json({
      round,
      stats: {
        totalBets,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("Get round error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลงวดหวยได้" },
      { status: 500 }
    );
  }
}

// PUT - Update round (close, submit result)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, result3Top, result2Top, result2Bottom } = body;

    const updateData: Record<string, unknown> = {};

    if (status === "CLOSED") {
      updateData.status = "CLOSED";
      updateData.closedAt = new Date();
    }

    if (status === "RESULTED") {
      updateData.status = "RESULTED";
      updateData.resultedAt = new Date();
      updateData.result3Top = result3Top;
      updateData.result2Top = result2Top || result3Top?.slice(-2);
      updateData.result2Bottom = result2Bottom;

      // Calculate 3 ตัวโต๊ด permutations
      if (result3Top) {
        const digits = result3Top.split("");
        const permutations = new Set<string>();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
              if (i !== j && j !== k && i !== k) {
                permutations.add(digits[i] + digits[j] + digits[k]);
              }
            }
          }
        }
        updateData.result3Tod = Array.from(permutations).join(",");
      }
    }

    const round = await prisma.lotteryRound.update({
      where: { id },
      data: updateData,
      include: {
        lotteryType: true,
      },
    });

    // If resulted, update bet statuses
    if (status === "RESULTED") {
      await updateBetResults(id, round);
    }

    return NextResponse.json({ round });
  } catch (error) {
    console.error("Update round error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตงวดหวยได้" },
      { status: 500 }
    );
  }
}

// Helper function to update bet results
async function updateBetResults(roundId: string, round: { result3Top: string | null; result2Top: string | null; result2Bottom: string | null; result3Tod: string | null }) {
  const bets = await prisma.bet.findMany({
    where: { roundId, status: "ACTIVE" },
  });

  const result3TodArray = round.result3Tod?.split(",") || [];

  for (const bet of bets) {
    let isWin = false;
    let winAmount = 0;

    switch (bet.betType) {
      case "THREE_TOP":
        isWin = bet.number === round.result3Top;
        break;
      case "THREE_TOD":
        isWin = result3TodArray.includes(bet.number);
        break;
      case "TWO_TOP":
        isWin = bet.number === round.result2Top;
        break;
      case "TWO_BOTTOM":
        isWin = bet.number === round.result2Bottom;
        break;
      case "RUN_TOP":
        isWin = round.result3Top?.includes(bet.number) || false;
        break;
      case "RUN_BOTTOM":
        isWin = round.result2Bottom?.includes(bet.number) || false;
        break;
    }

    if (isWin) {
      winAmount = bet.netAmount * bet.payRate;
    }

    await prisma.bet.update({
      where: { id: bet.id },
      data: {
        isWin,
        winAmount: isWin ? winAmount : 0,
        status: isWin ? "WON" : "LOST",
      },
    });
  }
}
