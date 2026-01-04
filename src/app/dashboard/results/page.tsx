"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Check, Calendar, Trophy, Calculator } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { LOTTERY_TYPES } from "@/lib/constants";

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

export default function ResultsPage() {
  const [selectedRound, setSelectedRound] = useState<typeof demoRounds[0] | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [resultInput, setResultInput] = useState({
    result3Top: "",
    result2Top: "",
    result2Bottom: "",
  });

  const openRounds = demoRounds.filter((r) => r.status === "OPEN");
  const resultedRounds = demoRounds.filter((r) => r.status === "RESULTED");

  const handleOpenResultDialog = (round: typeof demoRounds[0]) => {
    setSelectedRound(round);
    setResultInput({
      result3Top: "",
      result2Top: "",
      result2Bottom: "",
    });
    setIsResultDialogOpen(true);
  };

  const handleSubmitResult = () => {
    // TODO: Submit result to API
    alert(
      `บันทึกผลหวยสำเร็จ!\n3 ตัวบน: ${resultInput.result3Top}\n2 ตัวบน: ${resultInput.result2Top}\n2 ตัวล่าง: ${resultInput.result2Bottom}`
    );
    setIsResultDialogOpen(false);
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
                LOTTERY_TYPES[round.lotteryType as keyof typeof LOTTERY_TYPES];
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
                          ฿{formatNumber(round.totalBets)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">จำนวนโพย</span>
                        <span className="text-slate-100">{round.betCount} รายการ</span>
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
                LOTTERY_TYPES[round.lotteryType as keyof typeof LOTTERY_TYPES];
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
                          ฿{formatNumber(round.totalBets)}
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
                    LOTTERY_TYPES[selectedRound.lotteryType as keyof typeof LOTTERY_TYPES]
                      ?.flag
                  }
                </span>
                <div>
                  <h3 className="font-bold text-slate-100">
                    {
                      LOTTERY_TYPES[
                        selectedRound.lotteryType as keyof typeof LOTTERY_TYPES
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
                    ฿{formatNumber(selectedRound.totalBets)}
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  จำนวน {selectedRound.betCount} รายการ
                </p>
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
    </div>
  );
}

