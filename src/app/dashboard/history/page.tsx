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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Download, ChevronRight, FileText, X } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES } from "@/lib/constants";

// Interface สำหรับ bet item
interface BetItem {
  id: string;
  number: string;
  betType: string;
  amount: number;
  discount: number;
  netAmount: number;
  status: string;
  winAmount?: number;
}

// Interface สำหรับ slip (โพย)
interface Slip {
  id: string;
  date: Date;
  agent: { code: string; name: string };
  lottery: string;
  items: BetItem[];
  totalAmount: number;
  totalDiscount: number;
  totalNetAmount: number;
  status: string;
}

// Demo slip data - จัดกลุ่มเป็นโพย
const demoSlips: Slip[] = [
  {
    id: "SLIP-001",
    date: new Date("2026-01-04T10:30:00"),
    agent: { code: "A001", name: "นายสมชาย" },
    lottery: "THAI",
    items: [
      { id: "1", number: "25", betType: "TWO_TOP", amount: 500, discount: 15, netAmount: 425, status: "ACTIVE" },
      { id: "2", number: "36", betType: "TWO_TOP", amount: 300, discount: 15, netAmount: 255, status: "ACTIVE" },
      { id: "3", number: "52", betType: "TWO_TOP", amount: 200, discount: 15, netAmount: 170, status: "ACTIVE" },
    ],
    totalAmount: 1000,
    totalDiscount: 15,
    totalNetAmount: 850,
    status: "ACTIVE",
  },
  {
    id: "SLIP-002",
    date: new Date("2026-01-04T10:25:00"),
    agent: { code: "A001", name: "นายสมชาย" },
    lottery: "THAI",
    items: [
      { id: "4", number: "456", betType: "THREE_TOD", amount: 200, discount: 15, netAmount: 170, status: "ACTIVE" },
    ],
    totalAmount: 200,
    totalDiscount: 15,
    totalNetAmount: 170,
    status: "ACTIVE",
  },
  {
    id: "SLIP-003",
    date: new Date("2026-01-04T09:45:00"),
    agent: { code: "A002", name: "นายวิชัย" },
    lottery: "LAO",
    items: [
      { id: "5", number: "123", betType: "THREE_TOP", amount: 100, discount: 12, netAmount: 88, status: "ACTIVE" },
      { id: "6", number: "321", betType: "THREE_TOP", amount: 100, discount: 12, netAmount: 88, status: "ACTIVE" },
      { id: "7", number: "12", betType: "TWO_TOP", amount: 500, discount: 12, netAmount: 440, status: "ACTIVE" },
      { id: "8", number: "21", betType: "TWO_TOP", amount: 500, discount: 12, netAmount: 440, status: "ACTIVE" },
    ],
    totalAmount: 1200,
    totalDiscount: 12,
    totalNetAmount: 1056,
    status: "ACTIVE",
  },
  {
    id: "SLIP-004",
    date: new Date("2026-01-03T16:30:00"),
    agent: { code: "A003", name: "นายประสิทธิ์" },
    lottery: "HANOI",
    items: [
      { id: "9", number: "99", betType: "TWO_BOTTOM", amount: 1000, discount: 11, netAmount: 890, status: "WON", winAmount: 85500 },
      { id: "10", number: "88", betType: "TWO_BOTTOM", amount: 500, discount: 11, netAmount: 445, status: "LOST" },
    ],
    totalAmount: 1500,
    totalDiscount: 11,
    totalNetAmount: 1335,
    status: "RESULTED",
  },
  {
    id: "SLIP-005",
    date: new Date("2026-01-03T14:30:00"),
    agent: { code: "A001", name: "นายสมชาย" },
    lottery: "THAI",
    items: [
      { id: "11", number: "78", betType: "TWO_TOP", amount: 500, discount: 15, netAmount: 425, status: "WON", winAmount: 45000 },
      { id: "12", number: "87", betType: "TWO_TOP", amount: 500, discount: 15, netAmount: 425, status: "LOST" },
      { id: "13", number: "789", betType: "THREE_TOD", amount: 100, discount: 15, netAmount: 85, status: "LOST" },
    ],
    totalAmount: 1100,
    totalDiscount: 15,
    totalNetAmount: 935,
    status: "RESULTED",
  },
  {
    id: "SLIP-006",
    date: new Date("2026-01-02T11:00:00"),
    agent: { code: "A002", name: "นายวิชัย" },
    lottery: "LAO",
    items: [
      { id: "14", number: "55", betType: "TWO_TOP", amount: 300, discount: 12, netAmount: 264, status: "CANCELLED" },
    ],
    totalAmount: 300,
    totalDiscount: 12,
    totalNetAmount: 264,
    status: "CANCELLED",
  },
];

