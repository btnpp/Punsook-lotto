import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get all settings
export async function GET() {
  try {
    const [capitalSettings, lotteryTypes, globalLimits, payRates] = await Promise.all([
      prisma.capitalSetting.findFirst({ where: { isActive: true } }),
      prisma.lotteryType.findMany({ include: { payRates: true, globalLimits: true } }),
      prisma.globalLimit.findMany({ include: { lotteryType: true } }),
      prisma.payRate.findMany({ include: { lotteryType: true } }),
    ]);

    return NextResponse.json({
      capitalSettings,
      lotteryTypes,
      globalLimits,
      payRates,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลตั้งค่าได้" },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { capitalSettings, payRates, globalLimits } = body;

    // Update capital settings
    if (capitalSettings) {
      const { totalCapital, riskMode, riskPercentage } = capitalSettings;
      const usableCapital = (totalCapital * riskPercentage) / 100;

      await prisma.capitalSetting.updateMany({
        where: { isActive: true },
        data: {
          totalCapital,
          riskMode,
          riskPercentage,
          usableCapital,
        },
      });
    }

    // Update pay rates
    if (payRates && Array.isArray(payRates)) {
      for (const rate of payRates) {
        await prisma.payRate.update({
          where: { id: rate.id },
          data: { payRate: rate.payRate },
        });
      }
    }

    // Update global limits
    if (globalLimits && Array.isArray(globalLimits)) {
      for (const limit of globalLimits) {
        await prisma.globalLimit.update({
          where: { id: limit.id },
          data: { limitAmount: limit.limitAmount },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตตั้งค่าได้" },
      { status: 500 }
    );
  }
}
