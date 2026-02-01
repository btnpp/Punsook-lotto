import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST - Add restrictions to a round
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roundId } = await params;
    const body = await request.json();
    const { restrictions } = body;

    if (!restrictions || !Array.isArray(restrictions)) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Check if round exists
    const round = await prisma.lotteryRound.findUnique({
      where: { id: roundId },
      select: { id: true },
    });

    if (!round) {
      return NextResponse.json(
        { error: "ไม่พบงวดหวย" },
        { status: 404 }
      );
    }

    // Batch operation: ดึง existing ทั้งหมดใน 1 query
    const existingRestrictions = await prisma.numberRestriction.findMany({
      where: { roundId },
      select: { number: true, betType: true },
    });

    // สร้าง Set เพื่อ check ซ้ำเร็วขึ้น
    const existingSet = new Set(
      existingRestrictions.map((r) => `${r.number}-${r.betType}`)
    );

    // แยกรายการที่ต้อง create (ไม่มีอยู่แล้ว)
    const toCreate = restrictions
      .filter((r: { number: string; betType: string }) => !existingSet.has(`${r.number}-${r.betType}`))
      .map((r: { number: string; betType: string; type: string; value?: number }) => ({
        roundId,
        number: r.number,
        betType: r.betType,
        restrictionType: r.type,
        value: r.value,
      }));

    // Batch create ใน 1 query
    let createdCount = 0;
    if (toCreate.length > 0) {
      const result = await prisma.numberRestriction.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      createdCount = result.count;
    }

    return NextResponse.json({ 
      success: true, 
      count: createdCount,
      skipped: restrictions.length - createdCount,
    });
  } catch (error) {
    console.error("Add restrictions error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถเพิ่มเลขอั้นได้" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a restriction or all restrictions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roundId } = await params;
    const { searchParams } = new URL(request.url);
    const number = searchParams.get("number");
    const betType = searchParams.get("betType");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      // Delete all restrictions for this round
      const result = await prisma.numberRestriction.deleteMany({
        where: { roundId },
      });
      return NextResponse.json({ success: true, deleted: result.count });
    }

    if (!number || !betType) {
      return NextResponse.json(
        { error: "กรุณาระบุเลขและประเภท" },
        { status: 400 }
      );
    }

    // Delete specific restriction
    const restriction = await prisma.numberRestriction.findFirst({
      where: { roundId, number, betType },
    });

    if (!restriction) {
      return NextResponse.json(
        { error: "ไม่พบเลขอั้น" },
        { status: 404 }
      );
    }

    await prisma.numberRestriction.delete({
      where: { id: restriction.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete restriction error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถลบเลขอั้นได้" },
      { status: 500 }
    );
  }
}
