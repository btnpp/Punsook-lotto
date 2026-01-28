import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST - Sync discounts to preset "ปกติ" for all agents
export async function POST() {
  try {
    // Get all agents with their discounts and presets
    const agents = await prisma.agent.findMany({
      include: {
        discounts: true,
        discountPresets: {
          where: { name: "ปกติ", isFullPay: false },
        },
      },
    });

    let syncCount = 0;

    for (const agent of agents) {
      for (const discount of agent.discounts) {
        // Find matching preset
        const preset = agent.discountPresets.find(
          (p) => p.lotteryType === discount.lotteryType
        );

        if (preset && preset.discount !== discount.discount) {
          // Update preset to match discount
          await prisma.discountPreset.update({
            where: { id: preset.id },
            data: { discount: discount.discount },
          });
          syncCount++;
          console.log(
            `Synced ${agent.code} ${discount.lotteryType}: ${preset.discount}% -> ${discount.discount}%`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncCount} presets`,
      syncCount,
    });
  } catch (error) {
    console.error("Sync presets error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถ sync ได้" },
      { status: 500 }
    );
  }
}
