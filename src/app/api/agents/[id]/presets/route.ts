import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - ดึง Presets ของ Agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const lotteryType = searchParams.get("lotteryType");

    const where: Record<string, unknown> = { agentId: id };
    if (lotteryType) {
      where.lotteryType = lotteryType;
    }

    const presets = await prisma.discountPreset.findMany({
      where,
      orderBy: [
        { lotteryType: "asc" },
        { isDefault: "desc" },
        { isFullPay: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ presets });
  } catch (error) {
    console.error("Get presets error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// POST - สร้าง Preset ใหม่
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      lotteryType,
      name,
      discount = 0,
      isFullPay = false,
      isDefault = false,
      payRates = null,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อ Preset" },
        { status: 400 }
      );
    }

    if (!lotteryType) {
      return NextResponse.json(
        { error: "กรุณาระบุประเภทหวย" },
        { status: 400 }
      );
    }

    // Check if agent exists
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json(
        { error: "ไม่พบ Agent" },
        { status: 404 }
      );
    }

    // If this is set as default, unset other defaults for same lottery type
    if (isDefault) {
      await prisma.discountPreset.updateMany({
        where: { agentId: id, lotteryType, isDefault: true },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.discountPreset.create({
      data: {
        agentId: id,
        lotteryType,
        name,
        discount,
        isFullPay,
        isDefault,
        payRates: payRates || undefined,
      },
    });

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    console.error("Create preset error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้าง Preset" },
      { status: 500 }
    );
  }
}
