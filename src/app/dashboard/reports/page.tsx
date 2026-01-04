"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Download,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { LOTTERY_TYPES } from "@/lib/constants";

// Demo data สำหรับรายงานการเงิน
const financialSummary = {
  today: {
    totalBets: 458000,
    totalPayout: 125000,
    profit: 333000,
    profitPct: 72.7,
  },
  thisWeek: {
    totalBets: 2850000,
    totalPayout: 850000,
    profit: 2000000,
    profitPct: 70.2,
  },
  thisMonth: {
    totalBets: 12500000,
    totalPayout: 3750000,
    profit: 8750000,
    profitPct: 70.0,
  },
};

const agentSummary = [
  { 
    code: "A001", 
    name: "นายสมชาย ใจดี", 
    totalBets: 285000, 
    payout: 85000, 
    profit: 200000, 
    commission: 42750,
    balance: 157250
  },
  { 
    code: "A002", 
    name: "นายวิชัย รวยมาก", 
    totalBets: 458000, 
    payout: 185000, 
    profit: 273000, 
    commission: 91600,
    balance: 181400
  },
  { 
    code: "A003", 
    name: "นายประสิทธิ์ ดีเลิศ", 
    totalBets: 125000, 
    payout: 45000, 
    profit: 80000, 
    commission: 22500,
    balance: 57500
  },
];

const lotterySummary = [
  { 
    type: "THAI", 
    name: "หวยไทย", 
    flag: "🇹🇭",
    totalBets: 5800000, 
    payout: 1750000, 
    profit: 4050000,
    rounds: 2
  },
  { 
    type: "LAO", 
    name: "หวยลาว", 
    flag: "🇱🇦",
    totalBets: 4200000, 
    payout: 1250000, 
    profit: 2950000,
    rounds: 12
  },
  { 
    type: "HANOI", 
    name: "หวยฮานอย", 
    flag: "🇻🇳",
    totalBets: 2500000, 
    payout: 750000, 
    profit: 1750000,
    rounds: 30
  },
];

