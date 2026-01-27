// Script to create default presets for existing agents
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating default presets for existing agents...");

  // Get all agents that don't have any presets
  const agents = await prisma.agent.findMany({
    include: {
      discounts: true,
      discountPresets: true,
    },
  });

  for (const agent of agents) {
    if (agent.discountPresets.length > 0) {
      console.log(`Agent ${agent.code} already has presets, skipping...`);
      continue;
    }

    console.log(`Creating presets for Agent ${agent.code}...`);

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

    console.log(`Created presets for Agent ${agent.code}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
