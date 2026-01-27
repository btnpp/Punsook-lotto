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
          orderBy: [{ isDefault: "desc" }, { isFullPay: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ agents });
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
      { lotteryType: "THAI", name: "Default", discount: getDiscount("THAI"), isDefault: true, isFullPay: false },
      { lotteryType: "THAI", name: "จ่ายเต็ม", discount: 0, isDefault: false, isFullPay: true },
      // LAO
      { lotteryType: "LAO", name: "Default", discount: getDiscount("LAO"), isDefault: true, isFullPay: false },
      { lotteryType: "LAO", name: "จ่ายเต็ม", discount: 0, isDefault: false, isFullPay: true },
      // HANOI
      { lotteryType: "HANOI", name: "Default", discount: getDiscount("HANOI"), isDefault: true, isFullPay: false },
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
