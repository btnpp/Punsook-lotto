import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    return NextResponse.json({ rounds: roundsWithStats });
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
    const { roundId, threeTop, twoTop, twoBottom } = body;

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

    let winnersCount = 0;
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
          // Check all permutations of three top
          const threeTopPerms = getPermutations(threeTop);
          if (threeTopPerms.includes(bet.number)) {
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
          // Run top: check if bet number appears in threeTop
          if (threeTop && threeTop.includes(bet.number)) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
        case "RUN_BOTTOM":
          // Run bottom: check if bet number appears in twoBottom
          if (twoBottom && twoBottom.includes(bet.number)) {
            isWin = true;
            winAmount = bet.amount * bet.payRate;
          }
          break;
      }

      // Apply number restriction if applicable
      // Only apply if bet is NOT full pay
      if (isWin && !bet.isFullPay) {
        const restrictionKey = `${bet.number}-${bet.betType}`;
        const restriction = restrictionMap.get(restrictionKey);
        
        if (restriction) {
          switch (restriction.type) {
            case "BLOCKED":
              // Should not have been accepted - but if it was, pay 0
              winAmount = 0;
              break;
            case "REDUCED_PAYOUT":
              // Use reduced payout rate instead
              if (restriction.value && restriction.value > 0) {
                winAmount = bet.amount * restriction.value;
              }
              break;
            case "REDUCED_LIMIT":
              // Limit doesn't affect payout calculation
              break;
          }
        }
      }

      // Update bet status
      await prisma.bet.update({
        where: { id: bet.id },
        data: {
          isWin,
          winAmount: isWin ? winAmount : 0,
          status: isWin ? "WON" : "LOST",
        },
      });

      if (isWin) {
        winnersCount++;
        totalWinAmount += winAmount;
      }
    }

    return NextResponse.json({
      success: true,
      winnersCount,
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
