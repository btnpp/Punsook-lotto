"use client";

import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  Users,
  Ticket,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Eye,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";

interface DashboardData {
  stats: {
    agentCount: number;
    activeRounds: number;
    todayBetCount: number;
    todayAmount: number;
  };
  recentBets: Array<{
    id: string;
    number: string;
    betType: string;
    netAmount: number;
    createdAt: string;
    agent: { code: string; name: string };
    round: { lotteryType: { name: string } };
  }>;
  openRounds: Array<{
    id: string;
    roundDate: string;
    status: string;
    lotteryType: { code: string; name: string };
    _count: { bets: number };
  }>;
  riskData: Array<{
    number: string;
    betType: string;
    _sum: { netAmount: number };
  }>;
}

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    "/api/dashboard",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );

  // Show skeleton loading
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle="ภาพรวมระบบ" />
        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>งวดที่เปิดรับ</CardTitle>
              </CardHeader>
              <CardContent>
                <TableSkeleton rows={3} cols={4} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>รายการล่าสุด</CardTitle>
              </CardHeader>
              <CardContent>
                <TableSkeleton rows={5} cols={3} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">ไม่สามารถโหลดข้อมูลได้</p>
          <Button onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Agent ทั้งหมด",
      value: data?.stats.agentCount || 0,
      change: `${data?.stats.activeRounds || 0} งวดเปิด`,
      changeType: "positive",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "ยอดแทงวันนี้",
      value: data?.stats.todayAmount || 0,
      change: `${data?.stats.todayBetCount || 0} รายการ`,
      changeType: "positive",
      icon: Ticket,
      color: "from-amber-500 to-orange-500",
      isCurrency: true,
    },
    {
      title: "งวดที่เปิดรับ",
      value: data?.stats.activeRounds || 0,
      change: "งวด",
      changeType: "positive",
      icon: Calendar,
      color: "from-emerald-500 to-green-500",
    },
    {
      title: "เลขเสี่ยง",
      value: data?.riskData?.length || 0,
      change: "ต้องดูแล",
      changeType: "warning",
      icon: AlertTriangle,
      color: "from-red-500 to-rose-500",
    },
  ];

  const getLotteryFlag = (code: string) => {
    switch (code) {
      case "THAI": return "🇹🇭";
      case "LAO": return "🇱🇦";
      case "HANOI": return "🇻🇳";
      default: return "🎰";
    }
  };

  const getBetTypeName = (type: string) => {
    const types: Record<string, string> = {
      THREE_TOP: "3ตัวบน",
      THREE_TOD: "3ตัวโต๊ด",
      TWO_TOP: "2ตัวบน",
      TWO_BOTTOM: "2ตัวล่าง",
      RUN_TOP: "วิ่งบน",
      RUN_BOTTOM: "วิ่งล่าง",
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="ภาพรวมระบบคีย์หวย" />

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" asChild>
            <Link href="/dashboard/bets">
              <Plus className="w-4 h-4" />
              คีย์หวยใหม่
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/dashboard/agents">
              <Users className="w-4 h-4" />
              เพิ่ม Agent
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/dashboard/risk">
              <Eye className="w-4 h-4" />
              ดูความเสี่ยง
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                      {stat.isCurrency
                        ? formatCurrency(stat.value)
                        : formatNumber(stat.value)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.changeType === "positive" && (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      )}
                      <span
                        className={
                          stat.changeType === "positive"
                            ? "text-emerald-400 text-sm"
                            : stat.changeType === "warning"
                            ? "text-yellow-400 text-sm"
                            : "text-slate-400 text-sm"
                        }
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">การแทงล่าสุด</CardTitle>
              <Link href="/dashboard/history">
                <Button variant="ghost" size="sm">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.recentBets && data.recentBets.length > 0 ? (
                  data.recentBets.slice(0, 5).map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                          <span className="text-amber-400 text-sm font-bold">
                            {bet.agent.code}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {bet.agent.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {bet.round.lotteryType.name} - {bet.number} ({getBetTypeName(bet.betType)})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-400">
                          {formatCurrency(bet.netAmount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(bet.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-8">ยังไม่มีรายการแทง</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Risk Monitor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">🔥 เลขเสี่ยง (Top Risk)</CardTitle>
              <Link href="/dashboard/risk">
                <Button variant="ghost" size="sm">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.riskData && data.riskData.length > 0 ? (
                  data.riskData.slice(0, 4).map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-mono font-bold text-amber-400">
                            {item.number}
                          </span>
                          <Badge variant="secondary">{getBetTypeName(item.betType)}</Badge>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-slate-100">
                            {formatCurrency(item._sum.netAmount || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                          style={{ width: "60%" }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-8">ยังไม่มีข้อมูลความเสี่ยง</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open Rounds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎰 งวดที่เปิดรับ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.openRounds && data.openRounds.length > 0 ? (
                data.openRounds.map((round) => (
                  <div
                    key={round.id}
                    className="p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{getLotteryFlag(round.lotteryType.code)}</span>
                      <div>
                        <h3 className="font-semibold text-slate-100">{round.lotteryType.name}</h3>
                        <p className="text-xs text-slate-400">
                          งวด {new Date(round.roundDate).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">จำนวนโพย</span>
                        <span className="text-slate-100">{round._count.bets} รายการ</span>
                      </div>
                      <Badge variant="success" className="w-full justify-center mt-2">
                        {round.status === "OPEN" ? "เปิดรับ" : round.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-slate-500 py-8">
                  ยังไม่มีงวดที่เปิดรับ
                  <Link href="/dashboard/rounds" className="block mt-2">
                    <Button variant="outline" size="sm">สร้างงวดใหม่</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
