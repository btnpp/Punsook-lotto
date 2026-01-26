"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
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
import { fetcher } from "@/lib/fetcher";
import { LOTTERY_TYPES, BET_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";

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
  roundId: string;
  roundDate: Date;
  agent: { code: string; name: string };
  lottery: string;
  note?: string;
  createdBy?: string; // Admin ที่คีย์
  items: BetItem[];
  totalAmount: number;
  totalDiscount: number;
  totalNetAmount: number;
  status: string;
}

// Demo rounds
const demoRounds = [
  { id: "R001", date: new Date("2026-01-16"), lottery: "THAI", name: "หวยไทย 16/1/69" },
  { id: "R002", date: new Date("2026-01-10"), lottery: "LAO", name: "หวยลาว 10/1/69" },
  { id: "R003", date: new Date("2026-01-09"), lottery: "HANOI", name: "หวยฮานอย 9/1/69" },
  { id: "R004", date: new Date("2026-01-08"), lottery: "LAO", name: "หวยลาว 8/1/69" },
  { id: "R005", date: new Date("2026-01-01"), lottery: "THAI", name: "หวยไทย 1/1/69" },
];

// Demo slip data - จัดกลุ่มเป็นโพย
const demoSlips: Slip[] = [
  {
    id: "SLIP-001",
    date: new Date("2026-01-04T10:30:00"),
    roundId: "R001",
    roundDate: new Date("2026-01-16"),
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
    roundId: "R001",
    roundDate: new Date("2026-01-16"),
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
    roundId: "R002",
    roundDate: new Date("2026-01-10"),
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
    roundId: "R003",
    roundDate: new Date("2026-01-09"),
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
    roundId: "R005",
    roundDate: new Date("2026-01-01"),
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
    roundId: "R004",
    roundDate: new Date("2026-01-08"),
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
  const cancelledCount = items.filter(i => i.status === "CANCELLED").length;
  const activeCount = items.filter(i => i.status === "ACTIVE").length;
  
  // All items cancelled
  if (status === "CANCELLED") {
    return <Badge variant="destructive">ยกเลิกทั้งหมด</Badge>;
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
  
  // Active status - check if some are cancelled
  if (cancelledCount > 0) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Badge variant="success">รอผล {activeCount}/{items.length}</Badge>
        <span className="text-xs text-red-400">ยกเลิก {cancelledCount}</span>
      </div>
    );
  }
  
  return <Badge variant="success">รอผล</Badge>;
}

