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

// Parse bulk bet input (โพย)
export function parseBulkBet(input: string): Array<{ number: string; amount: number }> {
  const lines = input.trim().split("\n");
  const bets: Array<{ number: string; amount: number }> = [];

  for (const line of lines) {
    // Format: "12=100" or "12 100" or "12x100"
    const match = line.trim().match(/^(\d+)[=\sx]+(\d+)$/);
    if (match) {
      bets.push({
        number: match[1],
        amount: parseInt(match[2], 10),
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

