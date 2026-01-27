"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Send,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { LayoffSkeleton } from "@/components/ui/skeleton";
import { LOTTERY_TYPES, BET_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";


interface LayoffItem {
  id: string;
  number: string;
  betType: string;
  totalAmount: number;
  limitAmount: number;
  excessAmount: number;
  layoffAmount: number;
  keepAmount: number;
  payRate: number;
  potentialPayout: number;
  status: string;
}

export default function LayoffPage() {
  const toast = useToast();
  const [selectedLottery, setSelectedLottery] = useState("THAI");
  const [layoffItems, setLayoffItems] = useState<LayoffItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [copied, setCopied] = useState(false);

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

  // SWR for layoff data
  interface LayoffResponse {
    layoffNumbers: Array<{ number: string; betType: string; totalAmount: number; limit: number; overLimit: number; layoffAmount: number; potentialPayout: number }>;
  }
  const { data: layoffData, isLoading, mutate } = useSWR<LayoffResponse>("/api/layoff");

  useEffect(() => {
    if (layoffData?.layoffNumbers) {
      const items = layoffData.layoffNumbers.map((item, idx) => ({
        id: `${idx + 1}`,
        number: item.number,
        betType: item.betType,
        totalAmount: item.totalAmount,
        limitAmount: item.limit || 0,
        excessAmount: item.overLimit || 0,
        layoffAmount: item.layoffAmount || item.overLimit || 0,
        keepAmount: item.totalAmount - (item.layoffAmount || item.overLimit || 0),
        payRate: getPayRate(item.betType),
        potentialPayout: item.potentialPayout || 0,
        status: "PENDING",
      }));
      setLayoffItems(items);
    }
  }, [layoffData]);

  const fetchLayoffData = () => mutate();

  const totalLayoffAmount = layoffItems
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + item.layoffAmount, 0);

  const totalPotentialPayout = layoffItems
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + item.potentialPayout, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="ตีออก" subtitle="จัดการเลขที่เกิน Limit" />
        <LayoffSkeleton />
      </div>
    );
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(
        layoffItems.filter((item) => item.status === "PENDING").map((item) => item.id)
      );
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    }
  };

  const generateLayoffText = () => {
    const items = layoffItems.filter((item) => selectedItems.includes(item.id));
    const grouped: Record<string, typeof items> = {};

    items.forEach((item) => {
      const type = BET_TYPES[item.betType as keyof typeof BET_TYPES]?.name || item.betType;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    });

    let text = `หวยไทย งวด 16/01/2569\n`;
    text += `─────────────────────\n\n`;

    Object.entries(grouped).forEach(([type, items]) => {
      text += `🔺 ${type}\n`;
      items.forEach((item) => {
        text += `${item.number} = ${formatNumber(item.layoffAmount)}\n`;
      });
      text += `\n`;
    });

    text += `─────────────────────\n`;
    text += `รวมยอดตีออก: ฿${formatNumber(
      items.reduce((sum, item) => sum + item.layoffAmount, 0)
    )}\n`;

    return text;
  };

  const handleCopyToClipboard = () => {
    const text = generateLayoffText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export using xlsx library
    toast.info("กำลังส่งออกไฟล์ Excel...");
  };

  const handleMarkAsSent = () => {
    setLayoffItems(
      layoffItems.map((item) =>
        selectedItems.includes(item.id)
          ? { ...item, status: "SENT" }
          : item
      )
    );
    setSelectedItems([]);
    setIsConfirmDialogOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Header title="ระบบตีออก" subtitle="จัดการและส่งออกรายการตีออก" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">รายการรอตีออก</p>
              <p className="text-2xl font-bold text-amber-400">
                {layoffItems.filter((item) => item.status === "PENDING").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">ยอดตีออกรวม</p>
              <p className="text-2xl font-bold text-red-400">
                ฿{formatNumber(totalLayoffAmount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">ถ้าออกต้องจ่าย (รวม)</p>
              <p className="text-2xl font-bold text-slate-100">
                ฿{formatNumber(totalPotentialPayout)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">ส่งออกแล้ว</p>
              <p className="text-2xl font-bold text-emerald-400">
                {layoffItems.filter((item) => item.status !== "PENDING").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCopyToClipboard}
              disabled={selectedItems.length === 0}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportExcel}
              disabled={selectedItems.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
            <Button
              className="gap-2"
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={selectedItems.length === 0}
            >
              <Send className="w-4 h-4" />
              ทำเครื่องหมายส่งแล้ว
            </Button>
          </div>
        </div>

        {/* Layoff Table */}
        <Card>
          <CardHeader>
            <CardTitle>📋 รายการตีออก - {LOTTERY_TYPES[selectedLottery as keyof typeof LOTTERY_TYPES]?.name || "หวยไทย"}</CardTitle>
          </CardHeader>
          <CardContent>
            {layoffItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg">ไม่มีรายการที่ต้องตีออก</p>
                <p className="text-sm mt-2">เลขทั้งหมดอยู่ในเกณฑ์ปลอดภัย</p>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedItems.length ===
                        layoffItems.filter((item) => item.status === "PENDING").length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>เลข</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">ยอดเกิน</TableHead>
                  <TableHead className="text-right">ตีออก</TableHead>
                  <TableHead className="text-right">อัตราจ่าย</TableHead>
                  <TableHead className="text-right">ถ้าออกต้องจ่าย</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {layoffItems.map((item) => (
                  <TableRow key={item.id} className="table-row-hover">
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) =>
                          handleSelectItem(item.id, checked as boolean)
                        }
                        disabled={item.status !== "PENDING"}
                      />
                    </TableCell>
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
                      ฿{formatNumber(item.limitAmount)}
                    </TableCell>
                    <TableCell className="text-right text-orange-400">
                      ฿{formatNumber(item.excessAmount)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-400">
                      ฿{formatNumber(item.layoffAmount)}
                    </TableCell>
                    <TableCell className="text-right text-slate-400">
                      ×{item.payRate}
                    </TableCell>
                    <TableCell className="text-right text-purple-400">
                      ฿{formatNumber(item.potentialPayout)}
                    </TableCell>
                    <TableCell>
                      {item.status === "PENDING" ? (
                        <Badge variant="warning">รอดำเนินการ</Badge>
                      ) : item.status === "EXPORTED" ? (
                        <Badge variant="default">ส่งออกแล้ว</Badge>
                      ) : (
                        <Badge variant="success">ส่งแล้ว</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        {/* Preview Text */}
        {selectedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>👁️ ตัวอย่างข้อความ</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 font-mono text-sm whitespace-pre-wrap text-slate-100">
                {generateLayoffText()}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการส่งตีออก</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-300">
              คุณกำลังจะทำเครื่องหมายว่าส่งแล้ว {selectedItems.length} รายการ
            </p>
            <div className="space-y-2">
              <Label>ส่งให้ (ถ้ามี)</Label>
              <Input
                placeholder="ชื่อเจ้ามือที่รับตีออก"
                value={sentTo}
                onChange={(e) => setSentTo(e.target.value)}
              />
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-slate-300">
                ยอดตีออกรวม:{" "}
                <span className="font-bold text-amber-400">
                  ฿
                  {formatNumber(
                    layoffItems
                      .filter((item) => selectedItems.includes(item.id))
                      .reduce((sum, item) => sum + item.layoffAmount, 0)
                  )}
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleMarkAsSent}>ยืนยัน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

