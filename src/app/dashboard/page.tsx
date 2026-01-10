"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Ticket,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";

// Demo data
const stats = [
  {
    title: "Agent ทั้งหมด",
    value: 12,
    change: "+2",
    changeType: "positive",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "ยอดแทงวันนี้",
    value: 458000,
    change: "+15.3%",
    changeType: "positive",
    icon: Ticket,
    color: "from-amber-500 to-orange-500",
    isCurrency: true,
  },
  {
    title: "กำไรวันนี้",
    value: 45200,
    change: "+8.2%",
    changeType: "positive",
    icon: TrendingUp,
    color: "from-emerald-500 to-green-500",
    isCurrency: true,
  },
  {
    title: "เลขเกิน Limit",
    value: 5,
    change: "ต้องตีออก",
    changeType: "warning",
    icon: AlertTriangle,
    color: "from-red-500 to-rose-500",
  },
];

const recentBets = [
  { agent: "A001", name: "นายสมชาย", lottery: "หวยไทย", amount: 15000, time: "10:30" },
  { agent: "A002", name: "นายวิชัย", lottery: "หวยลาว", amount: 8500, time: "10:25" },
  { agent: "A003", name: "นายประสิทธิ์", lottery: "หวยฮานอย", amount: 12000, time: "10:20" },
  { agent: "A001", name: "นายสมชาย", lottery: "หวยไทย", amount: 5500, time: "10:15" },
  { agent: "A004", name: "นายสุรศักดิ์", lottery: "หวยลาว", amount: 9200, time: "10:10" },
];

const topRiskNumbers = [
  { number: "25", type: "2ตัวบน", amount: 4800, limit: 5000, percentage: 96 },
  { number: "36", type: "2ตัวบน", amount: 4200, limit: 5000, percentage: 84 },
  { number: "123", type: "3ตัวบน", amount: 150, limit: 200, percentage: 75 },
  { number: "19", type: "2ตัวล่าง", amount: 3250, limit: 5000, percentage: 65 },
];

export default function DashboardPage() {
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
                      {stat.changeType === "negative" && (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={
                          stat.changeType === "positive"
                            ? "text-emerald-400 text-sm"
                            : stat.changeType === "negative"
                            ? "text-red-400 text-sm"
                            : "text-yellow-400 text-sm"
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
                {recentBets.map((bet, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                        <span className="text-amber-400 text-sm font-bold">
                          {bet.agent}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          {bet.name}
                        </p>
                        <p className="text-xs text-slate-400">{bet.lottery}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-400">
                        {formatCurrency(bet.amount)}
                      </p>
                      <p className="text-xs text-slate-500">{bet.time}</p>
                    </div>
                  </div>
                ))}
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
                {topRiskNumbers.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-mono font-bold text-amber-400">
                          {item.number}
                        </span>
                        <Badge variant="secondary">{item.type}</Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-slate-100">
                          {formatNumber(item.amount)}
                        </span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-sm text-slate-400">
                          {formatNumber(item.limit)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.percentage >= 95
                            ? "bg-gradient-to-r from-red-500 to-rose-500"
                            : item.percentage >= 80
                            ? "bg-gradient-to-r from-orange-500 to-amber-500"
                            : item.percentage >= 60
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                            : "bg-gradient-to-r from-emerald-500 to-green-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">ใช้ไป {item.percentage}%</span>
                      {item.percentage >= 80 && (
                        <span className="text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ใกล้ถึง Limit
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
              {/* Thai Lottery */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🇹🇭</span>
                  <div>
                    <h3 className="font-semibold text-slate-100">หวยไทย</h3>
                    <p className="text-xs text-slate-400">งวด 16/01/2569</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">ยอดรวม</span>
                    <span className="text-slate-100 font-semibold">฿285,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">จำนวนโพย</span>
                    <span className="text-slate-100">156 รายการ</span>
                  </div>
                  <Badge variant="success" className="w-full justify-center mt-2">
                    เปิดรับ
                  </Badge>
                </div>
              </div>

              {/* Lao Lottery */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🇱🇦</span>
                  <div>
                    <h3 className="font-semibold text-slate-100">หวยลาว</h3>
                    <p className="text-xs text-slate-400">งวด 06/01/2569</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">ยอดรวม</span>
                    <span className="text-slate-100 font-semibold">฿98,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">จำนวนโพย</span>
                    <span className="text-slate-100">78 รายการ</span>
                  </div>
                  <Badge variant="success" className="w-full justify-center mt-2">
                    เปิดรับ
                  </Badge>
                </div>
              </div>

              {/* Hanoi Lottery */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🇻🇳</span>
                  <div>
                    <h3 className="font-semibold text-slate-100">หวยฮานอย</h3>
                    <p className="text-xs text-slate-400">งวด 04/01/2569</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">ยอดรวม</span>
                    <span className="text-slate-100 font-semibold">฿74,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">จำนวนโพย</span>
                    <span className="text-slate-100">45 รายการ</span>
                  </div>
                  <Badge variant="success" className="w-full justify-center mt-2">
                    เปิดรับ
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