// Get unique numbers display
function getNumbersPreview(items: BetItem[], maxShow: number = 3): string {
  const numbers = items.map((i) => i.number);
  if (numbers.length <= maxShow) {
    return numbers.join(", ");
  }
  return numbers.slice(0, maxShow).join(", ") + ` +${numbers.length - maxShow}`;
}

// Get slip status badge
function getSlipStatusBadge(status: string, items: BetItem[]) {
  if (status === "CANCELLED") {
    return <Badge variant="destructive">ยกเลิก</Badge>;
  }
  if (status === "RESULTED") {
    const wonItems = items.filter((i) => i.status === "WON");
    const totalWin = wonItems.reduce((sum, i) => sum + (i.winAmount || 0), 0);
    if (wonItems.length > 0) {
      return (
        <div className="flex flex-col items-end gap-1">
          <Badge variant="default">ถูก {wonItems.length}/{items.length}</Badge>
          <span className="text-xs text-amber-400 font-medium">+฿{formatNumber(totalWin)}</span>
        </div>
      );
    }
    return <Badge variant="secondary">ไม่ถูก</Badge>;
  }
  return <Badge variant="success">รอผล</Badge>;
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLottery, setFilterLottery] = useState("ALL");
  const [filterAgent, setFilterAgent] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null);

  const filteredSlips = demoSlips.filter((slip) => {
    const matchSearch =
      slip.items.some((i) => i.number.includes(searchTerm)) ||
      slip.agent.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLottery = filterLottery === "ALL" || slip.lottery === filterLottery;
    const matchAgent = filterAgent === "ALL" || slip.agent.code === filterAgent;
    const matchStatus = filterStatus === "ALL" || slip.status === filterStatus;

    return matchSearch && matchLottery && matchAgent && matchStatus;
  });

  const totalSlips = filteredSlips.length;
  const totalAmount = filteredSlips.reduce((sum, slip) => sum + slip.totalAmount, 0);
  const totalNetAmount = filteredSlips.reduce((sum, slip) => sum + slip.totalNetAmount, 0);
  const totalItems = filteredSlips.reduce((sum, slip) => sum + slip.items.length, 0);

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
                  placeholder="ค้นหาเลข, รหัสโพย, Agent..."
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
                  <SelectItem value="ACTIVE">รอผล</SelectItem>
                  <SelectItem value="RESULTED">ออกผลแล้ว</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">จำนวนโพย</p>
              <p className="text-2xl font-bold text-slate-100">{totalSlips}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">จำนวนรายการ</p>
              <p className="text-2xl font-bold text-slate-100">{totalItems}</p>
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

        {/* Slips Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              รายการโพยทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสโพย</TableHead>
                  <TableHead>วันที่/เวลา</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>หวย</TableHead>
                  <TableHead>เลข</TableHead>
                  <TableHead className="text-center">รายการ</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead className="text-right">สุทธิ</TableHead>
                  <TableHead className="text-right">สถานะ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSlips.map((slip) => (
                  <TableRow 
                    key={slip.id} 
                    className="table-row-hover cursor-pointer group"
                    onClick={() => setSelectedSlip(slip)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm text-amber-400">{slip.id}</span>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      <div>
                        <p className="text-slate-100">
                          {slip.date.toLocaleDateString("th-TH")}
                        </p>
                        <p className="text-xs">
                          {slip.date.toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-mono text-amber-400">{slip.agent.code}</span>
                        <p className="text-xs text-slate-400">{slip.agent.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>
                        {LOTTERY_TYPES[slip.lottery as keyof typeof LOTTERY_TYPES]?.flag}{" "}
                        {LOTTERY_TYPES[slip.lottery as keyof typeof LOTTERY_TYPES]?.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-slate-100">
                        {getNumbersPreview(slip.items)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{slip.items.length} เลข</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{formatNumber(slip.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-400">
                      ฿{formatNumber(slip.totalNetAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getSlipStatusBadge(slip.status, slip.items)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Slip Detail Dialog */}
      <Dialog open={!!selectedSlip} onOpenChange={() => setSelectedSlip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                รายละเอียดโพย {selectedSlip?.id}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSlip && (
            <div className="space-y-6">
              {/* Slip Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-800/50">
                <div>
                  <p className="text-xs text-slate-400">วันที่/เวลา</p>
                  <p className="text-slate-100">
                    {selectedSlip.date.toLocaleDateString("th-TH")} {selectedSlip.date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Agent</p>
                  <p className="text-amber-400 font-mono">{selectedSlip.agent.code}</p>
                  <p className="text-xs text-slate-400">{selectedSlip.agent.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">ประเภทหวย</p>
                  <p className="text-slate-100">
                    {LOTTERY_TYPES[selectedSlip.lottery as keyof typeof LOTTERY_TYPES]?.flag}{" "}
                    {LOTTERY_TYPES[selectedSlip.lottery as keyof typeof LOTTERY_TYPES]?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">สถานะ</p>
                  {getSlipStatusBadge(selectedSlip.status, selectedSlip.items)}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">รายการเลข ({selectedSlip.items.length} รายการ)</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลข</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead className="text-right">ยอด</TableHead>
                      <TableHead className="text-right">ส่วนลด</TableHead>
                      <TableHead className="text-right">สุทธิ</TableHead>
                      <TableHead className="text-right">สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSlip.items.map((item) => (
                      <TableRow key={item.id}>
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
                        <TableCell className="text-right">
                          ฿{formatNumber(item.amount)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400">
                          -{item.discount}%
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{formatNumber(item.netAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === "ACTIVE" ? (
                            <Badge variant="success">รอผล</Badge>
                          ) : item.status === "WON" ? (
                            <div className="flex flex-col items-end">
                              <Badge variant="default">ถูก</Badge>
                              <span className="text-xs text-amber-400">+฿{formatNumber(item.winAmount || 0)}</span>
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
              </div>

              {/* Summary */}
              <div className="flex justify-end border-t border-slate-700 pt-4">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between gap-8">
                    <span className="text-slate-400">ยอดรวม:</span>
                    <span className="font-medium">฿{formatNumber(selectedSlip.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-slate-400">ส่วนลด ({selectedSlip.totalDiscount}%):</span>
                    <span className="text-emerald-400">
                      -฿{formatNumber(selectedSlip.totalAmount - selectedSlip.totalNetAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-8 text-lg font-bold">
                    <span className="text-slate-300">ยอดสุทธิ:</span>
                    <span className="text-amber-400">฿{formatNumber(selectedSlip.totalNetAmount)}</span>
                  </div>
                  {selectedSlip.status === "RESULTED" && (
                    <div className="flex justify-between gap-8 pt-2 border-t border-slate-700">
                      <span className="text-slate-400">เงินรางวัล:</span>
                      <span className="text-emerald-400 font-bold">
                        +฿{formatNumber(selectedSlip.items.reduce((sum, i) => sum + (i.winAmount || 0), 0))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
