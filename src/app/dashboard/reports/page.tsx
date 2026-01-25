"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowDownRight,
  Wallet,
  Receipt,
  History,
  Eye,
  Loader2
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { LOTTERY_TYPES } from "@/lib/constants";

// Payment history type
interface Payment {
  id: string;
  agentCode: string;
  type: "RECEIVE" | "PAY";
  amount: number;
  note: string;
  date: Date;
}

// Demo payment history
const demoPayments: Payment[] = [
  { id: "p1", agentCode: "A001", type: "RECEIVE", amount: 50000, note: "ชำระยอดค้าง", date: new Date("2026-01-08") },
  { id: "p2", agentCode: "A001", type: "PAY", amount: 15000, note: "จ่ายรางวัลงวด 1/1/69", date: new Date("2026-01-02") },
  { id: "p3", agentCode: "A002", type: "PAY", amount: 25000, note: "จ่ายรางวัลงวด 1/1/69", date: new Date("2026-01-02") },
  { id: "p4", agentCode: "A003", type: "RECEIVE", amount: 30000, note: "ชำระยอดค้าง", date: new Date("2026-01-05") },
];

// Default empty data (will be replaced by API data)
const financialSummary = {
  today: {
    totalBets: 0,
    discount: 0,
    netAmount: 0,
    totalPayout: 0,
    profit: 0,
    profitPct: 0,
  },
  thisWeek: {
    totalBets: 0,
    discount: 0,
    netAmount: 0,
    totalPayout: 0,
    profit: 0,
    profitPct: 0,
  },
  thisMonth: {
    totalBets: 0,
    discount: 0,
    netAmount: 0,
    totalPayout: 0,
    profit: 0,
    profitPct: 0,
  },
};

// Will be populated from API
const agentSummary: Array<{
  code: string;
  name: string;
  phone?: string;
  discountPct?: number;
  totalBets: number;
  discount: number;
  netAmount: number;
  payout: number;
  profit: number;
  balance: number;
}> = [];

// Will be populated from API  
const lotterySummary: Array<{
  type: string;
  name: string;
  flag: string;
  discountPct?: number;
  totalBets: number;
  discount: number;
  netAmount: number;
  payout: number;
  profit: number;
  rounds?: number;
}> = [];

// Will be populated from API
const recentTransactions: Array<{
  id: number;
  date: string;
  type: string;
  agent: string;
  amount: number;
  description: string;
}> = [];

// Will be populated from API
const roundSummary: Array<{
  id: string;
  roundDate: Date;
  lottery: string;
  lotteryName: string;
  flag: string;
  status: string;
  totalSlips: number;
  totalBets: number;
  discountPct: number;
  discountAmount: number;
  netAmount: number;
  payout: number;
  profit: number;
  result: { top3: string; top2: string; bottom2: string } | null;
}> = [];

interface ReportSummary {
  totalBets: number;
  totalAmount?: number;
  totalDiscount?: number;
  totalNetAmount?: number;
  totalWinAmount?: number;
  totalProfit?: number;
  discount?: number;
  netAmount?: number;
  totalPayout?: number;
  profit?: number;
  profitPct?: number;
}

