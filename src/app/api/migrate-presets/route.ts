import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST - Create default presets for agents that don't have any
export async function POST() {
  try {
    // Get all agents that don't have any presets
    const agents = await prisma.agent.findMany({
      include: {
        discounts: true,
        discountPresets: true,
      },
    });

    let created = 0;

    for (const agent of agents) {
      if (agent.discountPresets.length > 0) {
        continue;
      }

      // Get discount values from agent discounts (if any)
      const thaiDiscount = agent.discounts.find(d => d.lotteryType === "THAI")?.discount || 15;

      // Create default preset
      await prisma.discountPreset.create({
        data: {
          agentId: agent.id,
          name: "Default",
          discount3Top: thaiDiscount,
          discount3Tod: thaiDiscount,
          discount2Top: thaiDiscount > 10 ? 10 : thaiDiscount,
          discount2Bottom: thaiDiscount > 10 ? 10 : thaiDiscount,
          discountRunTop: thaiDiscount > 10 ? 10 : thaiDiscount,
          discountRunBottom: thaiDiscount > 10 ? 10 : thaiDiscount,
          isDefault: true,
          isFullPay: false,
        },
      });

      // Create "จ่ายเต็ม" preset
      await prisma.discountPreset.create({
        data: {
          agentId: agent.id,
          name: "จ่ายเต็ม",
          discount3Top: 0,
          discount3Tod: 0,
          discount2Top: 0,
          discount2Bottom: 0,
          discountRunTop: 0,
          discountRunBottom: 0,
          isDefault: false,
          isFullPay: true,
        },
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      message: `Created presets for ${created} agents`,
    });
  } catch (error) {
    console.error("Migrate presets error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
