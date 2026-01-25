import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List lottery types with pay rates
export async function GET() {
  try {
    const lotteryTypes = await prisma.lotteryType.findMany({
      where: { isActive: true },
      include: {
        payRates: true,
        globalLimits: true,
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ lotteryTypes });
  } catch (error) {
    console.error("Get lottery types error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลประเภทหวยได้" },
      { status: 500 }
    );
  }
}
