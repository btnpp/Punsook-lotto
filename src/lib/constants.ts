// =============================================
// LOTTERY TYPES
// =============================================

export const LOTTERY_TYPES = {
  THAI: {
    code: "THAI",
    name: "หวยไทย",
    flag: "🇹🇭",
    drawDays: "1,16", // วันที่ 1 และ 16 ของเดือน
    closeTime: "14:30",
  },
  LAO: {
    code: "LAO",
    name: "หวยลาว",
    flag: "🇱🇦",
    drawDays: "MON,WED,FRI", // จันทร์, พุธ, ศุกร์
    closeTime: "20:00",
  },
  HANOI: {
    code: "HANOI",
    name: "หวยฮานอย",
    flag: "🇻🇳",
    drawDays: "DAILY", // ทุกวัน
    closeTime: "18:00",
  },
} as const;

// =============================================
// BET TYPES
// =============================================

export const BET_TYPES = {
  THREE_TOP: {
    code: "THREE_TOP",
    name: "3 ตัวบน",
    shortName: "3บน",
    digits: 3,
    example: "123",
  },
  THREE_TOD: {
    code: "THREE_TOD",
    name: "3 ตัวโต๊ด",
    shortName: "3โต๊ด",
    digits: 3,
    example: "123",
  },
  THREE_BOTTOM: {
    code: "THREE_BOTTOM",
    name: "3 ตัวล่าง",
    shortName: "3ล่าง",
    digits: 3,
    example: "456",
  },
  TWO_TOP: {
    code: "TWO_TOP",
    name: "2 ตัวบน",
    shortName: "2บน",
    digits: 2,
    example: "23",
  },
  TWO_BOTTOM: {
    code: "TWO_BOTTOM",
    name: "2 ตัวล่าง",
    shortName: "2ล่าง",
    digits: 2,
    example: "45",
  },
  RUN_TOP: {
    code: "RUN_TOP",
    name: "วิ่งบน",
    shortName: "วิ่งบน",
    digits: 1,
    example: "5",
  },
  RUN_BOTTOM: {
    code: "RUN_BOTTOM",
    name: "วิ่งล่าง",
    shortName: "วิ่งล่าง",
    digits: 1,
    example: "5",
  },
} as const;

// =============================================
// DEFAULT PAY RATES
// =============================================

export const DEFAULT_PAY_RATES = {
  THAI: {
    THREE_TOP: 900,
    THREE_TOD: 150,
    THREE_BOTTOM: 450,
    TWO_TOP: 90,
    TWO_BOTTOM: 90,
    RUN_TOP: 3.2,
    RUN_BOTTOM: 4.2,
  },
  LAO: {
    THREE_TOP: 850,
    THREE_TOD: 120,
    THREE_BOTTOM: 400,
    TWO_TOP: 95,
    TWO_BOTTOM: 95,
    RUN_TOP: 3.5,
    RUN_BOTTOM: 4.5,
  },
  HANOI: {
    THREE_TOP: 850,
    THREE_TOD: 120,
    THREE_BOTTOM: 400,
    TWO_TOP: 95,
    TWO_BOTTOM: 95,
    RUN_TOP: 3.5,
    RUN_BOTTOM: 4.5,
  },
} as const;

// =============================================
// DEFAULT GLOBAL LIMITS
// =============================================

export const DEFAULT_GLOBAL_LIMITS = {
  THREE_TOP: 200,
  THREE_TOD: 500,
  THREE_BOTTOM: 300,
  TWO_TOP: 5000,
  TWO_BOTTOM: 5000,
  RUN_TOP: 10000,
  RUN_BOTTOM: 10000,
} as const;

// =============================================
// DEFAULT AGENT QUOTAS
// =============================================

export const DEFAULT_AGENT_QUOTAS = {
  THREE_TOP: 50,
  THREE_TOD: 100,
  THREE_BOTTOM: 75,
  TWO_TOP: 500,
  TWO_BOTTOM: 500,
  RUN_TOP: 1000,
  RUN_BOTTOM: 1000,
} as const;

// =============================================
// RISK MODES
// =============================================

export const RISK_MODES = {
  CONSERVATIVE: {
    code: "CONSERVATIVE",
    name: "ปลอดภัย",
    percentage: 50,
    description: "ใช้ 50% ของทุน - เหมาะสำหรับเจ้ามือใหม่",
  },
  BALANCED: {
    code: "BALANCED",
    name: "สมดุล",
    percentage: 75,
    description: "ใช้ 75% ของทุน - สมดุลระหว่างความเสี่ยงและกำไร",
  },
  AGGRESSIVE: {
    code: "AGGRESSIVE",
    name: "เต็มที่",
    percentage: 100,
    description: "ใช้ 100% ของทุน - เหมาะสำหรับเจ้ามือที่มีแหล่งตีออก",
  },
  CUSTOM: {
    code: "CUSTOM",
    name: "กำหนดเอง",
    percentage: 0,
    description: "กำหนด % เอง",
  },
} as const;

// =============================================
// RESTRICTION TYPES
// =============================================

export const RESTRICTION_TYPES = {
  BLOCKED: {
    code: "BLOCKED",
    name: "อั้นเต็ม",
    description: "ปิดรับเลขนั้นทั้งหมด",
  },
  REDUCED_LIMIT: {
    code: "REDUCED_LIMIT",
    name: "อั้นลด Limit",
    description: "ลด Global Limit เฉพาะเลขนั้น",
  },
  REDUCED_PAYOUT: {
    code: "REDUCED_PAYOUT",
    name: "อั้นลดราคาจ่าย",
    description: "รับได้แต่ลดอัตราจ่าย",
  },
} as const;

// =============================================
// STATUS
// =============================================

export const ROUND_STATUS = {
  OPEN: { code: "OPEN", name: "เปิดรับ", color: "bg-green-500" },
  CLOSED: { code: "CLOSED", name: "ปิดรับ", color: "bg-yellow-500" },
  RESULTED: { code: "RESULTED", name: "ออกผลแล้ว", color: "bg-blue-500" },
} as const;

export const BET_STATUS = {
  ACTIVE: { code: "ACTIVE", name: "ใช้งาน", color: "bg-green-500" },
  CANCELLED: { code: "CANCELLED", name: "ยกเลิก", color: "bg-red-500" },
  WON: { code: "WON", name: "ถูกรางวัล", color: "bg-blue-500" },
  LOST: { code: "LOST", name: "ไม่ถูก", color: "bg-gray-500" },
} as const;

export const LAYOFF_STATUS = {
  PENDING: { code: "PENDING", name: "รอดำเนินการ", color: "bg-yellow-500" },
  EXPORTED: { code: "EXPORTED", name: "ส่งออกแล้ว", color: "bg-blue-500" },
  SENT: { code: "SENT", name: "ส่งแล้ว", color: "bg-purple-500" },
  CONFIRMED: { code: "CONFIRMED", name: "ยืนยันแล้ว", color: "bg-green-500" },
} as const;

// =============================================
// DYNAMIC LIMIT MODE
// =============================================

export const LIMIT_MODES = {
  STRICT: {
    code: "STRICT",
    name: "Strict",
    description: "ห้ามเกินโควต้าเด็ดขาด",
  },
  DYNAMIC: {
    code: "DYNAMIC",
    name: "Dynamic",
    description: "เกินโควต้าได้ถ้า Global เหลือ",
  },
  UNLIMITED_AGENT: {
    code: "UNLIMITED_AGENT",
    name: "Unlimited Agent",
    description: "ไม่จำกัดโควต้า Agent, จำกัดแค่ Global",
  },
} as const;

