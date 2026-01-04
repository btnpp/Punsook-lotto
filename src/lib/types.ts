// =============================================
// LOTTERY TYPES
// =============================================

export type LotteryTypeCode = "THAI" | "LAO" | "HANOI";

export type BetTypeCode =
  | "THREE_TOP"
  | "THREE_TOD"
  | "TWO_TOP"
  | "TWO_BOTTOM"
  | "RUN_TOP"
  | "RUN_BOTTOM";

export type RiskModeCode = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE" | "CUSTOM";

export type RestrictionTypeCode = "BLOCKED" | "REDUCED_LIMIT" | "REDUCED_PAYOUT";

export type RoundStatusCode = "OPEN" | "CLOSED" | "RESULTED";

export type BetStatusCode = "ACTIVE" | "CANCELLED" | "WON" | "LOST";

export type LayoffStatusCode = "PENDING" | "EXPORTED" | "SENT" | "CONFIRMED";

export type LimitModeCode = "STRICT" | "DYNAMIC" | "UNLIMITED_AGENT";

// =============================================
// API TYPES
// =============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =============================================
// AGENT TYPES
// =============================================

export interface AgentWithDetails {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  note?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  discounts: AgentDiscountData[];
  quotas: AgentQuotaData[];
}

export interface AgentDiscountData {
  id: string;
  agentId: string;
  lotteryType: string;
  discount: number;
}

export interface AgentQuotaData {
  id: string;
  agentId: string;
  lotteryType: string;
  betType: string;
  quotaAmount: number;
  allowDynamic: boolean;
}

export interface CreateAgentInput {
  name: string;
  phone?: string;
  note?: string;
  discounts: {
    lotteryType: LotteryTypeCode;
    discount: number;
  }[];
}

// =============================================
// BET TYPES
// =============================================

export interface BetInput {
  agentId: string;
  roundId: string;
  number: string;
  betType: BetTypeCode;
  amount: number;
}

export interface BulkBetInput {
  agentId: string;
  roundId: string;
  betType: BetTypeCode;
  bets: Array<{ number: string; amount: number }>;
}

export interface BetWithDetails {
  id: string;
  number: string;
  betType: string;
  amount: number;
  discountPct: number;
  discountAmt: number;
  netAmount: number;
  payRate: number;
  isWin?: boolean | null;
  winAmount?: number | null;
  status: string;
  createdAt: Date;
  agent: {
    id: string;
    code: string;
    name: string;
  };
  round: {
    id: string;
    roundDate: Date;
    lotteryType: {
      code: string;
      name: string;
    };
  };
}

// =============================================
// ROUND TYPES
// =============================================

export interface RoundWithDetails {
  id: string;
  roundDate: Date;
  status: string;
  result3Top?: string | null;
  result3Tod?: string | null;
  result2Top?: string | null;
  result2Bottom?: string | null;
  lotteryType: {
    id: string;
    code: string;
    name: string;
  };
  _count?: {
    bets: number;
  };
}

// =============================================
// RISK & LIMIT TYPES
// =============================================

export interface NumberSummary {
  number: string;
  betType: string;
  totalAmount: number;
  agentBreakdown: Record<string, number>;
  limit: number;
  usedPercentage: number;
  isOverLimit: boolean;
  excessAmount: number;
}

export interface RiskAnalysis {
  totalBetAmount: number;
  worstCasePayout: number;
  topRiskNumbers: NumberSummary[];
  overLimitNumbers: NumberSummary[];
  layoffRequired: number;
}

// =============================================
// LAYOFF TYPES
// =============================================

export interface LayoffItem {
  id?: string;
  roundId: string;
  number: string;
  betType: string;
  totalAmount: number;
  limitAmount: number;
  excessAmount: number;
  layoffAmount: number;
  keepAmount: number;
  payRate: number;
  potentialPayout: number;
  status: LayoffStatusCode;
}

export interface LayoffExportData {
  lotteryType: string;
  roundDate: Date;
  items: LayoffItem[];
  totalLayoffAmount: number;
  totalPotentialPayout: number;
}

// =============================================
// DASHBOARD TYPES
// =============================================

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  todayBetAmount: number;
  todayBetCount: number;
  openRounds: number;
  pendingLayoffs: number;
}

export interface AgentSummary {
  agentId: string;
  agentCode: string;
  agentName: string;
  totalBetAmount: number;
  totalDiscount: number;
  netAmount: number;
  winAmount: number;
  balance: number;
}

