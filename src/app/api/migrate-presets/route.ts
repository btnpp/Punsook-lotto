import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const LOTTERY_TYPES = ["THAI", "LAO", "HANOI"];

// POST - Create default presets for agents that don't have any
export async function POST() {
  try {
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
        // Check if agent already has presets for this lottery type
        const existingPresets = agent.discountPresets.filter(
          (p) => p.lotteryType === lotteryType
        );
        
        if (existingPresets.length > 0) {
          continue;
        }

        // Get discount value from agent discounts
        const discountValue = agent.discounts.find(
          (d) => d.lotteryType === lotteryType
        )?.discount || 15;

        // Create default preset for this lottery type
        await prisma.discountPreset.create({
          data: {
            agentId: agent.id,
            lotteryType,
            name: "Default",
            discount: discountValue,
            isDefault: true,
            isFullPay: false,
          },
        });

        // Create "จ่ายเต็ม" preset for this lottery type
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

        created += 2;
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
