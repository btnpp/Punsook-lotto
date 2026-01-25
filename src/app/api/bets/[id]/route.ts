import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single bet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bet = await prisma.bet.findUnique({
      where: { id },
      include: {
        agent: true,
        round: {
          include: { lotteryType: true },
        },
      },
    });

    if (!bet) {
      return NextResponse.json(
        { error: "ไม่พบรายการแทง" },
        { status: 404 }
      );
    }

    return NextResponse.json({ bet });
  } catch (error) {
    console.error("Get bet error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลได้" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel bet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bet = await prisma.bet.findUnique({
      where: { id },
      include: {
        round: true,
      },
    });

    if (!bet) {
      return NextResponse.json(
        { error: "ไม่พบรายการแทง" },
        { status: 404 }
      );
    }

    // Can only cancel if round is still open
    if (bet.round.status !== "OPEN") {
      return NextResponse.json(
        { error: "ไม่สามารถยกเลิกได้ งวดนี้ปิดรับแทงแล้ว" },
        { status: 400 }
      );
    }

    // Can only cancel active bets
    if (bet.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "รายการนี้ไม่สามารถยกเลิกได้" },
        { status: 400 }
      );
    }

    await prisma.bet.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ message: "ยกเลิกรายการสำเร็จ" });
  } catch (error) {
    console.error("Cancel bet error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถยกเลิกรายการได้" },
      { status: 500 }
    );
  }
}
