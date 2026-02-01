import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("th-TH").format(num);
}

// Format currency
export function formatCurrency(num: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// Format date Thai style
export function formatDateThai(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// Format date short
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Calculate discount amount
export function calculateDiscount(amount: number, discountPct: number): number {
  return amount * (discountPct / 100);
}

// Calculate net amount after discount
export function calculateNetAmount(amount: number, discountPct: number): number {
  return amount - calculateDiscount(amount, discountPct);
}

// Calculate safe limit from capital
export function calculateSafeLimit(capital: number, payRate: number): number {
  return Math.floor(capital / payRate);
}

// Calculate max payout
export function calculateMaxPayout(amount: number, payRate: number): number {
  return amount * payRate;
}

// Validate lottery number
export function validateLotteryNumber(number: string, betType: string): boolean {
  const num = number.trim();
  
  switch (betType) {
    case "THREE_TOP":
    case "THREE_TOD":
      return /^\d{3}$/.test(num);
    case "TWO_TOP":
    case "TWO_BOTTOM":
      return /^\d{2}$/.test(num);
    case "RUN_TOP":
    case "RUN_BOTTOM":
      return /^\d{1}$/.test(num);
    default:
      return false;
  }
}

// Helper: Get all permutations of a number string
function getAllPermutations(str: string): string[] {
  if (str.length <= 1) return [str];
  
  const result: Set<string> = new Set();
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remaining = str.slice(0, i) + str.slice(i + 1);
    const perms = getAllPermutations(remaining);
    for (const perm of perms) {
      result.add(char + perm);
    }
  }
  
  return Array.from(result);
}

// Parse bulk bet input (โพย)
// Supports:
// - 12=100 → เลข=จำนวนเงิน (ประเภทตาม digit)
// - 123=100/ → กลับเลข (6 กลับ หรือ 2 กลับ)
// - 603=100x100 → 3ตัวบน x 3ตัวโต๊ด (สัญลักษณ์ x, *, - ใช้แทนกันได้)
// - 603=100x100x100 → 3ตัวบน x 3ตัวโต๊ด x 3ตัวล่าง
// - 603=0*0*100 หรือ 603=.*.*.100 → 3ตัวล่าง 100 เท่านั้น (0 หรือ . = ไม่แทง)
// - 12=100x100 → 2ตัวบน x 2ตัวล่าง
// - 603/ → กลับเลข (ใช้ยอดจากบรรทัดก่อนหน้า)
// - 456=100*100*100/ → 6 กลับ บน+โต๊ด+ล่าง
// - 456=0*0*100/ หรือ 456=.*.*100/ → 6 กลับ เฉพาะ 3ตัวล่าง
// 
// === Pattern ใหม่ (โพยแบบมีหัว) ===
// - บน / ล่าง / โต๊ด → กำหนดประเภทสำหรับบรรทัดถัดไป
// - 289=350×350 → เลข=จำนวนบน×จำนวนโต๊ด (ใช้ context จากหัว)
// - 289×6ตัวล่ะ50 → กลับเลข 6 ตัว ตัวละ 50 บาท
// - 800×3ตัวล่ะ200 → กลับเลข 3 ตัว ตัวละ 200 บาท
export function parseBulkBet(input: string): Array<{ number: string; amount: number; betType?: string }> {
  const lines = input.trim().split("\n");
  const bets: Array<{ number: string; amount: number; betType?: string }> = [];
  let lastAmount = 100; // default amount for reverse
  let currentContext: "TOP" | "BOTTOM" | "TOD" | null = null; // context from header line

  // Helper: parse amount (. or 0 = 0, otherwise parse as int)
  const parseAmount = (val: string): number => {
    if (val === "." || val === "0") return 0;
    return parseInt(val, 10) || 0;
  };

  // Helper: get bet type from context and digit count
  const getBetTypeFromContext = (digitCount: number, context: "TOP" | "BOTTOM" | "TOD" | null): string | undefined => {
    if (!context) return undefined;
    if (digitCount === 3) {
      if (context === "TOP") return "THREE_TOP";
      if (context === "BOTTOM") return "THREE_BOTTOM";
      if (context === "TOD") return "THREE_TOD";
    } else if (digitCount === 2) {
      if (context === "TOP") return "TWO_TOP";
      if (context === "BOTTOM") return "TWO_BOTTOM";
    } else if (digitCount === 1) {
      if (context === "TOP") return "RUN_TOP";
      if (context === "BOTTOM") return "RUN_BOTTOM";
    }
    return undefined;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 0: Context header - "บน", "ล่าง", "โต๊ด"
    if (/^บน$/i.test(trimmed)) {
      currentContext = "TOP";
      continue;
    }
    if (/^ล่าง$/i.test(trimmed)) {
      currentContext = "BOTTOM";
      continue;
    }
    if (/^โต๊ด$/i.test(trimmed)) {
      currentContext = "TOD";
      continue;
    }

    // Pattern NEW: กลับเลข N ตัว - "289×6ตัวล่ะ50" or "800×3ตัวล่ะ200"
    // Supports: ×, x, X, *
    const reverseNMatch = trimmed.match(/^(\d+)[×xX*](\d+)ตัวล่ะ(\d+)$/);
    if (reverseNMatch) {
      const num = reverseNMatch[1];
      const expectedCount = parseInt(reverseNMatch[2], 10);
      const amountPerNumber = parseInt(reverseNMatch[3], 10);
      lastAmount = amountPerNumber;
      
      // Get all permutations
      const permutations = getAllPermutations(num);
      
      // Use only up to expectedCount permutations (in case of duplicates like 800)
      const numbersToUse = permutations.slice(0, expectedCount);
      
      for (const n of numbersToUse) {
        const betType = getBetTypeFromContext(n.length, currentContext);
        bets.push({
          number: n,
          amount: amountPerNumber,
          betType,
        });
      }
      continue;
    }

    // Check if ends with / (reverse)
    const hasReverse = trimmed.endsWith("/");
    const lineWithoutSlash = hasReverse ? trimmed.slice(0, -1) : trimmed;

    // Pattern 1: กลับเลข อย่างเดียว - "603/" or "12/"
    const reverseOnlyMatch = trimmed.match(/^(\d+)\/$/);
    if (reverseOnlyMatch) {
      const num = reverseOnlyMatch[1];
      const permutations = getAllPermutations(num);
      for (const perm of permutations) {
        const betType = getBetTypeFromContext(perm.length, currentContext);
        bets.push({
          number: perm,
          amount: lastAmount,
          betType,
        });
      }
      continue;
    }

    // Pattern 2: Multi-amount with optional reverse - "603=100x100", "603=100*100*100/", "603=.*.*100/"
    // Also supports: "289=350×350" (Thai × character)
    // Match: number=amount1[sep]amount2[sep]amount3 (amount can be number or .)
    const multiMatch = lineWithoutSlash.match(/^(\d+)=([\d.]+)(?:[×xX*\-])([\d.]+)(?:[×xX*\-]([\d.]+))?$/i);
    if (multiMatch) {
      const num = multiMatch[1];
      const amount1 = parseAmount(multiMatch[2]);
      const amount2 = parseAmount(multiMatch[3]);
      const amount3 = multiMatch[4] ? parseAmount(multiMatch[4]) : null;
      
      // Set lastAmount to first non-zero amount
      if (amount1 > 0) lastAmount = amount1;
      else if (amount2 > 0) lastAmount = amount2;
      else if (amount3 && amount3 > 0) lastAmount = amount3;

      // Get all numbers to process (original or permutations)
      const numbersToProcess = hasReverse ? getAllPermutations(num) : [num];

      for (const n of numbersToProcess) {
        if (n.length === 3) {
          // 3 ตัว: บน, โต๊ด, [ล่าง]
          if (amount1 > 0) {
            bets.push({ number: n, amount: amount1, betType: "THREE_TOP" });
          }
          if (amount2 > 0) {
            bets.push({ number: n, amount: amount2, betType: "THREE_TOD" });
          }
          if (amount3 && amount3 > 0) {
            bets.push({ number: n, amount: amount3, betType: "THREE_BOTTOM" });
          }
        } else if (n.length === 2) {
          // 2 ตัว: บน, ล่าง
          if (amount1 > 0) {
            bets.push({ number: n, amount: amount1, betType: "TWO_TOP" });
          }
          if (amount2 > 0) {
            bets.push({ number: n, amount: amount2, betType: "TWO_BOTTOM" });
          }
        }
      }
      continue;
    }

    // Pattern 3: Simple with optional reverse - "12=100" or "123=100/"
    const simpleWithReverseMatch = lineWithoutSlash.match(/^(\d+)[=\s]+(\d+)$/);
    if (simpleWithReverseMatch) {
      const num = simpleWithReverseMatch[1];
      const amount = parseInt(simpleWithReverseMatch[2], 10);
      lastAmount = amount;
      
      const numbersToProcess = hasReverse ? getAllPermutations(num) : [num];
      for (const n of numbersToProcess) {
        const betType = getBetTypeFromContext(n.length, currentContext);
        bets.push({
          number: n,
          amount: amount,
          betType,
        });
      }
      continue;
    }

    // Pattern 4: Simple without = - "12 100"
    const simpleSpaceMatch = trimmed.match(/^(\d+)\s+(\d+)$/);
    if (simpleSpaceMatch) {
      const amount = parseInt(simpleSpaceMatch[2], 10);
      lastAmount = amount;
      const betType = getBetTypeFromContext(simpleSpaceMatch[1].length, currentContext);
      bets.push({
        number: simpleSpaceMatch[1],
        amount: amount,
        betType,
      });
    }
  }

  return bets;
}

// Generate unique code
export function generateCode(prefix: string, count: number): string {
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

// Calculate risk percentage
export function calculateRiskPercentage(current: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.min(100, Math.round((current / limit) * 100));
}

// Get risk level color
export function getRiskLevelColor(percentage: number): string {
  if (percentage >= 95) return "text-red-600 bg-red-100";
  if (percentage >= 80) return "text-orange-600 bg-orange-100";
  if (percentage >= 60) return "text-yellow-600 bg-yellow-100";
  return "text-green-600 bg-green-100";
}

// API Cache headers helper
export function getCacheHeaders(maxAge: number = 30, staleWhileRevalidate: number = 60) {
  return {
    "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}

