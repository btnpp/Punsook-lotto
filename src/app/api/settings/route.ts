import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCacheHeaders } from "@/lib/utils";

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
    }, { headers: getCacheHeaders(60, 120) });
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

      // Find existing or create new
      const existing = await prisma.capitalSetting.findFirst({ where: { isActive: true } });
      
      if (existing) {
        await prisma.capitalSetting.update({
          where: { id: existing.id },
          data: {
            totalCapital,
            riskMode,
            riskPercentage,
            usableCapital,
          },
        });
      } else {
        await prisma.capitalSetting.create({
          data: {
            totalCapital,
            riskMode,
            riskPercentage,
            usableCapital,
            isActive: true,
          },
        });
      }
    }

    // Update pay rates
    if (payRates) {
      // Handle object format: { THAI: { THREE_TOP: 900, ... }, LAO: { ... } }
      if (typeof payRates === "object" && !Array.isArray(payRates)) {
        // Get all lottery types
        const lotteryTypes = await prisma.lotteryType.findMany();
        const lotteryTypeMap = new Map(lotteryTypes.map(lt => [lt.code, lt.id]));

        for (const [lotteryCode, rates] of Object.entries(payRates)) {
          const lotteryTypeId = lotteryTypeMap.get(lotteryCode);
          if (!lotteryTypeId || typeof rates !== "object") continue;

          for (const [betType, payRate] of Object.entries(rates as Record<string, number>)) {
            // Upsert: update if exists, create if not
            const existing = await prisma.payRate.findFirst({
              where: { lotteryTypeId, betType },
            });

            if (existing) {
              await prisma.payRate.update({
                where: { id: existing.id },
                data: { payRate: Number(payRate) },
              });
            } else {
              await prisma.payRate.create({
                data: {
                  lotteryTypeId,
                  betType,
                  payRate: Number(payRate),
                },
              });
            }
          }
        }
      }
      // Handle array format: [{ id, payRate }]
      else if (Array.isArray(payRates)) {
        for (const rate of payRates) {
          await prisma.payRate.update({
            where: { id: rate.id },
            data: { payRate: rate.payRate },
          });
        }
      }
    }

    // Update global limits
    if (globalLimits) {
      // Handle object format: { THREE_TOP: 10000, ... }
      if (typeof globalLimits === "object" && !Array.isArray(globalLimits)) {
        // Get all lottery types
        const lotteryTypes = await prisma.lotteryType.findMany();

        for (const [betType, limitAmount] of Object.entries(globalLimits)) {
          // Update for all lottery types
          for (const lt of lotteryTypes) {
            const existing = await prisma.globalLimit.findFirst({
              where: { lotteryTypeId: lt.id, betType },
            });

            if (existing) {
              await prisma.globalLimit.update({
                where: { id: existing.id },
                data: { limitAmount: Number(limitAmount) },
              });
            } else {
              await prisma.globalLimit.create({
                data: {
                  lotteryTypeId: lt.id,
                  betType,
                  limitAmount: Number(limitAmount),
                },
              });
            }
          }
        }
      }
      // Handle array format: [{ id, limitAmount }]
      else if (Array.isArray(globalLimits)) {
        for (const limit of globalLimits) {
          await prisma.globalLimit.update({
            where: { id: limit.id },
            data: { limitAmount: limit.limitAmount },
          });
        }
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
