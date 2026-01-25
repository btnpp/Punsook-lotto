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
    
    // Get userId and reason from request body (optional)
    let userId: string | undefined;
    let reason: string | undefined;
    try {
      const body = await request.json();
      userId = body.userId;
      reason = body.reason;
    } catch {
      // No body provided, that's okay
    }

    const bet = await prisma.bet.findUnique({
      where: { id },
      include: {
        round: true,
        agent: true,
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

    // Update bet status
    await prisma.bet.update({
      where: { id },
      data: { 
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: reason,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CANCEL_BET",
        entityType: "Bet",
        entityId: id,
        details: JSON.stringify({
          number: bet.number,
          betType: bet.betType,
          amount: bet.amount,
          agentCode: bet.agent.code,
          reason,
        }),
      },
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

// PUT - Update bet (before round closes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, userId, reason } = body;

    const bet = await prisma.bet.findUnique({
      where: { id },
      include: {
        round: true,
        agent: { include: { discounts: true } },
      },
    });

    if (!bet) {
      return NextResponse.json(
        { error: "ไม่พบรายการแทง" },
        { status: 404 }
      );
    }

    // Can only edit if round is still open
    if (bet.round.status !== "OPEN") {
      return NextResponse.json(
        { error: "ไม่สามารถแก้ไขได้ งวดนี้ปิดรับแทงแล้ว" },
        { status: 400 }
      );
    }

    // Can only edit active bets
    if (bet.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "รายการนี้ไม่สามารถแก้ไขได้" },
        { status: 400 }
      );
    }

    const oldAmount = bet.amount;
    
    // Recalculate with new amount
    const discountPct = bet.discountPct;
    const discountAmt = (amount * discountPct) / 100;
    const netAmount = amount - discountAmt;

    // Update bet
    const updatedBet = await prisma.bet.update({
      where: { id },
      data: { 
        amount,
        discountAmt,
        netAmount,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "EDIT_BET",
        entityType: "Bet",
        entityId: id,
        details: JSON.stringify({
          number: bet.number,
          betType: bet.betType,
          oldAmount,
          newAmount: amount,
          reason,
        }),
      },
    });

    return NextResponse.json({ bet: updatedBet, message: "แก้ไขรายการสำเร็จ" });
  } catch (error) {
    console.error("Update bet error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถแก้ไขรายการได้" },
      { status: 500 }
    );
  }
}
