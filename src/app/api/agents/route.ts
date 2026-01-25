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

    // Create agent with discounts
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
      },
      include: {
        discounts: true,
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
