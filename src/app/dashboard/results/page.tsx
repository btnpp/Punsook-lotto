"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, Calendar, Trophy, Calculator, Plus, ArrowRight, Eye, Users, Edit, FileText, Wallet, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { ResultsSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES } from "@/lib/constants";

// Demo winners data - ข้อมูลผู้ถูกรางวัลตัวอย่าง
const demoWinners: Record<string, Array<{
  id: string;
  agent: { code: string; name: string };
  number: string;
  betType: string;
  amount: number;
  payRate: number;
  winAmount: number;
}>> = {
  "4": [ // Round ID for Thai 1/1/69
    { id: "w1", agent: { code: "A001", name: "นายสมชาย" }, number: "123", betType: "THREE_TOP", amount: 100, payRate: 900, winAmount: 90000 },
    { id: "w2", agent: { code: "A001", name: "นายสมชาย" }, number: "23", betType: "TWO_TOP", amount: 500, payRate: 90, winAmount: 45000 },
    { id: "w3", agent: { code: "A002", name: "นายวิชัย" }, number: "45", betType: "TWO_BOTTOM", amount: 300, payRate: 90, winAmount: 27000 },
  ],
  "5": [ // Round ID for Lao 3/1/69
    { id: "w4", agent: { code: "A003", name: "นายประสิทธิ์" }, number: "789", betType: "THREE_TOD", amount: 200, payRate: 150, winAmount: 30000 },
    { id: "w5", agent: { code: "A001", name: "นายสมชาย" }, number: "89", betType: "TWO_TOP", amount: 1000, payRate: 90, winAmount: 90000 },
  ],
};

// Helper function to calculate next draw date
function getNextDrawDate(lotteryType: string, currentDate: Date): Date {
  const next = new Date(currentDate);
  
  switch (lotteryType) {
    case "THAI":
      // Thai lottery: 1st or 16th of month
      const currentDay = currentDate.getDate();
      if (currentDay < 16) {
        // Next is 16th of same month
        next.setDate(16);
      } else {
        // Next is 1st of next month
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
      }
      break;
      
    case "LAO":
      // Lao lottery: Monday (1), Wednesday (3), Friday (5)
      const laoDays = [1, 3, 5]; // Monday, Wednesday, Friday
      let currentDayOfWeek = currentDate.getDay();
      let daysToAdd = 1;
      
      // Find the next draw day
      for (let i = 1; i <= 7; i++) {
        const nextDay = (currentDayOfWeek + i) % 7;
        if (laoDays.includes(nextDay)) {
          daysToAdd = i;
          break;
        }
      }
      next.setDate(next.getDate() + daysToAdd);
      break;
      
    case "HANOI":
      // Hanoi lottery: Every day
      next.setDate(next.getDate() + 1);
      break;
      
    default:
      next.setDate(next.getDate() + 1);
  }
  
  return next;
}

// Get default close time for lottery type
function getDefaultCloseTime(lotteryType: string): string {
  switch (lotteryType) {
    case "THAI": return "14:30";
    case "LAO": return "20:00";
    case "HANOI": return "18:00";
    default: return "18:00";
  }
}

// Demo rounds data
const demoRounds = [
  {
    id: "1",
    lotteryType: "THAI",
    roundDate: new Date("2026-01-16"),
    status: "OPEN",
    totalBets: 285000,
    betCount: 156,
  },
  {
    id: "2",
    lotteryType: "LAO",
    roundDate: new Date("2026-01-06"),
    status: "OPEN",
    totalBets: 98500,
    betCount: 78,
  },
  {
    id: "3",
    lotteryType: "HANOI",
    roundDate: new Date("2026-01-04"),
    status: "OPEN",
    totalBets: 74500,
    betCount: 45,
  },
  {
    id: "4",
    lotteryType: "THAI",
    roundDate: new Date("2026-01-01"),
    status: "RESULTED",
    result3Top: "123",
    result2Top: "23",
    result2Bottom: "45",
    totalBets: 320000,
    betCount: 189,
    winAmount: 45000,
    profit: 275000,
  },
  {
    id: "5",
    lotteryType: "LAO",
    roundDate: new Date("2026-01-03"),
    status: "RESULTED",
    result3Top: "789",
    result2Top: "89",
    result2Bottom: "12",
    totalBets: 125000,
    betCount: 92,
    winAmount: 85000,
    profit: 40000,
  },
];

