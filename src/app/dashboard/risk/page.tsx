"use client";

import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Ban,
  Settings,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { formatNumber, formatCurrency, getRiskLevelColor } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES, RISK_MODES } from "@/lib/constants";

interface RiskNumber {
  number: string;
  betType: string;
  lottery: string;
  totalAmount: number;
  betCount: number;
  potentialPayout: number;
}

export default function RiskPage() {
  const [riskNumbers, setRiskNumbers] = useState<RiskNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLottery, setSelectedLottery] = useState("THAI");
  const [capital, setCapital] = useState(1000000);
  const [riskMode, setRiskMode] = useState("BALANCED");
  const [customPercentage, setCustomPercentage] = useState(75);

  useEffect(() => {
    fetchRiskData();
  }, [selectedLottery]);

  const fetchRiskData = async () => {
    try {
      const res = await fetch(`/api/risk?lotteryType=${selectedLottery}`);
      if (res.ok) {
        const data = await res.json();
        setRiskNumbers(data.riskNumbers || []);
      }
    } catch (error) {
      console.error("Fetch risk error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const riskPercentage = riskMode === "CUSTOM" 
    ? customPercentage 
    : RISK_MODES[riskMode as keyof typeof RISK_MODES]?.percentage || 75;
  
  const usableCapital = capital * (riskPercentage / 100);

  // Calculate risk for each number  
  const getLimit = (betType: string) => {
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

  const getPayRate = (betType: string) => {
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
    const limit = getLimit(item.betType);
    const percentage = Math.round((item.totalAmount / limit) * 100);
    const payRate = getPayRate(item.betType);
    const potentialPayout = item.potentialPayout || item.totalAmount * payRate;
    const isOverCapital = potentialPayout > usableCapital;
    const excessAmount = isOverCapital ? item.totalAmount - Math.floor(usableCapital / payRate) : 0;
    
    return {
      ...item,
      limit,
      percentage,
      potentialPayout,
      isOverCapital,
      excessAmount,
      safeAmount: Math.floor(usableCapital / payRate),
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const overLimitCount = riskData.filter((r) => r.percentage >= 100).length;
  const highRiskCount = riskData.filter((r) => r.percentage >= 80 && r.percentage < 100).length;
  const overCapitalCount = riskData.filter((r) => r.isOverCapital).length;
  const totalBetAmount = riskData.reduce((sum, r) => sum + r.totalAmount, 0);
  const worstCasePayout = riskData.length > 0 ? Math.max(...riskData.map((r) => r.potentialPayout)) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="บริหารความเสี่ยง" subtitle="ติดตามและจัดการความเสี่ยงแบบ Real-time" />

      <div className="p-6 space-y-6">
        {/* Capital Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              ตั้งค่าทุน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>ทุนทั้งหมด</Label>
                <Input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(parseInt(e.target.value) || 0)}
                  className="text-lg font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>โหมดความเสี่ยง</Label>
                <Select value={riskMode} onValueChange={setRiskMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RISK_MODES).map(([key, mode]) => (
                      <SelectItem key={key} value={key}>
                        {mode.name} ({mode.percentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {riskMode === "CUSTOM" && (
                <div className="space-y-2">
                  <Label>% ที่ใช้</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={customPercentage}
                    onChange={(e) => setCustomPercentage(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>ทุนที่ใช้ได้</Label>
                <div className="h-11 flex items-center px-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <span className="text-lg font-bold text-emerald-400">
                    ฿{formatNumber(usableCapital)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Lottery Selector */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => (
              <Button
                key={key}
                variant={selectedLottery === key ? "default" : "outline"}
                onClick={() => setSelectedLottery(key)}
                className="gap-2"
              >
                <span>{lottery.flag}</span>
                {lottery.name}
              </Button>
            ))}
          </div>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </Button>
        </div>

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
                {riskData.map((item, index) => (
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
                      {item.percentage >= 100 ? (
                        <Badge variant="destructive">เต็ม</Badge>
                      ) : item.isOverCapital ? (
                        <Badge variant="warning">เกินทุน</Badge>
                      ) : item.percentage >= 80 ? (
                        <Badge variant="warning">ใกล้เต็ม</Badge>
                      ) : (
                        <Badge variant="success">ปกติ</Badge>
                      )}
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