export default function HistoryPage() {
  const toast = useToast();
  const { user } = useAuth();
  
  // Use SWR for data fetching
  const { data: historyData, isLoading: isLoadingHistory, mutate: mutateHistory } = useSWR<{ slips: Slip[] }>(
    "/api/history",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  const { data: roundsData } = useSWR<{ rounds: Array<{ id: string; roundDate: string; lotteryType: { code: string; name: string } }> }>(
    "/api/rounds",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  
  const slips = (historyData?.slips || []).map(slip => ({
    ...slip,
    date: new Date(slip.date),
    roundDate: new Date(slip.roundDate),
  }));
  const rounds = (roundsData?.rounds || []).map(r => ({
    id: r.id,
    date: new Date(r.roundDate),
    lottery: r.lotteryType.code,
    name: r.lotteryType.name,
  }));
  const isLoading = isLoadingHistory;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLottery, setFilterLottery] = useState("ALL");
  const [filterRound, setFilterRound] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null);

  const handleCancelBet = async (betId: string) => {
    if (!confirm("ยืนยันการยกเลิกรายการนี้?")) return;
    
    try {
      const res = await fetch(`/api/bets/${betId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          reason: "ยกเลิกโดย Admin",
        }),
      });
      
      if (res.ok) {
        toast.success("ยกเลิกรายการสำเร็จ");
        mutateHistory(); // Refresh data with SWR
        // Update selectedSlip if it's open
        if (selectedSlip) {
          setSelectedSlip({
            ...selectedSlip,
            items: selectedSlip.items.map(item => 
              item.id === betId ? { ...item, status: "CANCELLED" } : item
            ),
          });
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถยกเลิกได้");
      }
    } catch (error) {
      console.error("Cancel bet error:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleCancelAllBets = async (items: BetItem[]) => {
    if (!confirm(`ยืนยันการยกเลิกทั้งหมด ${items.length} รายการ?`)) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      // Cancel all bets in parallel
      await Promise.all(
        items.map(async (item) => {
          try {
            const res = await fetch(`/api/bets/${item.id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id,
                reason: "ยกเลิกทั้งบิลโดย Admin",
              }),
            });
            if (res.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        })
      );
      
      if (successCount > 0) {
        toast.success(`ยกเลิกสำเร็จ ${successCount} รายการ`);
        mutateHistory();
        // Update selectedSlip
        if (selectedSlip) {
          setSelectedSlip({
            ...selectedSlip,
            items: selectedSlip.items.map(item => 
              items.some(i => i.id === item.id) ? { ...item, status: "CANCELLED" } : item
            ),
          });
        }
      }
      if (failCount > 0) {
        toast.error(`ยกเลิกไม่สำเร็จ ${failCount} รายการ`);
      }
    } catch (error) {
      console.error("Cancel all bets error:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  // Get available rounds based on selected lottery
  const availableRounds = filterLottery === "ALL" 
    ? rounds 
    : rounds.filter((r) => r.lottery === filterLottery);

  const filteredSlips = slips.filter((slip) => {
    const matchSearch =
      slip.items.some((i) => i.number.includes(searchTerm)) ||
      slip.agent.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLottery = filterLottery === "ALL" || slip.lottery === filterLottery;
    const matchRound = filterRound === "ALL" || slip.roundId === filterRound;
    const matchStatus = filterStatus === "ALL" || slip.status === filterStatus;

    return matchSearch && matchLottery && matchRound && matchStatus;
  });

  const totalSlips = filteredSlips.length;
  const cancelledSlips = filteredSlips.filter(slip => slip.status === "CANCELLED").length;
  const activeSlips = totalSlips - cancelledSlips;
  
  // Calculate amounts excluding cancelled items
  const totalAmount = filteredSlips.reduce((sum, slip) => 
    sum + slip.items.filter(i => i.status !== "CANCELLED").reduce((s, i) => s + i.amount, 0), 0);
  const totalNetAmount = filteredSlips.reduce((sum, slip) => 
    sum + slip.items.filter(i => i.status !== "CANCELLED").reduce((s, i) => s + i.netAmount, 0), 0);
  const totalItems = filteredSlips.reduce((sum, slip) => 
    sum + slip.items.filter(i => i.status !== "CANCELLED").length, 0);
  
  // Calculate cancelled amounts
  const cancelledAmount = filteredSlips.reduce((sum, slip) => 
    sum + slip.items.filter(i => i.status === "CANCELLED").reduce((s, i) => s + i.amount, 0), 0);
  const cancelledItems = filteredSlips.reduce((sum, slip) => 
    sum + slip.items.filter(i => i.status === "CANCELLED").length, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="ประวัติการแทง" subtitle="ดูประวัติการแทงทั้งหมด" />
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>รายการโพย</CardTitle>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={10} cols={6} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <Select 
                value={filterLottery} 
                onValueChange={(value) => {
                  setFilterLottery(value);
                  setFilterRound("ALL"); // Reset round when lottery changes
                }}
              >
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
              <Select value={filterRound} onValueChange={setFilterRound}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="งวด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกงวด</SelectItem>
                  {availableRounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                      {" - "}
                      {LOTTERY_TYPES[round.lottery as keyof typeof LOTTERY_TYPES]?.flag}
                    </SelectItem>
                  ))}
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">จำนวนโพย</p>
              <p className="text-2xl font-bold text-slate-100">{totalSlips}</p>
              {cancelledSlips > 0 && (
                <p className="text-xs text-red-400 mt-1">ยกเลิก {cancelledSlips} โพย</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">จำนวนรายการ</p>
              <p className="text-2xl font-bold text-slate-100">{totalItems}</p>
              {cancelledItems > 0 && (
                <p className="text-xs text-red-400 mt-1">ยกเลิก {cancelledItems} รายการ</p>
              )}
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
          {cancelledAmount > 0 && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <p className="text-sm text-red-400">ยอดที่ยกเลิก</p>
                <p className="text-2xl font-bold text-red-400">฿{formatNumber(cancelledAmount)}</p>
                <p className="text-xs text-red-400/70 mt-1">{cancelledItems} รายการ</p>
              </CardContent>
            </Card>
          )}
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
                  <TableHead>งวด</TableHead>
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
                      <span className="text-sm text-slate-300">
                        {slip.roundDate.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
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

              {/* Note & Created By */}
              {(selectedSlip.note || selectedSlip.createdBy) && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-1">
                  {selectedSlip.createdBy && (
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <span className="text-slate-500">คีย์โดย:</span>
                      <span className="text-slate-100">{selectedSlip.createdBy}</span>
                    </p>
                  )}
                  {selectedSlip.note && (
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      หมายเหตุ: {selectedSlip.note}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedSlip.items.some(i => i.status === "ACTIVE") && (
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelAllBets(selectedSlip.items.filter(i => i.status === "ACTIVE"))}
                  >
                    <X className="w-4 h-4 mr-2" />
                    ยกเลิกทั้งบิล ({selectedSlip.items.filter(i => i.status === "ACTIVE").length} รายการ)
                  </Button>
                </div>
              )}

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
                          <div className="flex items-center justify-end gap-2">
                            {item.status === "ACTIVE" ? (
                              <>
                                <Badge variant="success">รอผล</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelBet(item.id);
                                  }}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  ยกเลิก
                                </Button>
                              </>
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
                          </div>
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
                    <span className="text-slate-400">
                      ส่วนลด ({selectedSlip.totalAmount > 0 
                        ? Math.round((selectedSlip.totalDiscount / selectedSlip.totalAmount) * 100) 
                        : 0}%):
                    </span>
                    <span className="text-emerald-400">
                      -฿{formatNumber(selectedSlip.totalDiscount)}
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