interface Round {
  id: string;
  lotteryType: { code: string; name: string };
  roundDate: Date;
  status: string;
  result3Top?: string;
  result3Front1?: string;
  result3Front2?: string;
  result3Back1?: string;
  result3Back2?: string;
  result2Top?: string;
  result2Bottom?: string;
  lotteryCode?: string;
  lotteryName?: string;
  totalBets?: number;
  betCount?: number;
  winAmount?: number;
  profit?: number;
}

interface Winner {
  id: string;
  agent: { code: string; name: string };
  number: string;
  betType: string;
  amount: number;
  payRate: number;
  winAmount: number;
}

export default function ResultsPage() {
  const toast = useToast();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isWinnersDialogOpen, setIsWinnersDialogOpen] = useState(false);
  const [autoCreateNextRound, setAutoCreateNextRound] = useState(true);
  const [lastCreatedRound, setLastCreatedRound] = useState<{
    lotteryType: string;
    date: Date;
    closeTime: string;
  } | null>(null);
  const [resultInput, setResultInput] = useState({
    result3Top: "",
    result3Front1: "",
    result3Front2: "",
    result3Back1: "",
    result3Back2: "",
    result2Top: "",
    result2Bottom: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // format: YYYY-MM

  // SWR for rounds
  interface ResultsResponse {
    rounds: Array<Round & { roundDate: string }>;
  }
  const { data: roundsData, isLoading, mutate: mutateRounds } = useSWR<ResultsResponse>("/api/results");

  useEffect(() => {
    if (roundsData?.rounds) {
      setRounds(roundsData.rounds.map((r) => ({
        ...r,
        roundDate: new Date(r.roundDate),
        lotteryCode: r.lotteryType.code,
        lotteryName: r.lotteryType.name,
      })));
    }
  }, [roundsData]);

  const fetchRounds = () => mutateRounds();

  const fetchWinners = async (roundId: string) => {
    try {
      const res = await fetch(`/api/results/winners?roundId=${roundId}`);
      if (res.ok) {
        const data = await res.json();
        setWinners(data.winners || []);
      }
    } catch (error) {
      console.error("Fetch winners error:", error);
    }
  };

  const openRounds = rounds.filter((r) => r.status === "OPEN");
  const resultedRounds = rounds.filter((r) => r.status === "CLOSED" || r.status === "RESULTED");

  // Filter resulted rounds by selected month
  const filteredResultedRounds = useMemo(() => {
    if (!selectedMonth) return resultedRounds;
    const [year, month] = selectedMonth.split("-").map(Number);
    return resultedRounds.filter((r) => {
      const d = r.roundDate;
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [resultedRounds, selectedMonth]);

  // Available months (from resulted rounds) for quick navigation
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const r of resultedRounds) {
      const d = r.roundDate;
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return Array.from(set).sort().reverse();
  }, [resultedRounds]);

  const formatMonthLabel = (ym: string) => {
    const [year, month] = ym.split("-").map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  };

  const shiftMonth = (direction: -1 | 1) => {
    const base = selectedMonth
      ? (() => {
          const [y, m] = selectedMonth.split("-").map(Number);
          return new Date(y, m - 1, 1);
        })()
      : new Date();
    base.setMonth(base.getMonth() + direction);
    const ym = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(ym);
  };

  // Get winners for selected round
  const getWinners = () => {
    return winners;
  };

  const handleOpenWinnersDialog = async (round: Round) => {
    setSelectedRound(round);
    await fetchWinners(round.id);
    setIsWinnersDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="ผลหวย" subtitle="บันทึกผลและดูผู้ถูกรางวัล" />
        <ResultsSkeleton />
      </div>
    );
  }

  const handleOpenResultDialog = (round: Round) => {
    setSelectedRound(round);
    // Fill with existing results if editing, otherwise empty
    setResultInput({
      result3Top: round.result3Top || "",
      result3Front1: round.result3Front1 || "",
      result3Front2: round.result3Front2 || "",
      result3Back1: round.result3Back1 || "",
      result3Back2: round.result3Back2 || "",
      result2Top: round.result2Top || "",
      result2Bottom: round.result2Bottom || "",
    });
    setIsResultDialogOpen(true);
  };

  const handleSubmitResult = async () => {
    if (!selectedRound || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Submit result to API
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: selectedRound.id,
          threeTop: resultInput.result3Top,
          threeFront1: resultInput.result3Front1,
          threeFront2: resultInput.result3Front2,
          threeBack1: resultInput.result3Back1,
          threeBack2: resultInput.result3Back2,
          twoTop: resultInput.result2Top,
          twoBottom: resultInput.result2Bottom,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
        setIsSubmitting(false);
        return;
      }

      // Auto-create next round if enabled
      if (autoCreateNextRound) {
        const lotteryCode = selectedRound.lotteryCode || selectedRound.lotteryType?.code || "THAI";
        const nextDate = getNextDrawDate(lotteryCode, selectedRound.roundDate);
        const closeTime = getDefaultCloseTime(lotteryCode);
        
        try {
          const createRes = await fetch("/api/rounds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lotteryTypeCode: lotteryCode,
              roundDate: nextDate.toISOString(),
              closeTime: closeTime,
            }),
          });

          if (createRes.ok) {
            const newRound = await createRes.json();
            setLastCreatedRound({
              lotteryType: lotteryCode,
              date: nextDate,
              closeTime: closeTime,
            });
            toast.success(`สร้างงวดถัดไป ${nextDate.toLocaleDateString("th-TH")} สำเร็จ`);
          } else {
            // Round might already exist, that's okay
            const err = await createRes.json();
            if (err.error?.includes("มีงวดนี้อยู่แล้ว") || err.error?.includes("already exists")) {
              // Already exists - don't show error
              setLastCreatedRound(null);
            } else {
              console.log("Create next round response:", err);
            }
          }
        } catch (createError) {
          console.error("Create next round error:", createError);
        }
      }

      // Refresh rounds
      await fetchRounds();
      setIsResultDialogOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error("Submit result error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกผล");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="ออกผลหวย" subtitle="กรอกผลหวยและดูสรุป" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Open Rounds - Horizontal wide cards */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎰</span>
            <h2 className="text-lg font-bold text-slate-100">งวดที่เปิดรับ</h2>
            <Badge variant="outline" className="ml-2 text-emerald-400 border-emerald-500/30">
              {openRounds.length} งวด
            </Badge>
          </div>

          {openRounds.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-slate-400">
                ไม่มีงวดที่เปิดรับอยู่
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {openRounds.map((round) => {
                const lottery =
                  LOTTERY_TYPES[(round.lotteryCode || round.lotteryType?.code || "THAI") as keyof typeof LOTTERY_TYPES];
                return (
                  <Card key={round.id} className="border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        {/* Identity */}
                        <div className="flex items-center gap-2 md:min-w-[190px] md:flex-shrink-0">
                          <span className="text-3xl leading-none">{lottery?.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-slate-100 text-sm">{lottery?.name}</h3>
                              <Badge variant="success" className="text-[9px] px-1.5 py-0 leading-4">เปิดรับ</Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              งวด {round.roundDate.toLocaleDateString("th-TH")}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 md:flex-1 md:pl-3 md:border-l md:border-slate-700/60">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 leading-none mb-0.5">
                              <Wallet className="w-3 h-3" />
                              ยอดรวม
                            </div>
                            <p className="text-base font-bold text-amber-400 leading-tight truncate">
                              ฿{formatNumber(round.totalBets || 0)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 leading-none mb-0.5">
                              <FileText className="w-3 h-3" />
                              จำนวนโพย
                            </div>
                            <p className="text-base font-bold text-slate-100 leading-tight truncate">
                              {formatNumber(round.betCount || 0)} <span className="text-xs font-normal text-slate-400">รายการ</span>
                            </p>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="md:flex-shrink-0">
                          <Button
                            size="sm"
                            className="w-full md:w-auto gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 h-8"
                            onClick={() => handleOpenResultDialog(round)}
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            กรอกผลหวย
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Resulted Rounds - Horizontal wide cards + Month filter */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="text-lg font-bold text-slate-100">งวดที่ออกผลแล้ว</h2>
              <Badge variant="outline" className="ml-2">
                {filteredResultedRounds.length} งวด
              </Badge>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="icon"
                onClick={() => shiftMonth(-1)}
                title="เดือนก่อนหน้า"
                className="h-9 w-9"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-8 h-9 w-[180px]"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => shiftMonth(1)}
                title="เดือนถัดไป"
                className="h-9 w-9"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              {selectedMonth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMonth("")}
                  className="text-slate-400 hover:text-slate-100"
                >
                  ทั้งหมด
                </Button>
              )}
            </div>
          </div>

          {/* Quick month chips */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Button
                variant={selectedMonth === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth("")}
                className="h-7 text-xs"
              >
                ทั้งหมด
              </Button>
              {availableMonths.slice(0, 6).map((ym) => (
                <Button
                  key={ym}
                  variant={selectedMonth === ym ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMonth(ym)}
                  className="h-7 text-xs"
                >
                  {formatMonthLabel(ym)}
                </Button>
              ))}
            </div>
          )}

          {filteredResultedRounds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>
                  {selectedMonth
                    ? `ไม่มีงวดที่ออกผลใน${formatMonthLabel(selectedMonth)}`
                    : "ยังไม่มีงวดที่ออกผล"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredResultedRounds.map((round) => {
                const lottery =
                  LOTTERY_TYPES[(round.lotteryCode || round.lotteryType?.code || "THAI") as keyof typeof LOTTERY_TYPES];
                const profit = round.profit || 0;
                const profitPositive = profit >= 0;
                return (
                  <Card key={round.id} className="hover:border-amber-500/30 transition-colors">
                    <CardContent className="p-2.5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-3">
                        {/* Identity */}
                        <div className="flex items-center gap-2 lg:min-w-[170px] lg:flex-shrink-0">
                          <span className="text-2xl leading-none">{lottery?.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-slate-100 text-sm">{lottery?.name}</h3>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 leading-4">ออกผลแล้ว</Badge>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                              งวด {round.roundDate.toLocaleDateString("th-TH")}
                            </p>
                          </div>
                        </div>

                        {/* Results - main + combined secondary */}
                        <div className="flex flex-wrap items-stretch gap-1.5 lg:flex-1 lg:pl-3 lg:border-l lg:border-slate-700/60">
                          {/* 3 บน */}
                          <div className="text-center px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 min-w-[56px]">
                            <p className="text-[9px] text-slate-400 leading-none">3 บน</p>
                            <p className="text-base font-mono font-bold text-amber-400 tracking-wider leading-tight">
                              {round.result3Top || "-"}
                            </p>
                          </div>
                          {/* 2 บน */}
                          <div className="text-center px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 min-w-[46px]">
                            <p className="text-[9px] text-slate-400 leading-none">2 บน</p>
                            <p className="text-base font-mono font-bold text-amber-400 tracking-wider leading-tight">
                              {round.result2Top || "-"}
                            </p>
                          </div>
                          {/* 2 ล่าง */}
                          <div className="text-center px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 min-w-[46px]">
                            <p className="text-[9px] text-slate-400 leading-none">2 ล่าง</p>
                            <p className="text-base font-mono font-bold text-amber-400 tracking-wider leading-tight">
                              {round.result2Bottom || "-"}
                            </p>
                          </div>

                          {/* Thai-only: combined หน้า 3 + ท้าย 3 (2 numbers per box) */}
                          {(round.lotteryCode || round.lotteryType?.code) === "THAI" && (
                            <>
                              <div className="text-center px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/30">
                                <p className="text-[9px] text-slate-400 leading-none">หน้า 3</p>
                                <p className="text-sm font-mono font-bold text-purple-300 leading-tight tracking-wide whitespace-nowrap">
                                  {round.result3Front1 || "-"} · {round.result3Front2 || "-"}
                                </p>
                              </div>
                              <div className="text-center px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                                <p className="text-[9px] text-slate-400 leading-none">ท้าย 3</p>
                                <p className="text-sm font-mono font-bold text-cyan-300 leading-tight tracking-wide whitespace-nowrap">
                                  {round.result3Back1 || "-"} · {round.result3Back2 || "-"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Money summary */}
                        <div className="grid grid-cols-3 gap-3 lg:min-w-[220px] lg:flex-shrink-0 lg:pl-3 lg:border-l lg:border-slate-700/60">
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 leading-none">ยอดรับ</p>
                            <p className="text-sm font-bold text-slate-100 leading-tight truncate">
                              ฿{formatNumber(round.totalBets || 0)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 leading-none">ยอดจ่าย</p>
                            <p className="text-sm font-bold text-red-400 leading-tight truncate">
                              {round.winAmount ? `-฿${formatNumber(round.winAmount)}` : "฿0"}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 leading-none">กำไร</p>
                            <p className={`text-sm font-bold leading-tight truncate ${profitPositive ? "text-emerald-400" : "text-red-400"}`}>
                              {profitPositive ? "+" : ""}฿{formatNumber(profit)}
                            </p>
                          </div>
                        </div>

                        {/* Actions - icon only */}
                        <div className="flex gap-1 lg:flex-shrink-0 lg:pl-2 lg:border-l lg:border-slate-700/60">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenWinnersDialog(round)}
                            className="h-8 w-8"
                            title="ดูผู้ถูกรางวัล"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenResultDialog(round)}
                            className="text-amber-400 hover:text-amber-300 h-8 w-8"
                            title="แก้ไขผลหวย"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Section summary (when filtered by month) */}
          {filteredResultedRounds.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-400">รวมยอดรับ</p>
                  <p className="text-lg font-bold text-slate-100">
                    ฿{formatNumber(filteredResultedRounds.reduce((s, r) => s + (r.totalBets || 0), 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-400">รวมยอดจ่าย</p>
                  <p className="text-lg font-bold text-red-400">
                    -฿{formatNumber(filteredResultedRounds.reduce((s, r) => s + (r.winAmount || 0), 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-xs text-slate-400">กำไรรวม</p>
                  </div>
                  {(() => {
                    const total = filteredResultedRounds.reduce((s, r) => s + (r.profit || 0), 0);
                    const positive = total >= 0;
                    return (
                      <p className={`text-lg font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                        {positive ? "+" : ""}฿{formatNumber(total)}
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>

      {/* Result Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              กรอกผลหวย
            </DialogTitle>
          </DialogHeader>

          {selectedRound && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <span className="text-3xl">
                  {
                    LOTTERY_TYPES[(selectedRound.lotteryCode || selectedRound.lotteryType?.code || "THAI") as keyof typeof LOTTERY_TYPES]
                      ?.flag
                  }
                </span>
                <div>
                  <h3 className="font-bold text-slate-100">
                    {
                      LOTTERY_TYPES[
                        (selectedRound.lotteryCode || selectedRound.lotteryType?.code || "THAI") as keyof typeof LOTTERY_TYPES
                      ]?.name
                    }
                  </h3>
                  <p className="text-sm text-slate-400">
                    งวด {selectedRound.roundDate.toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* รางวัลที่ 1 (3 ตัวบน) */}
                <div className="space-y-2">
                  <Label>รางวัลที่ 1 (3 ตัวบน)</Label>
                  <Input
                    type="text"
                    placeholder="xxx"
                    maxLength={3}
                    value={resultInput.result3Top}
                    onChange={(e) =>
                      setResultInput({
                        ...resultInput,
                        result3Top: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="text-2xl font-mono text-center tracking-widest"
                  />
                </div>

                {/* เลขหน้า 3 ตัว (2 ช่อง) */}
                <div className="space-y-2">
                  <Label>เลขหน้า 3 ตัว</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="text"
                      placeholder="xxx"
                      maxLength={3}
                      value={resultInput.result3Front1}
                      onChange={(e) =>
                        setResultInput({
                          ...resultInput,
                          result3Front1: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="text-xl font-mono text-center tracking-widest"
                    />
                    <Input
                      type="text"
                      placeholder="xxx"
                      maxLength={3}
                      value={resultInput.result3Front2}
                      onChange={(e) =>
                        setResultInput({
                          ...resultInput,
                          result3Front2: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="text-xl font-mono text-center tracking-widest"
                    />
                  </div>
                </div>

                {/* เลขท้าย 3 ตัว (2 ช่อง) */}
                <div className="space-y-2">
                  <Label>เลขท้าย 3 ตัว</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="text"
                      placeholder="xxx"
                      maxLength={3}
                      value={resultInput.result3Back1}
                      onChange={(e) =>
                        setResultInput({
                          ...resultInput,
                          result3Back1: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="text-xl font-mono text-center tracking-widest"
                    />
                    <Input
                      type="text"
                      placeholder="xxx"
                      maxLength={3}
                      value={resultInput.result3Back2}
                      onChange={(e) =>
                        setResultInput({
                          ...resultInput,
                          result3Back2: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="text-xl font-mono text-center tracking-widest"
                    />
                  </div>
                </div>

                {/* 2 ตัวบน / 2 ตัวล่าง */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>2 ตัวบน</Label>
                    <Input
                      type="text"
                      placeholder="xx"
                      maxLength={2}
                      value={resultInput.result2Top}
                      onChange={(e) =>
                        setResultInput({
                          ...resultInput,
                          result2Top: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="text-xl font-mono text-center tracking-widest"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>2 ตัวล่าง</Label>
                    <Input
                      type="text"
                      placeholder="xx"
                      maxLength={2}
                      value={resultInput.result2Bottom}
                      onChange={(e) =>
                        setResultInput({
                          ...resultInput,
                          result2Bottom: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="text-xl font-mono text-center tracking-widest"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-slate-300">
                  ยอดรับงวดนี้:{" "}
                  <span className="font-bold text-amber-400">
                    ฿{formatNumber(selectedRound.totalBets || 0)}
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  จำนวน {selectedRound.betCount || 0} รายการ
                </p>
              </div>

              {/* Auto-create next round option */}
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <Switch
                    id="autoCreate"
                    checked={autoCreateNextRound}
                    onCheckedChange={setAutoCreateNextRound}
                  />
                  <div className="flex-1">
                    <label htmlFor="autoCreate" className="text-sm font-medium text-emerald-400 cursor-pointer">
                      🔄 เปิดงวดถัดไปอัตโนมัติ
                    </label>
                    <p className="text-xs text-slate-400 mt-1">
                      งวดถัดไป:{" "}
                      <span className="text-emerald-400 font-medium">
                        {getNextDrawDate(selectedRound.lotteryCode || selectedRound.lotteryType?.code || "THAI", selectedRound.roundDate).toLocaleDateString("th-TH")}
                      </span>
                      {" "}ปิดรับ {getDefaultCloseTime(selectedRound.lotteryCode || selectedRound.lotteryType?.code || "THAI")} น.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmitResult}
              disabled={
                isSubmitting ||
                !resultInput.result3Top ||
                !resultInput.result2Top ||
                !resultInput.result2Bottom ||
                resultInput.result3Top.length !== 3 ||
                resultInput.result2Top.length !== 2 ||
                resultInput.result2Bottom.length !== 2
              }
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังคำนวณ...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  คำนวณผล
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <Check className="w-6 h-6" />
              บันทึกผลหวยสำเร็จ!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Result Summary */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">ผลหวยที่บันทึก:</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-slate-500">3 ตัวบน</p>
                  <p className="text-xl font-mono font-bold text-amber-400">
                    {resultInput.result3Top}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">2 ตัวบน</p>
                  <p className="text-xl font-mono font-bold text-amber-400">
                    {resultInput.result2Top}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">2 ตัวล่าง</p>
                  <p className="text-xl font-mono font-bold text-amber-400">
                    {resultInput.result2Bottom}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Round Created */}
            {lastCreatedRound && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  <p className="font-medium text-emerald-400">สร้างงวดถัดไปแล้ว!</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-2xl">
                    {LOTTERY_TYPES[lastCreatedRound.lotteryType as keyof typeof LOTTERY_TYPES]?.flag}
                  </span>
                  <div>
                    <p className="text-slate-100">
                      {LOTTERY_TYPES[lastCreatedRound.lotteryType as keyof typeof LOTTERY_TYPES]?.name}
                    </p>
                    <p className="text-slate-400">
                      งวด {lastCreatedRound.date.toLocaleDateString("th-TH")} • ปิดรับ {lastCreatedRound.closeTime} น.
                    </p>
                  </div>
                  <Badge variant="success" className="ml-auto">เปิดรับแล้ว</Badge>
                </div>
              </div>
            )}

            {!lastCreatedRound && autoCreateNextRound && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400">
                  ℹ️ งวดถัดไปมีอยู่ในระบบแล้ว
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setIsSuccessDialogOpen(false);
              setLastCreatedRound(null);
              setResultInput({ result3Top: "", result3Front1: "", result3Front2: "", result3Back1: "", result3Back2: "", result2Top: "", result2Bottom: "" });
            }}>
              ตกลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Winners Dialog - ดูผู้ถูกรางวัล */}
      <Dialog open={isWinnersDialogOpen} onOpenChange={setIsWinnersDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              รายการผู้ถูกรางวัล
            </DialogTitle>
            <DialogDescription>
              {selectedRound && (
                <span className="flex items-center gap-2">
                  <span className="text-lg">
                    {LOTTERY_TYPES[(selectedRound.lotteryCode || selectedRound.lotteryType?.code || "THAI") as keyof typeof LOTTERY_TYPES]?.flag}
                  </span>
                  {LOTTERY_TYPES[(selectedRound.lotteryCode || selectedRound.lotteryType?.code || "THAI") as keyof typeof LOTTERY_TYPES]?.name}
                  {" - งวด "}
                  {selectedRound.roundDate.toLocaleDateString("th-TH")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRound && (
            <div className="space-y-4">
              {/* Results Display */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="text-center">
                  <p className="text-xs text-slate-400">3 ตัวบน</p>
                  <p className="text-xl font-mono font-bold text-amber-400">{selectedRound.result3Top}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">2 ตัวบน</p>
                  <p className="text-xl font-mono font-bold text-amber-400">{selectedRound.result2Top}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">2 ตัวล่าง</p>
                  <p className="text-xl font-mono font-bold text-amber-400">{selectedRound.result2Bottom}</p>
                </div>
              </div>

              {/* Winners Table */}
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>เลขที่ถูก</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead className="text-right">ยอดแทง</TableHead>
                      <TableHead className="text-right">อัตราจ่าย</TableHead>
                      <TableHead className="text-right">ถูกรางวัล</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getWinners().map((winner) => (
                      <TableRow key={winner.id}>
                        <TableCell>
                          <div>
                            <span className="font-mono text-amber-400">{winner.agent.code}</span>
                            <p className="text-xs text-slate-400">{winner.agent.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xl font-bold text-emerald-400">
                            {winner.number}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {BET_TYPES[winner.betType as keyof typeof BET_TYPES]?.name || winner.betType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{formatNumber(winner.amount)}
                        </TableCell>
                        <TableCell className="text-right text-slate-400">
                          x{formatNumber(winner.payRate)}
                        </TableCell>
                        <TableCell className="text-right text-lg font-bold text-emerald-400">
                          +฿{formatNumber(winner.winAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-300">
                    รวม {getWinners().length} รายการ
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">รวมจ่ายรางวัล</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ฿{formatNumber(getWinners().reduce((sum, w) => sum + w.winAmount, 0))}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWinnersDialogOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

