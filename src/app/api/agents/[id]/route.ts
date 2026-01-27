import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        discounts: true,
        quotas: true,
        payRates: true,
        bets: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "ไม่พบ Agent" },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Get agent error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูล Agent ได้" },
      { status: 500 }
    );
  }
}

// PUT - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, note, isActive, discounts, payRates } = body;

    // Update agent basic info (only if provided)
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (note !== undefined) updateData.note = note;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length > 0) {
      await prisma.agent.update({
        where: { id },
        data: updateData,
      });
    }

    // Update discounts if provided
    if (discounts && Array.isArray(discounts)) {
      for (const d of discounts) {
        await prisma.agentDiscount.upsert({
          where: {
            agentId_lotteryType: {
              agentId: id,
              lotteryType: d.lotteryType,
            },
          },
          update: { discount: d.discount },
          create: {
            agentId: id,
            lotteryType: d.lotteryType,
            discount: d.discount,
          },
        });
      }
    }

    // Update pay rates if provided
    if (payRates && Array.isArray(payRates)) {
      for (const pr of payRates) {
        // If rate is null or 0, delete the custom rate (use global)
        if (pr.rate === null || pr.rate === 0) {
          await prisma.agentPayRate.deleteMany({
            where: {
              agentId: id,
              lotteryType: pr.lotteryType,
              betType: pr.betType,
            },
          });
        } else {
          // Upsert the custom rate
          await prisma.agentPayRate.upsert({
            where: {
              agentId_lotteryType_betType: {
                agentId: id,
                lotteryType: pr.lotteryType,
                betType: pr.betType,
              },
            },
            update: { payRate: pr.rate },
            create: {
              agentId: id,
              lotteryType: pr.lotteryType,
              betType: pr.betType,
              payRate: pr.rate,
            },
          });
        }
      }
    }

    // Fetch updated agent with relations
    const updatedAgent = await prisma.agent.findUnique({
      where: { id },
      include: { discounts: true, payRates: true },
    });

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error("Update agent error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดต Agent ได้" },
      { status: 500 }
    );
  }
}

// DELETE - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if agent has bets
    const betCount = await prisma.bet.count({
      where: { agentId: id },
    });

    if (betCount > 0) {
      // Soft delete - just deactivate
      await prisma.agent.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ 
        message: "Agent ถูกปิดการใช้งาน (มีประวัติการแทง)",
        softDeleted: true 
      });
    }

    // Hard delete if no bets
    await prisma.agent.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ลบ Agent สำเร็จ" });
  } catch (error) {
    console.error("Delete agent error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถลบ Agent ได้" },
      { status: 500 }
    );
  }
}
