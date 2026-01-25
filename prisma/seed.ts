// @ts-nocheck
// This file is for local seeding only, not used in production build
// Use prisma/seed.sql for production seeding via Supabase SQL Editor

import "dotenv/config";

// Dynamic import to avoid build issues with Prisma 7
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create roles
  const roles = [
    {
      code: "MASTER",
      name: "Master",
      description: "เจ้าของระบบ - สิทธิ์เต็ม",
      permissions: JSON.stringify([
        "VIEW_DASHBOARD",
        "MANAGE_USERS",
        "MANAGE_ROLES",
        "MANAGE_AGENTS",
        "MANAGE_BETS",
        "MANAGE_RESULTS",
        "MANAGE_LAYOFF",
        "MANAGE_SETTINGS",
        "VIEW_REPORTS",
      ]),
      isSystem: true,
    },
    {
      code: "ADMIN",
      name: "Admin",
      description: "ผู้ดูแลระบบ",
      permissions: JSON.stringify([
        "VIEW_DASHBOARD",
        "MANAGE_AGENTS",
        "MANAGE_BETS",
        "MANAGE_RESULTS",
        "MANAGE_LAYOFF",
        "VIEW_REPORTS",
      ]),
      isSystem: true,
    },
    {
      code: "OPERATOR",
      name: "Operator",
      description: "พนักงานคีย์หวย",
      permissions: JSON.stringify([
        "VIEW_DASHBOARD",
        "MANAGE_BETS",
        "VIEW_REPORTS",
      ]),
      isSystem: true,
    },
    {
      code: "VIEWER",
      name: "Viewer",
      description: "ดูข้อมูลอย่างเดียว",
      permissions: JSON.stringify(["VIEW_DASHBOARD", "VIEW_REPORTS"]),
      isSystem: true,
    },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { code: roleData.code },
      update: roleData,
      create: roleData,
    });
  }
  console.log("✅ Created roles");

  // Get admin role
  const adminRole = await prisma.role.findUnique({
    where: { code: "ADMIN" },
  });

  if (!adminRole) {
    throw new Error("Admin role not found");
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Administrator",
      roleId: adminRole.id,
    },
  });
  console.log("✅ Created admin user:", admin.username);

  // Create lottery types
  const lotteryTypes = [
    {
      code: "THAI",
      name: "หวยไทย",
      description: "หวยรัฐบาลไทย",
      drawDays: "1,16",
      closeTime: "14:30",
    },
    {
      code: "LAO",
      name: "หวยลาว",
      description: "หวยลาว",
      drawDays: "MON,WED,FRI",
      closeTime: "20:00",
    },
    {
      code: "HANOI",
      name: "หวยฮานอย",
      description: "หวยฮานอย",
      drawDays: "DAILY",
      closeTime: "18:00",
    },
  ];

  for (const lottery of lotteryTypes) {
    await prisma.lotteryType.upsert({
      where: { code: lottery.code },
      update: lottery,
      create: lottery,
    });
  }
  console.log("✅ Created lottery types");

  // Create pay rates
  const payRates = [
    // Thai
    { lotteryCode: "THAI", betType: "THREE_TOP", payRate: 900 },
    { lotteryCode: "THAI", betType: "THREE_TOD", payRate: 150 },
    { lotteryCode: "THAI", betType: "TWO_TOP", payRate: 90 },
    { lotteryCode: "THAI", betType: "TWO_BOTTOM", payRate: 90 },
    { lotteryCode: "THAI", betType: "RUN_TOP", payRate: 3.2 },
    { lotteryCode: "THAI", betType: "RUN_BOTTOM", payRate: 4.2 },
    // Lao
    { lotteryCode: "LAO", betType: "THREE_TOP", payRate: 850 },
    { lotteryCode: "LAO", betType: "THREE_TOD", payRate: 120 },
    { lotteryCode: "LAO", betType: "TWO_TOP", payRate: 95 },
    { lotteryCode: "LAO", betType: "TWO_BOTTOM", payRate: 95 },
    { lotteryCode: "LAO", betType: "RUN_TOP", payRate: 3.5 },
    { lotteryCode: "LAO", betType: "RUN_BOTTOM", payRate: 4.5 },
    // Hanoi
    { lotteryCode: "HANOI", betType: "THREE_TOP", payRate: 850 },
    { lotteryCode: "HANOI", betType: "THREE_TOD", payRate: 120 },
    { lotteryCode: "HANOI", betType: "TWO_TOP", payRate: 95 },
    { lotteryCode: "HANOI", betType: "TWO_BOTTOM", payRate: 95 },
    { lotteryCode: "HANOI", betType: "RUN_TOP", payRate: 3.5 },
    { lotteryCode: "HANOI", betType: "RUN_BOTTOM", payRate: 4.5 },
  ];

  for (const rate of payRates) {
    const lotteryType = await prisma.lotteryType.findUnique({
      where: { code: rate.lotteryCode },
    });
    if (lotteryType) {
      await prisma.payRate.upsert({
        where: {
          lotteryTypeId_betType: {
            lotteryTypeId: lotteryType.id,
            betType: rate.betType,
          },
        },
        update: { payRate: rate.payRate },
        create: {
          lotteryTypeId: lotteryType.id,
          betType: rate.betType,
          payRate: rate.payRate,
        },
      });
    }
  }
  console.log("✅ Created pay rates");

  // Create global limits
  const globalLimits = [
    { betType: "THREE_TOP", limitAmount: 200 },
    { betType: "THREE_TOD", limitAmount: 500 },
    { betType: "TWO_TOP", limitAmount: 5000 },
    { betType: "TWO_BOTTOM", limitAmount: 5000 },
    { betType: "RUN_TOP", limitAmount: 10000 },
    { betType: "RUN_BOTTOM", limitAmount: 10000 },
  ];

  const allLotteryTypes = await prisma.lotteryType.findMany();
  for (const lotteryType of allLotteryTypes) {
    for (const limit of globalLimits) {
      await prisma.globalLimit.upsert({
        where: {
          lotteryTypeId_betType: {
            lotteryTypeId: lotteryType.id,
            betType: limit.betType,
          },
        },
        update: { limitAmount: limit.limitAmount },
        create: {
          lotteryTypeId: lotteryType.id,
          betType: limit.betType,
          limitAmount: limit.limitAmount,
        },
      });
    }
  }
  console.log("✅ Created global limits");

  // Create capital settings
  await prisma.capitalSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      totalCapital: 1000000,
      riskMode: "BALANCED",
      riskPercentage: 75,
      usableCapital: 750000,
    },
  });
  console.log("✅ Created capital settings");

  // Create demo agents
  const agents = [
    { code: "A001", name: "นายสมชาย ใจดี", phone: "081-234-5678" },
    { code: "A002", name: "นายวิชัย รวยมาก", phone: "089-876-5432" },
    { code: "A003", name: "นายประสิทธิ์ ดีเลิศ", phone: "062-345-6789" },
  ];

  for (const agentData of agents) {
    const agent = await prisma.agent.upsert({
      where: { code: agentData.code },
      update: agentData,
      create: agentData,
    });

    // Create discounts for each agent
    const discounts = [
      { lotteryType: "THAI", discount: 15 },
      { lotteryType: "LAO", discount: 12 },
      { lotteryType: "HANOI", discount: 10 },
    ];

    for (const discount of discounts) {
      await prisma.agentDiscount.upsert({
        where: {
          agentId_lotteryType: {
            agentId: agent.id,
            lotteryType: discount.lotteryType,
          },
        },
        update: { discount: discount.discount },
        create: {
          agentId: agent.id,
          lotteryType: discount.lotteryType,
          discount: discount.discount,
        },
      });
    }
  }
  console.log("✅ Created demo agents with discounts");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

