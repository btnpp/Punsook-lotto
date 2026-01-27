import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all agents
export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        discounts: true,
        quotas: true,
        payRates: true,
        discountPresets: {
          where: { isActive: true },
          orderBy: [{ lotteryType: "asc" }, { isDefault: "desc" }, { isFullPay: "asc" }, { createdAt: "asc" }],
        },
        bets: {
          where: { status: { not: "CANCELLED" } },
          select: {
            netAmount: true,
            winAmount: true,
            isWin: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    // Convert payRates array to customPayRates object and calculate stats
    const agentsWithStats = agents.map((agent) => {
      // Calculate customPayRates
      const customPayRates: Record<string, Record<string, number>> = {};
      for (const pr of agent.payRates) {
        if (!customPayRates[pr.lotteryType]) {
          customPayRates[pr.lotteryType] = {};
        }
        customPayRates[pr.lotteryType][pr.betType] = pr.payRate;
      }

      // Calculate totalBets (sum of netAmount)
      const totalBets = agent.bets.reduce((sum, bet) => sum + (bet.netAmount || 0), 0);
      
      // Calculate winAmount paid out
      const totalWinAmount = agent.bets.reduce((sum, bet) => sum + (bet.winAmount || 0), 0);
      
      // Balance = totalBets - winAmount (positive = profit for house, negative = owed to agent)
      const balance = totalBets - totalWinAmount;

      // Remove bets from response
      const { bets, ...agentWithoutBets } = agent;

      return {
        ...agentWithoutBets,
        customPayRates: Object.keys(customPayRates).length > 0 ? customPayRates : null,
        totalBets,
        balance,
      };
    });

    return NextResponse.json({ agents: agentsWithStats });
  } catch (error) {
    console.error("Get agents error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูล Agent ได้" },
      { status: 500 }
    );
  }
}

// POST - Create new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, phone, note, discounts } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสและชื่อ Agent" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.agent.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "รหัส Agent นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    // Get discount values for each lottery type
    const getDiscount = (lotteryType: string): number => {
      const d = discounts?.find((d: { lotteryType: string }) => d.lotteryType === lotteryType);
      return d?.discount ?? 15;
    };

    // Create default presets for all lottery types
    const defaultPresets = [
      // THAI
      { lotteryType: "THAI", name: "ปกติ", discount: getDiscount("THAI"), isDefault: true, isFullPay: false },
      { lotteryType: "THAI", name: "จ่ายเต็ม", discount: 0, isDefault: false, isFullPay: true },
      // LAO
      { lotteryType: "LAO", name: "ปกติ", discount: getDiscount("LAO"), isDefault: true, isFullPay: false },
      { lotteryType: "LAO", name: "จ่ายเต็ม", discount: 0, isDefault: false, isFullPay: true },
      // HANOI
      { lotteryType: "HANOI", name: "ปกติ", discount: getDiscount("HANOI"), isDefault: true, isFullPay: false },
      { lotteryType: "HANOI", name: "จ่ายเต็ม", discount: 0, isDefault: false, isFullPay: true },
    ];

    // Create agent with discounts and default presets
    const agent = await prisma.agent.create({
      data: {
        code,
        name,
        phone,
        note,
        discounts: discounts
          ? {
              create: discounts.map((d: { lotteryType: string; discount: number }) => ({
                lotteryType: d.lotteryType,
                discount: d.discount,
              })),
            }
          : undefined,
        // Create default presets for every lottery type
        discountPresets: {
          create: defaultPresets,
        },
      },
      include: {
        discounts: true,
        discountPresets: true,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Create agent error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้าง Agent ได้" },
      { status: 500 }
    );
  }
}
