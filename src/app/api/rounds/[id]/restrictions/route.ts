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
    });

    if (!round) {
      return NextResponse.json(
        { error: "ไม่พบงวดหวย" },
        { status: 404 }
      );
    }

    // Create restrictions (upsert to avoid duplicates)
    const results = [];
    for (const restriction of restrictions) {
      const { number, betType, type, value } = restriction;
      
      // Check if already exists
      const existing = await prisma.numberRestriction.findFirst({
        where: { roundId, number, betType },
      });

      if (existing) {
        // Update existing
        const updated = await prisma.numberRestriction.update({
          where: { id: existing.id },
          data: { restrictionType: type, value },
        });
        results.push(updated);
      } else {
        // Create new
        const created = await prisma.numberRestriction.create({
          data: {
            roundId,
            number,
            betType,
            restrictionType: type,
            value,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      restrictions: results,
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
