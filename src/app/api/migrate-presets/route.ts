import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const LOTTERY_TYPES = ["THAI", "LAO", "HANOI"];

// POST - Create default presets for agents that don't have any
export async function POST() {
  try {
    // First, rename any existing "Default" presets to "ปกติ"
    const renamed = await prisma.discountPreset.updateMany({
      where: { name: "Default" },
      data: { name: "ปกติ" },
    });
    console.log(`Renamed ${renamed.count} presets from Default to ปกติ`);

    // Get all agents with their discounts and presets
    const agents = await prisma.agent.findMany({
      include: {
        discounts: true,
        discountPresets: true,
      },
    });

    let created = 0;

    for (const agent of agents) {
      for (const lotteryType of LOTTERY_TYPES) {
        const presetsForLottery = agent.discountPresets.filter(
          (p) => p.lotteryType === lotteryType
        );
        
        // Check if default preset exists (check both "Default" and "ปกติ")
        const hasDefault = presetsForLottery.some((p) => p.name === "Default" || p.name === "ปกติ" || p.isDefault);
        // Check if จ่ายเต็ม preset exists
        const hasFullPay = presetsForLottery.some((p) => p.isFullPay || p.name === "จ่ายเต็ม");

        // Get discount value from agent discounts
        const discountValue = agent.discounts.find(
          (d) => d.lotteryType === lotteryType
        )?.discount || 15;

        // Create default preset if not exists
        if (!hasDefault) {
          await prisma.discountPreset.create({
            data: {
              agentId: agent.id,
              lotteryType,
              name: "ปกติ",
              discount: discountValue,
              isDefault: true,
              isFullPay: false,
            },
          });
          created++;
        }

        // Create "จ่ายเต็ม" preset if not exists
        if (!hasFullPay) {
          await prisma.discountPreset.create({
            data: {
              agentId: agent.id,
              lotteryType,
              name: "จ่ายเต็ม",
              discount: 0,
              isDefault: false,
              isFullPay: true,
            },
          });
          created++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} presets`,
    });
  } catch (error) {
    console.error("Migrate presets error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
