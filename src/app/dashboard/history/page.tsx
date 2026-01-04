"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Download, Filter, Calendar } from "lucide-react";
import { formatNumber, formatDateThai } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES } from "@/lib/constants";

// Demo history data
const demoHistory = [
  {
    id: "1",
    date: new Date("2026-01-04T10:30:00"),
    agent: { code: "A001", name: "นายสมชาย" },
    lottery: "THAI",
    number: "25",
    betType: "TWO_TOP",
    amount: 500,
    discount: 15,
    netAmount: 425,
    status: "ACTIVE",
  },
  {
    id: "2",
    date: new Date("2026-01-04T10:28:00"),
    agent: { code: "A002", name: "นายวิชัย" },
    lottery: "LAO",
    number: "123",
    betType: "THREE_TOP",
    amount: 100,
    discount: 15,
    netAmount: 85,
    status: "ACTIVE",
  },
  {
    id: "3",
    date: new Date("2026-01-04T10:25:00"),
    agent: { code: "A001", name: "นายสมชาย" },
    lottery: "THAI",
    number: "36",
    betType: "TWO_TOP",
    amount: 300,
    discount: 15,
    netAmount: 255,
    status: "ACTIVE",
  },
  {
    id: "4",
    date: new Date("2026-01-04T10:20:00"),
    agent: { code: "A003", name: "นายประสิทธิ์" },
    lottery: "HANOI",
    number: "99",
    betType: "TWO_BOTTOM",
    amount: 1000,
    discount: 11,
    netAmount: 890,
    status: "ACTIVE",
  },
  {
    id: "5",
    date: new Date("2026-01-03T14:30:00"),
    agent: { code: "A001", name: "นายสมชาย" },
    lottery: "THAI",
    number: "456",
    betType: "THREE_TOD",
    amount: 200,
    discount: 15,
    netAmount: 170,
    status: "LOST",
  },
  {
    id: "6",
    date: new Date("2026-01-03T14:25:00"),
    agent: { code: "A002", name: "นายวิชัย" },
    lottery: "LAO",
    number: "78",
    betType: "TWO_TOP",
    amount: 500,
    discount: 15,
    netAmount: 425,
    status: "WON",
    winAmount: 45000,
  },
  {
    id: "7",
    date: new Date("2026-01-03T14:20:00"),
    agent: { code: "A003", name: "นายประสิทธิ์" },
    lottery: "HANOI",
    number: "5",
    betType: "RUN_TOP",
    amount: 1000,
    discount: 11,
    netAmount: 890,
    status: "CANCELLED",
  },
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLottery, setFilterLottery] = useState("ALL");
  const [filterAgent, setFilterAgent] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filteredHistory = demoHistory.filter((item) => {
    const matchSearch =
      item.number.includes(searchTerm) ||
      item.agent.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.agent.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLottery = filterLottery === "ALL" || item.lottery === filterLottery;
    const matchAgent = filterAgent === "ALL" || item.agent.code === filterAgent;
    const matchStatus = filterStatus === "ALL" || item.status === filterStatus;

    return matchSearch && matchLottery && matchAgent && matchStatus;
  });

  const totalAmount = filteredHistory.reduce((sum, item) => sum + item.amount, 0);
  const totalNetAmount = filteredHistory.reduce((sum, item) => sum + item.netAmount, 0);

  return (
    <div className="min-h-screen">
      <Header title="ประวัติการแทง" subtitle="ดูประวัติการแทงทั้งหมด" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="ค้นหาเลข, รหัส Agent, ชื่อ..."
                  icon={<Search className="w-4 h-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterLottery} onValueChange={setFilterLottery}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="ประเภทหวย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => (
                    <SelectItem key={key} value={key}>
                      {lottery.flag} {lottery.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  <SelectItem value="A001">A001</SelectItem>
                  <SelectItem value="A002">A002</SelectItem>
                  <SelectItem value="A003">A003</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                  <SelectItem value="WON">ถูกรางวัล</SelectItem>
                  <SelectItem value="LOST">ไม่ถูก</SelectItem>
                  <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">จำนวนรายการ</p>
              <p className="text-2xl font-bold text-slate-100">{filteredHistory.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">ยอดรวม</p>
              <p className="text-2xl font-bold text-amber-400">฿{formatNumber(totalAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">ยอดสุทธิ</p>
              <p className="text-2xl font-bold text-emerald-400">฿{formatNumber(totalNetAmount)}</p>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่/เวลา</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>หวย</TableHead>
                  <TableHead>เลข</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">ยอด</TableHead>
                  <TableHead className="text-right">ส่วนลด</TableHead>
                  <TableHead className="text-right">สุทธิ</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id} className="table-row-hover">
                    <TableCell className="text-slate-400">
                      <div>
                        <p className="text-slate-100">
                          {item.date.toLocaleDateString("th-TH")}
                        </p>
                        <p className="text-xs">
                          {item.date.toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-mono text-amber-400">{item.agent.code}</span>
                        <p className="text-xs text-slate-400">{item.agent.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>
                        {LOTTERY_TYPES[item.lottery as keyof typeof LOTTERY_TYPES]?.flag}{" "}
                        {LOTTERY_TYPES[item.lottery as keyof typeof LOTTERY_TYPES]?.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl font-mono font-bold text-amber-400">
                        {item.number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {BET_TYPES[item.betType as keyof typeof BET_TYPES]?.shortName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{formatNumber(item.amount)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-400">
                      -{item.discount}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{formatNumber(item.netAmount)}
                    </TableCell>
                    <TableCell>
                      {item.status === "ACTIVE" ? (
                        <Badge variant="success">ใช้งาน</Badge>
                      ) : item.status === "WON" ? (
                        <div>
                          <Badge variant="default">ถูกรางวัล</Badge>
                          <p className="text-xs text-amber-400 mt-1">
                            +฿{formatNumber(item.winAmount || 0)}
                          </p>
                        </div>
                      ) : item.status === "LOST" ? (
                        <Badge variant="secondary">ไม่ถูก</Badge>
                      ) : (
                        <Badge variant="destructive">ยกเลิก</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