const recentTransactions = [
  { id: 1, date: "2024-01-15", type: "BET", agent: "A001", amount: 15000, description: "โพย #1234" },
  { id: 2, date: "2024-01-15", type: "PAYOUT", agent: "A002", amount: -45000, description: "จ่ายรางวัล งวด 16/1/67" },
  { id: 3, date: "2024-01-15", type: "BET", agent: "A002", amount: 28000, description: "โพย #1235" },
  { id: 4, date: "2024-01-14", type: "BET", agent: "A003", amount: 12000, description: "โพย #1233" },
  { id: 5, date: "2024-01-14", type: "COMMISSION", agent: "A001", amount: -4500, description: "ค่าคอมมิชชั่น" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("thisMonth");
  const [selectedLottery, setSelectedLottery] = useState("ALL");

  const currentSummary = financialSummary[period as keyof typeof financialSummary];

  return (
    <div className="min-h-screen">
      <Header title="รายงานการเงิน" subtitle="สรุปยอดรวมและรายงานทางการเงิน" />

      <div className="p-6 space-y-6">
        {/* Period Selector */}
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant={period === "today" ? "default" : "outline"}
              onClick={() => setPeriod("today")}
            >
              วันนี้
            </Button>
            <Button 
              variant={period === "thisWeek" ? "default" : "outline"}
              onClick={() => setPeriod("thisWeek")}
            >
              สัปดาห์นี้
            </Button>
            <Button 
              variant={period === "thisMonth" ? "default" : "outline"}
              onClick={() => setPeriod("thisMonth")}
            >
              เดือนนี้
            </Button>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">ยอดแทงรวม</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ฿{formatNumber(currentSummary.totalBets)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">จ่ายรางวัล</p>
                  <p className="text-2xl font-bold text-red-400">
                    ฿{formatNumber(currentSummary.totalPayout)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/20">
                  <TrendingDown className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">กำไรสุทธิ</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ฿{formatNumber(currentSummary.profit)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">% กำไร</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {currentSummary.profitPct}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <PieChart className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="byAgent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="byAgent">ตาม Agent</TabsTrigger>
            <TabsTrigger value="byLottery">ตามประเภทหวย</TabsTrigger>
            <TabsTrigger value="transactions">รายการล่าสุด</TabsTrigger>
          </TabsList>

          {/* By Agent */}
          <TabsContent value="byAgent">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  สรุปตาม Agent
                </CardTitle>
                <CardDescription>รายงานยอดแทงและกำไรแยกตาม Agent</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัส</TableHead>
                      <TableHead>ชื่อ</TableHead>
                      <TableHead className="text-right">ยอดแทง</TableHead>
                      <TableHead className="text-right">จ่ายรางวัล</TableHead>
                      <TableHead className="text-right">กำไร</TableHead>
                      <TableHead className="text-right">ค่าคอมฯ</TableHead>
                      <TableHead className="text-right">คงเหลือ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentSummary.map((agent) => (
                      <TableRow key={agent.code}>
                        <TableCell>
                          <span className="font-mono font-bold text-amber-400">{agent.code}</span>
                        </TableCell>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="text-right">฿{formatNumber(agent.totalBets)}</TableCell>
                        <TableCell className="text-right text-red-400">
                          -฿{formatNumber(agent.payout)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400">
                          ฿{formatNumber(agent.profit)}
                        </TableCell>
                        <TableCell className="text-right text-slate-400">
                          -฿{formatNumber(agent.commission)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-400">
                          ฿{formatNumber(agent.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="bg-slate-800/50 font-bold">
                      <TableCell colSpan={2}>รวมทั้งหมด</TableCell>
                      <TableCell className="text-right">
                        ฿{formatNumber(agentSummary.reduce((sum, a) => sum + a.totalBets, 0))}
                      </TableCell>
                      <TableCell className="text-right text-red-400">
                        -฿{formatNumber(agentSummary.reduce((sum, a) => sum + a.payout, 0))}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400">
                        ฿{formatNumber(agentSummary.reduce((sum, a) => sum + a.profit, 0))}
                      </TableCell>
                      <TableCell className="text-right text-slate-400">
                        -฿{formatNumber(agentSummary.reduce((sum, a) => sum + a.commission, 0))}
                      </TableCell>
                      <TableCell className="text-right text-amber-400">
                        ฿{formatNumber(agentSummary.reduce((sum, a) => sum + a.balance, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Lottery */}
          <TabsContent value="byLottery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  สรุปตามประเภทหวย
                </CardTitle>
                <CardDescription>รายงานยอดแทงและกำไรแยกตามประเภทหวย</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {lotterySummary.map((lottery) => (
                    <Card key={lottery.type} className="bg-slate-800/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{lottery.flag}</span>
                          <span className="font-bold">{lottery.name}</span>
                          <Badge variant="secondary">{lottery.rounds} งวด</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">ยอดแทง</span>
                            <span className="font-medium">฿{formatNumber(lottery.totalBets)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">จ่ายรางวัล</span>
                            <span className="text-red-400">-฿{formatNumber(lottery.payout)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-700 pt-2">
                            <span className="text-slate-400">กำไร</span>
                            <span className="text-emerald-400 font-bold">฿{formatNumber(lottery.profit)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ประเภท</TableHead>
                      <TableHead className="text-right">จำนวนงวด</TableHead>
                      <TableHead className="text-right">ยอดแทง</TableHead>
                      <TableHead className="text-right">จ่ายรางวัล</TableHead>
                      <TableHead className="text-right">กำไร</TableHead>
                      <TableHead className="text-right">% กำไร</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotterySummary.map((lottery) => (
                      <TableRow key={lottery.type}>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{lottery.flag}</span>
                            <span className="font-medium">{lottery.name}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{lottery.rounds}</TableCell>
                        <TableCell className="text-right">฿{formatNumber(lottery.totalBets)}</TableCell>
                        <TableCell className="text-right text-red-400">
                          -฿{formatNumber(lottery.payout)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400">
                          ฿{formatNumber(lottery.profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default">
                            {((lottery.profit / lottery.totalBets) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  รายการล่าสุด
                </CardTitle>
                <CardDescription>รายการรับ-จ่ายล่าสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-slate-400">{tx.date}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={tx.type === "BET" ? "default" : tx.type === "PAYOUT" ? "destructive" : "secondary"}
                          >
                            {tx.type === "BET" ? "รับแทง" : tx.type === "PAYOUT" ? "จ่ายรางวัล" : "ค่าคอมฯ"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-amber-400">{tx.agent}</span>
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell className={`text-right font-medium ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {tx.amount >= 0 ? "+" : ""}฿{formatNumber(Math.abs(tx.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

