"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Check, Calendar, Trophy, Calculator, Plus, ArrowRight, Eye, Users, Loader2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
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
    result2Top: "",
    result2Bottom: "",
  });

  useEffect(() => {
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    try {
      const res = await fetch("/api/results");
      if (res.ok) {
        const data = await res.json();
        setRounds(data.rounds.map((r: Round & { roundDate: string }) => ({
          ...r,
          roundDate: new Date(r.roundDate),
          lotteryCode: r.lotteryType.code,
          lotteryName: r.lotteryType.name,
        })));
      }
    } catch (error) {
      console.error("Fetch rounds error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleOpenResultDialog = (round: Round) => {
    setSelectedRound(round);
    setResultInput({
      result3Top: "",
      result2Top: "",
      result2Bottom: "",
    });
    setIsResultDialogOpen(true);
  };

  const handleSubmitResult = async () => {
    if (!selectedRound) return;

    try {
      // Submit result to API
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: selectedRound.id,
          threeTop: resultInput.result3Top,
          twoTop: resultInput.result2Top,
          twoBottom: resultInput.result2Bottom,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
        return;
      }

      // Refresh rounds
      await fetchRounds();
      setIsResultDialogOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error("Submit result error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกผล");
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="ออกผลหวย" subtitle="กรอกผลหวยและดูสรุป" />

      <div className="p-6 space-y-6">
        {/* Open Rounds */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 mb-4">🎰 งวดที่เปิดรับ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {openRounds.map((round) => {
              const lottery =
                LOTTERY_TYPES[(round.lotteryCode || round.lotteryType?.code || "THAI") as keyof typeof LOTTERY_TYPES];
              return (
                <Card key={round.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{lottery?.flag}</span>
                      <div>
                        <h3 className="font-bold text-slate-100">{lottery?.name}</h3>
                        <p className="text-sm text-slate-400">
                          งวด {round.roundDate.toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">ยอดรวม</span>
                        <span className="font-bold text-amber-400">
                          ฿{formatNumber(round.totalBets || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">จำนวนโพย</span>
                        <span className="text-slate-100">{round.betCount || 0} รายการ</span>
                      </div>
                    </div>

                    <Badge variant="success" className="w-full justify-center mb-4">
                      เปิดรับ
                    </Badge>

                    <Button
                      className="w-full gap-2"
                      onClick={() => handleOpenResultDialog(round)}
                    >
                      <Trophy className="w-4 h-4" />
                      กรอกผลหวย
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Resulted Rounds */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 mb-4">
            📊 งวดที่ออกผลแล้ว
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultedRounds.map((round) => {
              const lottery =
                LOTTERY_TYPES[(round.lotteryCode || round.lotteryType?.code || "THAI") as keyof typeof LOTTERY_TYPES];
              return (
                <Card key={round.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{lottery?.flag}</span>
                        <div>
                          <h3 className="font-bold text-slate-100">{lottery?.name}</h3>
                          <p className="text-sm text-slate-400">
                            งวด {round.roundDate.toLocaleDateString("th-TH")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">ออกผลแล้ว</Badge>
                    </div>

                    {/* Results Display */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-400 mb-1">3 ตัวบน</p>
                        <p className="text-2xl font-mono font-bold text-amber-400">
                          {round.result3Top}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-400 mb-1">2 ตัวบน</p>
                        <p className="text-2xl font-mono font-bold text-amber-400">
                          {round.result2Top}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-400 mb-1">2 ตัวล่าง</p>
                        <p className="text-2xl font-mono font-bold text-amber-400">
                          {round.result2Bottom}
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-2 border-t border-slate-700 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">ยอดรับ</span>
                        <span className="text-slate-100">
                          ฿{formatNumber(round.totalBets || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">ยอดจ่าย</span>
                        <span className="text-red-400">
                          -฿{formatNumber(round.winAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2">
                        <span className="text-slate-100">กำไร</span>
                        <span
                          className={
                            (round.profit || 0) >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {(round.profit || 0) >= 0 ? "+" : ""}฿
                          {formatNumber(round.profit || 0)}
                        </span>
                      </div>
                    </div>

                    {/* View Winners Button */}
                    {round.status === "CLOSED" && (
                      <Button
                        variant="outline"
                        className="w-full mt-4 gap-2"
                        onClick={() => handleOpenWinnersDialog(round)}
                      >
                        <Users className="w-4 h-4" />
                        ดูผู้ถูกรางวัล
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
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
                    className="text-3xl font-mono text-center tracking-widest"
                  />
                </div>

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
                      className="text-2xl font-mono text-center tracking-widest"
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
                      className="text-2xl font-mono text-center tracking-widest"
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
                  <Checkbox
                    id="autoCreate"
                    checked={autoCreateNextRound}
                    onCheckedChange={(checked) => setAutoCreateNextRound(checked as boolean)}
                    className="mt-0.5"
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
                !resultInput.result3Top ||
                !resultInput.result2Top ||
                !resultInput.result2Bottom ||
                resultInput.result3Top.length !== 3 ||
                resultInput.result2Top.length !== 2 ||
                resultInput.result2Bottom.length !== 2
              }
              className="gap-2"
            >
              <Calculator className="w-4 h-4" />
              คำนวณผล
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
              setResultInput({ result3Top: "", result2Top: "", result2Bottom: "" });
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

