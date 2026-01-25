import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get activity logs for a bet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const activities = await prisma.activityLog.findMany({
      where: {
        entityType: "Bet",
        entityId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Get bet activities error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลได้" },
      { status: 500 }
    );
  }
}
