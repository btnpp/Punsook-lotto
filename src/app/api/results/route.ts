import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCacheHeaders } from "@/lib/utils";

// GET - ดึงผลหวยทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lotteryTypeId = searchParams.get("lotteryTypeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (lotteryTypeId) where.lotteryTypeId = lotteryTypeId;
    if (status) where.status = status;

    const rounds = await prisma.lotteryRound.findMany({
      where,
      include: {
        lotteryType: true,
        bets: {
          where: {
            status: { not: "CANCELLED" },
          },
          select: {
            id: true,
            netAmount: true,
            winAmount: true,
            isWin: true,
          },
        },
      },
      orderBy: { roundDate: "desc" },
      take: 50,
    });

    // Calculate aggregates for each round
    const roundsWithStats = rounds.map((round) => {
      const betCount = round.bets.length;
      const totalBets = round.bets.reduce((sum, bet) => sum + (bet.netAmount || 0), 0);
      const winAmount = round.bets.reduce((sum, bet) => sum + (bet.winAmount || 0), 0);
      const profit = totalBets - winAmount;

      // Remove bets from response to reduce payload
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { bets, ...roundWithoutBets } = round;

      return {
        ...roundWithoutBets,
        betCount,
        totalBets,
        winAmount,
        profit,
      };
    });

    return NextResponse.json({ rounds: roundsWithStats }, { headers: getCacheHeaders(30, 60) });
  } catch (error) {
    console.error("Get results error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// POST - บันทึกผลหวย
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId, threeTop, threeFront1, threeFront2, threeBack1, threeBack2, twoTop, twoBottom } = body;

    if (!roundId) {
      return NextResponse.json(
        { error: "กรุณาระบุงวดหวย" },
        { status: 400 }
      );
    }

    // Check if round exists
    const round = await prisma.lotteryRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return NextResponse.json(
        { error: "ไม่พบงวดหวย" },
        { status: 404 }
      );
    }

    // Update round with results
    await prisma.lotteryRound.update({
      where: { id: roundId },
      data: {
        result3Top: threeTop,
        result3Front1: threeFront1,
        result3Front2: threeFront2,
        result3Back1: threeBack1,
        result3Back2: threeBack2,
        result2Top: twoTop,
        result2Bottom: twoBottom,
        resultedAt: new Date(),
        status: "CLOSED",
      },
    });

    // Calculate winners
    const bets = await prisma.bet.findMany({
      where: {
        roundId,
        status: "ACTIVE",
      },
    });

    // Get number restrictions for this round
    const restrictions = await prisma.numberRestriction.findMany({
      where: { roundId },
    });

    // Create a map for quick lookup: key = "number-betType"
    const restrictionMap = new Map<string, { type: string; value: number | null }>();
    for (const r of restrictions) {
      restrictionMap.set(`${r.number}-${r.betType}`, {
        type: r.restrictionType,
        value: r.value,
      });
    }

    // Pre-calculate winning numbers for quick lookup
    const threeTopPerms = getPermutations(threeTop || "");
    const threeBottomNumbers = [threeFront1, threeFront2, threeBack1, threeBack2].filter(Boolean) as string[];

    // Calculate results for all bets
    const winnerIds: string[] = [];
    const loserIds: string[] = [];
    const winnerUpdates: { id: string; winAmount: number }[] = [];
    let totalWinAmount = 0;

    for (const bet of bets) {
      let isWin = false;
      let winAmount = 0;

      // Check winning based on bet type
      switch (bet.betType) {
        case "THREE_TOP":
          if (bet.number === threeTop) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
        case "THREE_TOD":
          if (threeTopPerms.includes(bet.number)) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
        case "THREE_BOTTOM":
          if (threeBottomNumbers.includes(bet.number)) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
        case "TWO_TOP":
          if (bet.number === twoTop) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
        case "TWO_BOTTOM":
          if (bet.number === twoBottom) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
        case "RUN_TOP":
          if (threeTop && threeTop.includes(bet.number)) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
        case "RUN_BOTTOM":
          if (twoBottom && twoBottom.includes(bet.number)) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
      }

      // Apply restriction if applicable
      if (isWin && !bet.isFullPay) {
        const restriction = restrictionMap.get(`${bet.number}-${bet.betType}`);
        if (restriction) {
          if (restriction.type === "BLOCKED") {
            winAmount = 0;
          } else if (restriction.type === "REDUCED_PAYOUT" && restriction.value && restriction.value > 0) {
            winAmount = bet.amount * restriction.value;
          }
        }
      }

      if (isWin) {
        winnerIds.push(bet.id);
        winnerUpdates.push({ id: bet.id, winAmount });
        totalWinAmount += winAmount;
      } else {
        loserIds.push(bet.id);
      }
    }

    // Batch update losers (single query)
    if (loserIds.length > 0) {
      await prisma.bet.updateMany({
        where: { id: { in: loserIds } },
        data: { isWin: false, winAmount: 0, status: "LOST" },
      });
    }

    // Batch update winners (need individual updates for different winAmount)
    // Use transaction for better performance
    if (winnerUpdates.length > 0) {
      await prisma.$transaction(
        winnerUpdates.map((w) =>
          prisma.bet.update({
            where: { id: w.id },
            data: { isWin: true, winAmount: w.winAmount, status: "WON" },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      winnersCount: winnerIds.length,
      totalWinAmount,
    });
  } catch (error) {
    console.error("Submit result error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกผล" },
      { status: 500 }
    );
  }
}

// Helper function to get all permutations of a string
function getPermutations(str: string): string[] {
  if (str.length <= 1) return [str];
  
  const perms: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remaining = str.slice(0, i) + str.slice(i + 1);
    for (const perm of getPermutations(remaining)) {
      perms.push(char + perm);
    }
  }
  return [...new Set(perms)]; // Remove duplicates
}
