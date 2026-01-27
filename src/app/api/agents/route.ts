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
        // Create default presets for every new agent
        discountPresets: {
          create: [
            {
              name: "Default",
              discount3Top: discounts?.find((d: { lotteryType: string }) => d.lotteryType === "THREE_TOP")?.discount || 15,
              discount3Tod: discounts?.find((d: { lotteryType: string }) => d.lotteryType === "THREE_TOD")?.discount || 15,
              discount2Top: discounts?.find((d: { lotteryType: string }) => d.lotteryType === "TWO_TOP")?.discount || 10,
              discount2Bottom: discounts?.find((d: { lotteryType: string }) => d.lotteryType === "TWO_BOTTOM")?.discount || 10,
              discountRunTop: discounts?.find((d: { lotteryType: string }) => d.lotteryType === "RUN_TOP")?.discount || 10,
              discountRunBottom: discounts?.find((d: { lotteryType: string }) => d.lotteryType === "RUN_BOTTOM")?.discount || 10,
              isDefault: true,
              isFullPay: false,
            },
            {
              name: "จ่ายเต็ม",
              discount3Top: 0,
              discount3Tod: 0,
              discount2Top: 0,
              discount2Bottom: 0,
              discountRunTop: 0,
              discountRunBottom: 0,
              isDefault: false,
              isFullPay: true,
            },
          ],
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
