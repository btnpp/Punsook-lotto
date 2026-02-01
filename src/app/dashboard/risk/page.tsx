"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Ban,
  RefreshCw,
  Calendar,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import { RiskSkeleton } from "@/components/ui/skeleton";
import { LOTTERY_TYPES, BET_TYPES } from "@/lib/constants";

interface RiskNumber {
  number: string;
  betType: string;
  lottery: string;
  totalAmount: number;
  betCount: number;
  potentialPayout: number;
  restriction?: { type: string; value: number | null };
}

interface Round {
  id: string;
  roundDate: string;
  status: string;
  lotteryType: { code: string; name: string };
}

interface RiskData {
  rounds: Round[];
  currentRound: Round | null;
  riskNumbers: RiskNumber[];
  summary: {
    totalBetAmount: number;
    totalPotentialPayout: number;
    totalBets: number;
    uniqueNumbers: number;
  };
}

interface GlobalLimit {
  id: string;
  betType: string;
  limitAmount: number;
  lotteryType: { code: string };
}

interface SettingsData {
  capitalSettings?: { usableCapital: number };
  globalLimits?: GlobalLimit[];
  payRates?: Array<{ betType: string; payRate: number; lotteryType: { code: string } }>;
}

export default function RiskPage() {
  const [selectedLottery, setSelectedLottery] = useState("ALL");
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedBetType, setSelectedBetType] = useState("ALL");
  const [searchNumber, setSearchNumber] = useState("");

  // Build API URL with params
  const buildRiskUrl = () => {
    const params = new URLSearchParams();
    if (selectedLottery !== "ALL") params.append("lotteryType", selectedLottery);
    if (selectedRound) params.append("roundId", selectedRound);
    params.append("includeHistory", "true"); // Always include all rounds
    return `/api/risk?${params.toString()}`;
  };

  // SWR for settings (cached) - includes globalLimits and payRates
  const { data: settingsData } = useSWR<SettingsData>("/api/settings");
  const usableCapital = settingsData?.capitalSettings?.usableCapital || 0;
  const globalLimits = settingsData?.globalLimits || [];
  const payRatesFromSettings = settingsData?.payRates || [];

  // SWR for risk data
  const { data: riskApiData, isLoading, mutate } = useSWR<RiskData>(buildRiskUrl());
  
  const riskNumbers = riskApiData?.riskNumbers || [];
  const rounds = riskApiData?.rounds || [];
  const currentRound = riskApiData?.currentRound || null;
  const apiSummary = riskApiData?.summary || { totalBetAmount: 0, totalPotentialPayout: 0, totalBets: 0, uniqueNumbers: 0 };

  // Auto-select first open round
  useEffect(() => {
    if (!selectedRound && rounds.length > 0) {
      const openRound = rounds.find((r) => r.status === "OPEN");
      if (openRound) {
        setSelectedRound(openRound.id);
      }
    }
  }, [rounds, selectedRound]);

  // Get limit from settings API (ดึงจาก GlobalLimit ใน database)
  const getLimit = (betType: string, lotteryCode?: string) => {
    // Find limit from settings - try specific lottery first, then any
    const limit = globalLimits.find(
      (l) => l.betType === betType && (lotteryCode ? l.lotteryType.code === lotteryCode : true)
    );
    if (limit) return limit.limitAmount;
    
    // Fallback defaults (should not happen if settings are loaded)
    switch (betType) {
      case "THREE_TOP": return 200;
      case "THREE_TOD": return 500;
      case "TWO_TOP": return 5000;
      case "TWO_BOTTOM": return 5000;
      case "RUN_TOP": return 10000;
      case "RUN_BOTTOM": return 10000;
      default: return 5000;
    }
  };

  // Get pay rate from settings API (ดึงจาก PayRate ใน database)
  const getPayRate = (betType: string, lotteryCode?: string) => {
    // Find pay rate from settings
    const rate = payRatesFromSettings.find(
      (r) => r.betType === betType && (lotteryCode ? r.lotteryType.code === lotteryCode : true)
    );
    if (rate) return rate.payRate;
    
    // Fallback defaults
    switch (betType) {
      case "THREE_TOP": return 900;
      case "THREE_TOD": return 150;
      case "TWO_TOP": return 90;
      case "TWO_BOTTOM": return 90;
      case "RUN_TOP": return 3.2;
      case "RUN_BOTTOM": return 4.2;
      default: return 90;
    }
  };

  const riskData = riskNumbers.map((item) => {
    const limit = getLimit(item.betType, item.lottery);
    const percentage = limit > 0 ? Math.round((item.totalAmount / limit) * 100) : 0;
    const payRate = getPayRate(item.betType, item.lottery);
    const potentialPayout = item.potentialPayout || item.totalAmount * payRate;
    const isOverCapital = potentialPayout > usableCapital;
    const excessAmount = isOverCapital ? item.totalAmount - Math.floor(usableCapital / payRate) : 0;
    
    // Determine restriction status
    const restriction = item.restriction;
    let restrictionStatus: "BLOCKED" | "HALF_PAYOUT" | "REDUCED_PAYOUT" | "REDUCED_LIMIT" | null = null;
    if (restriction) {
      const validTypes = ["BLOCKED", "HALF_PAYOUT", "REDUCED_PAYOUT", "REDUCED_LIMIT"];
      if (validTypes.includes(restriction.type)) {
        restrictionStatus = restriction.type as "BLOCKED" | "HALF_PAYOUT" | "REDUCED_PAYOUT" | "REDUCED_LIMIT";
      }
    }
    
    return {
      ...item,
      limit,
      percentage,
      potentialPayout,
      isOverCapital,
      excessAmount,
      safeAmount: Math.floor(usableCapital / payRate),
      restrictionStatus,
      restrictionValue: restriction?.value,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const overLimitCount = riskData.filter((r) => r.percentage >= 100).length;
  const highRiskCount = riskData.filter((r) => r.percentage >= 80 && r.percentage < 100).length;
  const overCapitalCount = riskData.filter((r) => r.isOverCapital).length;
  // Use totalBetAmount from API summary (correctly sums all bets, not aggregated)
  const totalBetAmount = apiSummary.totalBetAmount;
  const worstCasePayout = riskData.length > 0 ? Math.max(...riskData.map((r) => r.potentialPayout)) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="บริหารความเสี่ยง" subtitle="ติดตามและจัดการความเสี่ยงแบบ Real-time" />
        <RiskSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="บริหารความเสี่ยง" subtitle="ติดตามและจัดการความเสี่ยงแบบ Real-time" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Usable Capital Display */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <span className="text-slate-300">ทุนที่ใช้ได้ (จากหน้าตั้งค่า)</span>
          </div>
          <span className="text-2xl font-bold text-emerald-400">
            ฿{formatNumber(usableCapital)}
          </span>
        </div>

        {/* Risk Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Ban className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">เลขถึง Limit</p>
                  <p className="text-2xl font-bold text-red-400">{overLimitCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">เลขเสี่ยงสูง</p>
                  <p className="text-2xl font-bold text-orange-400">{highRiskCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">เกินทุน</p>
                  <p className="text-2xl font-bold text-purple-400">{overCapitalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Worst Case</p>
                  <p className="text-xl font-bold text-amber-400">฿{formatNumber(worstCasePayout)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">💰</span>
              สรุปความเสี่ยง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-400">ยอดรับรวม</p>
                <p className="text-xl font-bold text-slate-100">฿{formatNumber(totalBetAmount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-400">ทุนที่ใช้ได้</p>
                <p className="text-xl font-bold text-emerald-400">฿{formatNumber(usableCapital)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-400">Worst Case (ถ้าเลขอันตรายออก)</p>
                <p className={`text-xl font-bold ${worstCasePayout > totalBetAmount ? "text-red-400" : "text-amber-400"}`}>
                  {worstCasePayout > totalBetAmount ? "-" : "+"}฿{formatNumber(Math.abs(totalBetAmount - worstCasePayout))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-400">Best Case (ไม่มีเลขถูก)</p>
                <p className="text-xl font-bold text-emerald-400">+฿{formatNumber(totalBetAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lottery Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedLottery === "ALL" ? "default" : "outline"}
              onClick={() => { setSelectedLottery("ALL"); setSelectedRound(""); }}
              className="gap-2"
            >
              ทั้งหมด
            </Button>
            {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => (
              <Button
                key={key}
                variant={selectedLottery === key ? "default" : "outline"}
                onClick={() => { setSelectedLottery(key); setSelectedRound(""); }}
                className="gap-2"
              >
                <span>{lottery.flag}</span>
                {lottery.name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-[200px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="เลือกงวด" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    <span className="flex items-center gap-2">
                      <span>{LOTTERY_TYPES[round.lotteryType.code as keyof typeof LOTTERY_TYPES]?.flag}</span>
                      <span className="whitespace-nowrap">
                        {new Date(round.roundDate).toLocaleDateString("th-TH", { 
                          day: "numeric", 
                          month: "short", 
                          year: "2-digit" 
                        })}
                      </span>
                      {round.status === "OPEN" && (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-400/50 text-xs px-1">เปิด</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={() => mutate()}>
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Bet Type Filter */}
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={selectedBetType === "ALL" ? "default" : "outline"}
            onClick={() => setSelectedBetType("ALL")}
            className="h-7 px-3 text-xs"
          >
            ทั้งหมด ({riskData.length})
          </Button>
          <Button
            size="sm"
            variant={selectedBetType === "THREE_TOP" ? "default" : "outline"}
            onClick={() => setSelectedBetType("THREE_TOP")}
            className="h-7 px-3 text-xs"
          >
            3บน ({riskData.filter(r => r.betType === "THREE_TOP").length})
          </Button>
          <Button
            size="sm"
            variant={selectedBetType === "THREE_TOD" ? "default" : "outline"}
            onClick={() => setSelectedBetType("THREE_TOD")}
            className="h-7 px-3 text-xs"
          >
            3โต๊ด ({riskData.filter(r => r.betType === "THREE_TOD").length})
          </Button>
          <Button
            size="sm"
            variant={selectedBetType === "TWO_TOP" ? "default" : "outline"}
            onClick={() => setSelectedBetType("TWO_TOP")}
            className="h-7 px-3 text-xs"
          >
            2บน ({riskData.filter(r => r.betType === "TWO_TOP").length})
          </Button>
          <Button
            size="sm"
            variant={selectedBetType === "TWO_BOTTOM" ? "default" : "outline"}
            onClick={() => setSelectedBetType("TWO_BOTTOM")}
            className="h-7 px-3 text-xs"
          >
            2ล่าง ({riskData.filter(r => r.betType === "TWO_BOTTOM").length})
          </Button>
          <Button
            size="sm"
            variant={selectedBetType === "RUN_TOP" ? "default" : "outline"}
            onClick={() => setSelectedBetType("RUN_TOP")}
            className="h-7 px-3 text-xs"
          >
            วิ่งบน ({riskData.filter(r => r.betType === "RUN_TOP").length})
          </Button>
          <Button
            size="sm"
            variant={selectedBetType === "RUN_BOTTOM" ? "default" : "outline"}
            onClick={() => setSelectedBetType("RUN_BOTTOM")}
            className="h-7 px-3 text-xs"
          >
            วิ่งล่าง ({riskData.filter(r => r.betType === "RUN_BOTTOM").length})
          </Button>
          
          {/* Search Input */}
          <div className="ml-auto flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="ค้นหาเลข..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ""))}
              className="w-32 h-7 text-sm"
              maxLength={3}
            />
            {searchNumber && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchNumber("")}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Current Round Info */}
        {currentRound && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/30">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{LOTTERY_TYPES[currentRound.lotteryType.code as keyof typeof LOTTERY_TYPES]?.flag}</span>
                <div>
                  <p className="font-bold text-amber-400">
                    {currentRound.lotteryType.name} งวดวันที่{" "}
                    {new Date(currentRound.roundDate).toLocaleDateString("th-TH", { 
                      day: "numeric", 
                      month: "long", 
                      year: "numeric" 
                    })}
                  </p>
                  <p className="text-sm text-slate-400">
                    สถานะ:{" "}
                    {currentRound.status === "OPEN" && <span className="text-emerald-400">เปิดรับแทง</span>}
                    {currentRound.status === "CLOSED" && <span className="text-amber-400">ปิดรับแทง</span>}
                    {currentRound.status === "RESULTED" && <span className="text-slate-400">ออกผลแล้ว</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Table */}
        <Card>
          <CardHeader>
            <CardTitle>📊 ตารางความเสี่ยง</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลข</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead>% ใช้ไป</TableHead>
                  <TableHead className="text-right">ถ้าออกต้องจ่าย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">ต้องตีออก</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskData
                  .filter((item) => {
                    // Filter by bet type
                    if (selectedBetType !== "ALL" && item.betType !== selectedBetType) return false;
                    // Filter by search number
                    if (searchNumber && !item.number.includes(searchNumber)) return false;
                    return true;
                  })
                  .map((item, index) => (
                  <TableRow key={index} className="table-row-hover">
                    <TableCell>
                      <span className="text-2xl font-mono font-bold text-amber-400">
                        {item.number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {BET_TYPES[item.betType as keyof typeof BET_TYPES]?.shortName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{formatNumber(item.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right text-slate-400">
                      ฿{formatNumber(item.limit)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.percentage >= 100
                                ? "bg-red-500"
                                : item.percentage >= 80
                                ? "bg-orange-500"
                                : item.percentage >= 60
                                ? "bg-yellow-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            item.percentage >= 100
                              ? "text-red-400"
                              : item.percentage >= 80
                              ? "text-orange-400"
                              : item.percentage >= 60
                              ? "text-yellow-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          item.isOverCapital ? "text-red-400 font-bold" : "text-slate-100"
                        }
                      >
                        ฿{formatNumber(item.potentialPayout)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Restriction status */}
                        {item.restrictionStatus === "BLOCKED" ? (
                          <Badge variant="destructive">ปิดรับ</Badge>
                        ) : item.restrictionStatus === "HALF_PAYOUT" ? (
                          <Badge className="bg-purple-600">จ่ายครึ่ง</Badge>
                        ) : item.restrictionStatus === "REDUCED_PAYOUT" ? (
                          <Badge className="bg-purple-600">จ่าย×{item.restrictionValue}</Badge>
                        ) : item.restrictionStatus === "REDUCED_LIMIT" ? (
                          <Badge className="bg-blue-600">Limit {item.restrictionValue}</Badge>
                        ) : null}
                        
                        {/* Regular status */}
                        {item.percentage >= 100 ? (
                          <Badge variant="destructive">เต็ม</Badge>
                        ) : item.isOverCapital ? (
                          <Badge variant="warning">เกินทุน</Badge>
                        ) : item.percentage >= 80 ? (
                          <Badge variant="warning">ใกล้เต็ม</Badge>
                        ) : !item.restrictionStatus ? (
                          <Badge variant="success">ปกติ</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.excessAmount > 0 ? (
                        <span className="text-red-400 font-bold">
                          ฿{formatNumber(item.excessAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>💰 สรุปความเสี่ยง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">ยอดรับรวม</span>
                <span className="font-bold text-slate-100">฿{formatNumber(totalBetAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">ทุนที่ใช้ได้</span>
                <span className="font-bold text-emerald-400">฿{formatNumber(usableCapital)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">Worst Case (ถ้าเลขอันตรายออก)</span>
                <span className="font-bold text-red-400">-฿{formatNumber(worstCasePayout)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Best Case (ไม่มีเลขถูก)</span>
                <span className="font-bold text-emerald-400">+฿{formatNumber(totalBetAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚠️ เลขต้องตีออก</CardTitle>
            </CardHeader>
            <CardContent>
              {riskData.filter((r) => r.excessAmount > 0).length === 0 ? (
                <div className="text-center py-8 text-emerald-400">
                  <Shield className="w-12 h-12 mx-auto mb-3" />
                  <p>ไม่มีเลขที่ต้องตีออก</p>
                  <p className="text-sm text-slate-400 mt-1">ความเสี่ยงอยู่ในเกณฑ์ปลอดภัย</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {riskData
                    .filter((r) => r.excessAmount > 0)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-mono font-bold text-amber-400">
                            {item.number}
                          </span>
                          <Badge variant="secondary">
                            {BET_TYPES[item.betType as keyof typeof BET_TYPES]?.shortName}
                          </Badge>
                        </div>
                        <span className="text-red-400 font-bold">
                          ฿{formatNumber(item.excessAmount)}
                        </span>
                      </div>
                    ))}
                  <Button variant="destructive" className="w-full mt-4">
                    สร้างรายการตีออก
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

