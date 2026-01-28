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
// - 603=100x100 → 3ตัวบน x 3ตัวโต๊ด (สัญลักษณ์ x, *, - ใช้แทนกันได้)
// - 603=100x100x100 → 3ตัวบน x 3ตัวโต๊ด x 3ตัวล่าง
// - 603=0*0*100 → 3ตัวล่าง 100 เท่านั้น (0 = ไม่แทง)
// - 12=100x100 → 2ตัวบน x 2ตัวล่าง
// - 603/ → กลับเลข (ใช้ยอดจากบรรทัดก่อนหน้า)
// - 456=100*100*100/ → 6 กลับ บน+โต๊ด+ล่าง
// - 456=0*0*100/ → 6 กลับ เฉพาะ 3ตัวล่าง
export function parseBulkBet(input: string): Array<{ number: string; amount: number; betType?: string }> {
  const lines = input.trim().split("\n");
  const bets: Array<{ number: string; amount: number; betType?: string }> = [];
  let lastAmount = 100; // default amount for reverse

  // Regex for separators: x, ×, *, -
  const SEP = /[×x*\-]/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: กลับเลข อย่างเดียว - "603/" or "12/"
    const reverseOnlyMatch = trimmed.match(/^(\d+)\/$/);
    if (reverseOnlyMatch) {
      const num = reverseOnlyMatch[1];
      const permutations = getAllPermutations(num);
      for (const perm of permutations) {
        bets.push({
          number: perm,
          amount: lastAmount,
        });
      }
      continue;
    }

    // Pattern 2: Multi-amount with optional reverse - "603=100x100", "603=100*100*100/", "12=100-100"
    // Check if ends with / (reverse)
    const hasReverse = trimmed.endsWith("/");
    const lineWithoutSlash = hasReverse ? trimmed.slice(0, -1) : trimmed;
    
    // Match: number=amount1[sep]amount2[sep]amount3
    const multiMatch = lineWithoutSlash.match(/^(\d+)=(\d+)(?:[×x*\-])(\d+)(?:[×x*\-](\d+))?$/i);
    if (multiMatch) {
      const num = multiMatch[1];
      const amount1 = parseInt(multiMatch[2], 10);
      const amount2 = parseInt(multiMatch[3], 10);
      const amount3 = multiMatch[4] ? parseInt(multiMatch[4], 10) : null;
      
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

    // Pattern 3: Simple with optional reverse - "12=100" or "12=100/"
    const simpleWithReverseMatch = lineWithoutSlash.match(/^(\d+)[=\s]+(\d+)$/);
    if (simpleWithReverseMatch) {
      const num = simpleWithReverseMatch[1];
      const amount = parseInt(simpleWithReverseMatch[2], 10);
      lastAmount = amount;
      
      const numbersToProcess = hasReverse ? getAllPermutations(num) : [num];
      for (const n of numbersToProcess) {
        bets.push({
          number: n,
          amount: amount,
        });
      }
      continue;
    }

    // Pattern 4: Simple without = - "12 100"
    const simpleSpaceMatch = trimmed.match(/^(\d+)\s+(\d+)$/);
    if (simpleSpaceMatch) {
      const amount = parseInt(simpleSpaceMatch[2], 10);
      lastAmount = amount;
      bets.push({
        number: simpleSpaceMatch[1],
        amount: amount,
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

