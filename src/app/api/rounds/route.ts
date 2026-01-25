import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List rounds
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lotteryType = searchParams.get("lotteryType");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    
    if (lotteryType) {
      const lottery = await prisma.lotteryType.findUnique({
        where: { code: lotteryType },
      });
      if (lottery) {
        where.lotteryTypeId = lottery.id;
      }
    }
    
    if (status) {
      where.status = status;
    }

    const rounds = await prisma.lotteryRound.findMany({
      where,
      include: {
        lotteryType: true,
        restrictions: true,
        _count: {
          select: { bets: true },
        },
      },
      orderBy: { roundDate: "desc" },
      take: 50,
    });

    return NextResponse.json({ rounds });
  } catch (error) {
    console.error("Get rounds error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลงวดหวยได้" },
      { status: 500 }
    );
  }
}

// POST - Create new round
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lotteryTypeCode, lotteryTypeId, roundDate } = body;

    if ((!lotteryTypeCode && !lotteryTypeId) || !roundDate) {
      return NextResponse.json(
        { error: "กรุณาระบุประเภทหวยและวันที่" },
        { status: 400 }
      );
    }

    // Get lottery type by code or id
    let lotteryType;
    if (lotteryTypeId) {
      lotteryType = await prisma.lotteryType.findUnique({
        where: { id: lotteryTypeId },
      });
    } else {
      lotteryType = await prisma.lotteryType.findUnique({
        where: { code: lotteryTypeCode },
      });
    }

    if (!lotteryType) {
      return NextResponse.json(
        { error: "ไม่พบประเภทหวย" },
        { status: 400 }
      );
    }

    // Check if round already exists
    const existing = await prisma.lotteryRound.findUnique({
      where: {
        lotteryTypeId_roundDate: {
          lotteryTypeId: lotteryType.id,
          roundDate: new Date(roundDate),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "งวดนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const round = await prisma.lotteryRound.create({
      data: {
        lotteryTypeId: lotteryType.id,
        roundDate: new Date(roundDate),
        status: "OPEN",
      },
      include: {
        lotteryType: true,
      },
    });

    return NextResponse.json({ round }, { status: 201 });
  } catch (error) {
    console.error("Create round error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างงวดหวยได้" },
      { status: 500 }
    );
  }
}