interface AgentReport {
  agentId: string;
  agentCode: string;
  agentName: string;
  totalBets: number;
  totalAmount: number;
  totalDiscount: number;
  totalNetAmount: number;
  totalWinAmount: number;
  profit: number;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("thisMonth");
  const [selectedLottery, setSelectedLottery] = useState("ALL");
  const [reportData, setReportData] = useState<{
    summary: ReportSummary;
    byAgent: AgentReport[];
    byLottery: Array<{ lotteryCode: string; lotteryName: string; totalBets: number; totalAmount: number; totalNetAmount: number; totalWinAmount: number; profit: number }>;
    byDate: Array<{ date: string; totalBets: number; totalAmount: number; totalNetAmount: number; totalWinAmount: number; profit: number }>;
  } | null>(null);
  const [agents, setAgents] = useState<typeof agentSummary>([]);
  const [payments, setPayments] = useState(demoPayments);
  const [selectedAgent, setSelectedAgent] = useState<typeof agentSummary[0] | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    type: "RECEIVE" as "RECEIVE" | "PAY",
    amount: 0,
    note: "",
  });

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "thisWeek":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case "thisMonth":
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const res = await fetch(`/api/reports?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        // Update agents with report data
        if (data.byAgent) {
          setAgents(data.byAgent.map((a: AgentReport) => ({
            code: a.agentCode,
            name: a.agentName,
            totalBets: a.totalAmount,
            discount: a.totalDiscount,
            netAmount: a.totalNetAmount,
            payout: a.totalWinAmount,
            balance: a.profit,
          })));
        }
      }
    } catch (error) {
      console.error("Fetch reports error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // เปิด Payment Dialog
  const handleOpenPaymentDialog = (agent: typeof agentSummary[0]) => {
    setSelectedAgent(agent);
    setPaymentFormData({
      type: agent.balance >= 0 ? "RECEIVE" : "PAY",
      amount: Math.abs(agent.balance),
      note: "",
    });
    setIsPaymentDialogOpen(true);
  };

  // บันทึกการชำระเงิน
  const handleSavePayment = () => {
    if (!selectedAgent || paymentFormData.amount <= 0) return;

    const newPayment: Payment = {
      id: `p${Date.now()}`,
      agentCode: selectedAgent.code,
      type: paymentFormData.type,
      amount: paymentFormData.amount,
      note: paymentFormData.note || (paymentFormData.type === "RECEIVE" ? "รับชำระยอด" : "จ่ายเงิน"),
      date: new Date(),
    };
    setPayments([newPayment, ...payments]);

    const balanceChange = paymentFormData.type === "RECEIVE" 
      ? -paymentFormData.amount 
      : paymentFormData.amount;

    setAgents(
      agents.map((a) =>
        a.code === selectedAgent.code
          ? { ...a, balance: a.balance + balanceChange }
          : a
      )
    );

    setIsPaymentDialogOpen(false);
  };

  // เปิด Detail Dialog
  const handleOpenDetailDialog = (agent: typeof agentSummary[0]) => {
    setSelectedAgent(agent);
    setIsDetailDialogOpen(true);
  };

  // ดึงประวัติการชำระของ Agent
  const getAgentPayments = (agentCode: string) => {
    return payments.filter((p) => p.agentCode === agentCode);
  };

  // คำนวณยอดคงค้างรวม
  const totalBalance = agents.reduce((sum, a) => sum + a.balance, 0);

  const fallbackSummary = financialSummary[period as keyof typeof financialSummary];
  const apiSummary = reportData?.summary;
  
  const currentSummary = {
    totalBets: apiSummary?.totalAmount || fallbackSummary.totalBets,
    discount: apiSummary?.totalDiscount || fallbackSummary.discount,
    netAmount: apiSummary?.totalNetAmount || fallbackSummary.netAmount,
    totalPayout: apiSummary?.totalWinAmount || fallbackSummary.totalPayout,
    profit: apiSummary?.totalProfit || fallbackSummary.profit,
    profitPct: apiSummary?.totalProfit && apiSummary?.totalNetAmount 
      ? Math.round((apiSummary.totalProfit / apiSummary.totalNetAmount) * 1000) / 10 
      : fallbackSummary.profitPct,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">ยอดแทงรวม</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ฿{formatNumber(currentSummary.totalBets)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">ส่วนลด</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ฿{formatNumber(currentSummary.discount)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <TrendingDown className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">จ่ายรางวัล</p>
                  <p className="text-2xl font-bold text-red-400">
                    ฿{formatNumber(currentSummary.totalPayout)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/20">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">กำไรสุทธิ</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ฿{formatNumber(currentSummary.profit)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">% กำไร</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {currentSummary.profitPct}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <PieChart className="w-5 h-5 text-amber-400" />
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
            <TabsTrigger value="byRound">ตามงวด</TabsTrigger>
            <TabsTrigger value="transactions">รายการล่าสุด</TabsTrigger>
          </TabsList>

          {/* By Agent */}
          <TabsContent value="byAgent">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
                <CardContent className="p-4">
                  <p className="text-sm text-slate-400">ยอดแทงรวม</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ฿{formatNumber(agents.reduce((sum, a) => sum + a.totalBets, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
                <CardContent className="p-4">
                  <p className="text-sm text-slate-400">กำไรรวม</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ฿{formatNumber(agents.reduce((sum, a) => sum + a.profit, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className={`bg-gradient-to-br ${totalBalance >= 0 ? "from-amber-500/10 to-amber-600/5 border-amber-500/30" : "from-red-500/10 to-red-600/5 border-red-500/30"}`}>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-400">ยอดคงค้างรวม</p>
                  <p className={`text-2xl font-bold ${totalBalance >= 0 ? "text-amber-400" : "text-red-400"}`}>
                    ฿{formatNumber(totalBalance)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {totalBalance >= 0 ? "Agent ค้างจ่ายเรา" : "เราค้างจ่าย Agent"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  สรุปตาม Agent
                </CardTitle>
                <CardDescription>รายงานยอดแทง กำไร และยอดคงค้างแยกตาม Agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัส</TableHead>
                        <TableHead>ชื่อ</TableHead>
                        <TableHead className="text-right">ยอดแทง</TableHead>
                        <TableHead className="text-center">ส่วนลด</TableHead>
                        <TableHead className="text-right">ยอดสุทธิ</TableHead>
                        <TableHead className="text-right">จ่ายรางวัล</TableHead>
                        <TableHead className="text-right">กำไร</TableHead>
                        <TableHead className="text-right">ยอดคงค้าง</TableHead>
                        <TableHead className="text-center">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map((agent) => (
                        <TableRow key={agent.code}>
                          <TableCell>
                            <span className="font-mono font-bold text-amber-400">{agent.code}</span>
                          </TableCell>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell className="text-right">฿{formatNumber(agent.totalBets)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{agent.discountPct}%</Badge>
                            <p className="text-xs text-slate-400 mt-1">-฿{formatNumber(agent.discount)}</p>
                          </TableCell>
                          <TableCell className="text-right text-amber-400">
                            ฿{formatNumber(agent.netAmount)}
                          </TableCell>
                          <TableCell className="text-right text-red-400">
                            -฿{formatNumber(agent.payout)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-400 font-bold">
                            ฿{formatNumber(agent.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-bold ${agent.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              ฿{formatNumber(agent.balance)}
                            </span>
                            <p className="text-xs text-slate-500">
                              {agent.balance >= 0 ? "ค้างจ่ายเรา" : "เราค้างจ่าย"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenPaymentDialog(agent)}
                                title="ชำระยอด"
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                <Wallet className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDetailDialog(agent)}
                                title="ดูรายละเอียด"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-slate-800/50 font-bold">
                        <TableCell colSpan={2}>รวมทั้งหมด</TableCell>
                        <TableCell className="text-right">
                          ฿{formatNumber(agents.reduce((sum, a) => sum + a.totalBets, 0))}
                        </TableCell>
                        <TableCell className="text-center text-slate-400">
                          -฿{formatNumber(agents.reduce((sum, a) => sum + a.discount, 0))}
                        </TableCell>
                        <TableCell className="text-right text-amber-400">
                          ฿{formatNumber(agents.reduce((sum, a) => sum + a.netAmount, 0))}
                        </TableCell>
                        <TableCell className="text-right text-red-400">
                          -฿{formatNumber(agents.reduce((sum, a) => sum + a.payout, 0))}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400">
                          ฿{formatNumber(agents.reduce((sum, a) => sum + a.profit, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${totalBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            ฿{formatNumber(totalBalance)}
                          </span>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
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
                            <span className="text-slate-400">ส่วนลด ({lottery.discountPct}%)</span>
                            <span className="text-purple-400">-฿{formatNumber(lottery.discount)}</span>
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

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ประเภท</TableHead>
                        <TableHead className="text-center">จำนวนงวด</TableHead>
                        <TableHead className="text-right">ยอดแทง</TableHead>
                        <TableHead className="text-center">ส่วนลด</TableHead>
                        <TableHead className="text-right">ยอดสุทธิ</TableHead>
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
                          <TableCell className="text-center">{lottery.rounds}</TableCell>
                          <TableCell className="text-right">฿{formatNumber(lottery.totalBets)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{lottery.discountPct}%</Badge>
                            <p className="text-xs text-slate-400 mt-1">-฿{formatNumber(lottery.discount)}</p>
                          </TableCell>
                          <TableCell className="text-right text-amber-400">
                            ฿{formatNumber(lottery.netAmount)}
                          </TableCell>
                          <TableCell className="text-right text-red-400">
                            -฿{formatNumber(lottery.payout)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-400 font-bold">
                            ฿{formatNumber(lottery.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default">
                              {((lottery.profit / lottery.netAmount) * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-slate-800/50 font-bold">
                        <TableCell>รวมทั้งหมด</TableCell>
                        <TableCell className="text-center">
                          {lotterySummary.reduce((sum, l) => sum + (l.rounds || 0), 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{formatNumber(lotterySummary.reduce((sum, l) => sum + l.totalBets, 0))}
                        </TableCell>
                        <TableCell className="text-center text-slate-400">
                          -฿{formatNumber(lotterySummary.reduce((sum, l) => sum + l.discount, 0))}
                        </TableCell>
                        <TableCell className="text-right text-amber-400">
                          ฿{formatNumber(lotterySummary.reduce((sum, l) => sum + l.netAmount, 0))}
                        </TableCell>
                        <TableCell className="text-right text-red-400">
                          -฿{formatNumber(lotterySummary.reduce((sum, l) => sum + l.payout, 0))}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400">
                          ฿{formatNumber(lotterySummary.reduce((sum, l) => sum + l.profit, 0))}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Round */}
          <TabsContent value="byRound">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  สรุปตามงวด
                </CardTitle>
                <CardDescription>รายงานยอดแทงและกำไรแยกตามแต่ละงวดหวย</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary Cards by Lottery Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-slate-700/50 to-slate-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">งวดที่รอผล</span>
                        <Badge variant="outline" className="text-amber-400 border-amber-400/50">
                          {roundSummary.filter(r => r.status === "PENDING").length} งวด
                        </Badge>
                      </div>
                      <p className="text-xl font-bold text-amber-400">
                        ฿{formatNumber(roundSummary.filter(r => r.status === "PENDING").reduce((sum, r) => sum + r.totalBets, 0))}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">ยอดแทงรอผล</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-slate-700/50 to-slate-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">งวดที่ออกผลแล้ว</span>
                        <Badge variant="secondary">
                          {roundSummary.filter(r => r.status === "RESULTED").length} งวด
                        </Badge>
                      </div>
                      <p className="text-xl font-bold text-emerald-400">
                        ฿{formatNumber(roundSummary.filter(r => r.status === "RESULTED").reduce((sum, r) => sum + r.profit, 0))}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">กำไรรวม</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-slate-700/50 to-slate-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">จ่ายรางวัลแล้ว</span>
                        <Badge variant="destructive">
                          {roundSummary.filter(r => r.status === "RESULTED").length} งวด
                        </Badge>
                      </div>
                      <p className="text-xl font-bold text-red-400">
                        ฿{formatNumber(roundSummary.filter(r => r.status === "RESULTED").reduce((sum, r) => sum + r.payout, 0))}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">จ่ายรางวัลทั้งหมด</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>งวดวันที่</TableHead>
                        <TableHead>ประเภทหวย</TableHead>
                        <TableHead className="text-center">โพย</TableHead>
                        <TableHead className="text-right">ยอดแทง</TableHead>
                        <TableHead className="text-center">ส่วนลด</TableHead>
                        <TableHead className="text-right">ยอดสุทธิ</TableHead>
                        <TableHead className="text-right">จ่ายรางวัล</TableHead>
                        <TableHead className="text-right">กำไร</TableHead>
                        <TableHead className="text-center">ผลออก</TableHead>
                        <TableHead className="text-center">สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roundSummary.map((round) => (
                        <TableRow key={round.id} className="table-row-hover">
                          <TableCell>
                            <div className="font-medium">
                              {round.roundDate.toLocaleDateString("th-TH", { 
                                day: "numeric", 
                                month: "short", 
                                year: "2-digit" 
                              })}
                            </div>
                            <div className="text-xs text-slate-400">{round.id}</div>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span className="text-lg">{round.flag}</span>
                              <span className="font-medium">{round.lotteryName}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{round.totalSlips}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ฿{formatNumber(round.totalBets)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{round.discountPct}%</Badge>
                            <p className="text-xs text-slate-400 mt-1">-฿{formatNumber(round.discountAmount)}</p>
                          </TableCell>
                          <TableCell className="text-right font-medium text-amber-400">
                            ฿{formatNumber(round.netAmount)}
                          </TableCell>
                          <TableCell className="text-right text-red-400">
                            {round.payout > 0 ? `-฿${formatNumber(round.payout)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right text-emerald-400 font-bold">
                            ฿{formatNumber(round.profit)}
                          </TableCell>
                          <TableCell className="text-center">
                            {round.result ? (
                              <span className="font-mono text-amber-400">{round.result.top3}</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {round.status === "PENDING" ? (
                              <Badge variant="outline" className="text-amber-400 border-amber-400/50">
                                รอผล
                              </Badge>
                            ) : (
                              <Badge variant="success">ออกผลแล้ว</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-slate-800/50 font-bold">
                        <TableCell colSpan={2}>รวมทั้งหมด ({roundSummary.length} งวด)</TableCell>
                        <TableCell className="text-center">
                          {roundSummary.reduce((sum, r) => sum + r.totalSlips, 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{formatNumber(roundSummary.reduce((sum, r) => sum + r.totalBets, 0))}
                        </TableCell>
                        <TableCell className="text-center text-slate-400">
                          -฿{formatNumber(roundSummary.reduce((sum, r) => sum + r.discountAmount, 0))}
                        </TableCell>
                        <TableCell className="text-right text-amber-400">
                          ฿{formatNumber(roundSummary.reduce((sum, r) => sum + r.netAmount, 0))}
                        </TableCell>
                        <TableCell className="text-right text-red-400">
                          -฿{formatNumber(roundSummary.reduce((sum, r) => sum + r.payout, 0))}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400">
                          ฿{formatNumber(roundSummary.reduce((sum, r) => sum + r.profit, 0))}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
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

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              ชำระยอด: {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription>
              ยอดคงค้างปัจจุบัน:{" "}
              <span className={selectedAgent?.balance && selectedAgent.balance >= 0 ? "text-emerald-400" : "text-red-400"}>
                ฿{formatNumber(selectedAgent?.balance || 0)}
              </span>
              {selectedAgent?.balance && selectedAgent.balance >= 0 
                ? " (Agent ค้างจ่ายเรา)" 
                : " (เราค้างจ่าย Agent)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Payment Type */}
            <div className="space-y-2">
              <Label>ประเภทรายการ</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentFormData.type === "RECEIVE" ? "default" : "outline"}
                  onClick={() => setPaymentFormData({ ...paymentFormData, type: "RECEIVE" })}
                  className={`gap-2 ${paymentFormData.type === "RECEIVE" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  รับเงินจาก Agent
                </Button>
                <Button
                  type="button"
                  variant={paymentFormData.type === "PAY" ? "default" : "outline"}
                  onClick={() => setPaymentFormData({ ...paymentFormData, type: "PAY" })}
                  className={`gap-2 ${paymentFormData.type === "PAY" ? "bg-red-600 hover:bg-red-700" : ""}`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  จ่ายเงินให้ Agent
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">฿</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={paymentFormData.amount || ""}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="pl-8 text-2xl font-bold text-right"
                />
              </div>
              {selectedAgent?.balance !== 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentFormData({ ...paymentFormData, amount: Math.abs(selectedAgent?.balance || 0) })}
                  className="text-xs"
                >
                  ชำระเต็มจำนวน (฿{formatNumber(Math.abs(selectedAgent?.balance || 0))})
                </Button>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Input
                placeholder="เช่น ชำระยอดค้าง, จ่ายรางวัลงวด..."
                value={paymentFormData.note}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, note: e.target.value })}
              />
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">หลังทำรายการ:</p>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">ยอดคงค้างใหม่</span>
                <span className={`text-xl font-bold ${
                  ((selectedAgent?.balance || 0) + (paymentFormData.type === "RECEIVE" ? -paymentFormData.amount : paymentFormData.amount)) >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}>
                  ฿{formatNumber((selectedAgent?.balance || 0) + (paymentFormData.type === "RECEIVE" ? -paymentFormData.amount : paymentFormData.amount))}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleSavePayment}
              disabled={paymentFormData.amount <= 0}
              className={paymentFormData.type === "RECEIVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              <Receipt className="w-4 h-4 mr-2" />
              บันทึกรายการ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-400" />
              รายละเอียด: {selectedAgent?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-6 py-4">
              {/* Agent Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400">รหัส Agent</p>
                  <p className="text-xl font-mono font-bold text-amber-400">{selectedAgent.code}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400">เบอร์โทร</p>
                  <p className="text-lg">{selectedAgent.phone}</p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-slate-400">ยอดแทงรวม</p>
                  <p className="text-xl font-bold text-blue-400">฿{formatNumber(selectedAgent.totalBets)}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-sm text-slate-400">กำไร</p>
                  <p className="text-xl font-bold text-emerald-400">฿{formatNumber(selectedAgent.profit)}</p>
                </div>
                <div className={`p-4 rounded-lg ${selectedAgent.balance >= 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30"} border`}>
                  <p className="text-sm text-slate-400">ยอดคงค้าง</p>
                  <p className={`text-xl font-bold ${selectedAgent.balance >= 0 ? "text-amber-400" : "text-red-400"}`}>
                    ฿{formatNumber(selectedAgent.balance)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedAgent.balance >= 0 ? "Agent ค้างจ่ายเรา" : "เราค้างจ่าย Agent"}
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h4 className="text-sm font-medium text-slate-400 mb-3">สรุปการเงิน</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ส่วนลด</span>
                    <span className="text-amber-400">{selectedAgent.discountPct}% (-฿{formatNumber(selectedAgent.discount)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ยอดสุทธิ</span>
                    <span>฿{formatNumber(selectedAgent.netAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">จ่ายรางวัล</span>
                    <span className="text-red-400">-฿{formatNumber(selectedAgent.payout)}</span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  ประวัติการชำระล่าสุด
                </h4>
                {getAgentPayments(selectedAgent.code).length > 0 ? (
                  <div className="space-y-2">
                    {getAgentPayments(selectedAgent.code).slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            payment.type === "RECEIVE" 
                              ? "bg-emerald-500/20 text-emerald-400" 
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {payment.type === "RECEIVE" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {payment.type === "RECEIVE" ? "รับเงิน" : "จ่ายเงิน"}
                            </p>
                            <p className="text-xs text-slate-400">{payment.note}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${payment.type === "RECEIVE" ? "text-emerald-400" : "text-red-400"}`}>
                            {payment.type === "RECEIVE" ? "+" : "-"}฿{formatNumber(payment.amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {payment.date.toLocaleDateString("th-TH")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm py-4 text-center">ยังไม่มีประวัติการชำระ</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <Button 
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleOpenPaymentDialog(selectedAgent);
                  }}
                >
                  <Wallet className="w-4 h-4" />
                  ชำระยอด
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

