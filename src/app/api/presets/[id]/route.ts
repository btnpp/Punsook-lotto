import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - ดึง Preset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const preset = await prisma.discountPreset.findUnique({
      where: { id },
      include: { agent: true },
    });

    if (!preset) {
      return NextResponse.json(
        { error: "ไม่พบ Preset" },
        { status: 404 }
      );
    }

    return NextResponse.json({ preset });
  } catch (error) {
    console.error("Get preset error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// PUT - อัปเดต Preset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      discount,
      isFullPay,
      isDefault,
      isActive,
      payRates,
    } = body;

    // Find existing preset
    const existingPreset = await prisma.discountPreset.findUnique({
      where: { id },
    });

    if (!existingPreset) {
      return NextResponse.json(
        { error: "ไม่พบ Preset" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults for same lottery type
    if (isDefault && !existingPreset.isDefault) {
      await prisma.discountPreset.updateMany({
        where: { 
          agentId: existingPreset.agentId, 
          lotteryType: existingPreset.lotteryType,
          isDefault: true 
        },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.discountPreset.update({
      where: { id },
      data: {
        name: name ?? existingPreset.name,
        discount: discount ?? existingPreset.discount,
        isFullPay: isFullPay ?? existingPreset.isFullPay,
        isDefault: isDefault ?? existingPreset.isDefault,
        isActive: isActive ?? existingPreset.isActive,
        payRates: payRates !== undefined ? payRates : undefined,
      },
    });

    return NextResponse.json({ preset });
  } catch (error) {
    console.error("Update preset error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดต Preset" },
      { status: 500 }
    );
  }
}

// DELETE - ลบ Preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if preset exists
    const preset = await prisma.discountPreset.findUnique({
      where: { id },
    });

    if (!preset) {
      return NextResponse.json(
        { error: "ไม่พบ Preset" },
        { status: 404 }
      );
    }

    // Check if it's the "จ่ายเต็ม" preset - cannot delete
    if (preset.isFullPay && preset.name === "จ่ายเต็ม") {
      return NextResponse.json(
        { error: "ไม่สามารถลบ Preset จ่ายเต็มได้" },
        { status: 400 }
      );
    }

    await prisma.discountPreset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete preset error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบ Preset" },
      { status: 500 }
    );
  }
}
