import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT - Update lottery type settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { openTime, closeTime, drawDays, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (openTime !== undefined) updateData.openTime = openTime;
    if (closeTime !== undefined) updateData.closeTime = closeTime;
    if (drawDays !== undefined) updateData.drawDays = drawDays;
    if (isActive !== undefined) updateData.isActive = isActive;

    const lotteryType = await prisma.lotteryType.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ lotteryType });
  } catch (error) {
    console.error("Update lottery type error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตประเภทหวยได้" },
      { status: 500 }
    );
  }
}

// GET - Get single lottery type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lotteryType = await prisma.lotteryType.findUnique({
      where: { id },
      include: {
        payRates: true,
        globalLimits: true,
      },
    });

    if (!lotteryType) {
      return NextResponse.json(
        { error: "ไม่พบประเภทหวย" },
        { status: 404 }
      );
    }

    return NextResponse.json({ lotteryType });
  } catch (error) {
    console.error("Get lottery type error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลได้" },
      { status: 500 }
    );
  }
}
