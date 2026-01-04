"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Trash2, Send, FileText, RefreshCw } from "lucide-react";
import { formatNumber, formatCurrency, parseBulkBet, calculateNetAmount } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES, DEFAULT_PAY_RATES } from "@/lib/constants";

// Demo agents
const demoAgents = [
  { id: "1", code: "A001", name: "นายสมชาย ใจดี", discount: { THAI: 15, LAO: 12, HANOI: 10 } },
  { id: "2", code: "A002", name: "นายวิชัย รวยมาก", discount: { THAI: 20, LAO: 15, HANOI: 12 } },
  { id: "3", code: "A003", name: "นายประสิทธิ์ ดีเลิศ", discount: { THAI: 18, LAO: 14, HANOI: 11 } },
];

interface BetItem {
  id: string;
  number: string;
  betType: string;
  amount: number;
  discount: number;
  netAmount: number;
  payRate: number;
}

// ฟังก์ชันกลับเลข
function reverseNumber(num: string): string {
  return num.split("").reverse().join("");
}

// ฟังก์ชันสร้างเลขกลับทั้งหมด (permutations for 3 digits)
function getReversedNumbers(num: string): string[] {
  const reversed = reverseNumber(num);
  if (reversed === num) return []; // ถ้าเลขเหมือนกัน ไม่ต้องเพิ่ม
  return [reversed];
}

export default function BetsPage() {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedLottery, setSelectedLottery] = useState("THAI");
  const [selectedBetTypes, setSelectedBetTypes] = useState<string[]>(["TWO_TOP"]);
  const [singleNumber, setSingleNumber] = useState("");
  const [singleAmount, setSingleAmount] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [betItems, setBetItems] = useState<BetItem[]>([]);
  const [mode, setMode] = useState<"single" | "bulk">("single");

  const agent = demoAgents.find((a) => a.id === selectedAgent);
  const discount = agent?.discount[selectedLottery as keyof typeof agent.discount] || 0;

  // Toggle bet type selection
  const toggleBetType = (betType: string) => {
    setSelectedBetTypes((prev) => {
      if (prev.includes(betType)) {
        // ต้องเหลืออย่างน้อย 1 ประเภท
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== betType);
      } else {
        return [...prev, betType];
      }
    });
  };

  // Get max digits from selected bet types
  const getMaxDigits = (): number => {
    const digitCounts = selectedBetTypes.map(
      (type) => BET_TYPES[type as keyof typeof BET_TYPES]?.digits || 2
    );
    return Math.max(...digitCounts);
  };

  const handleAddSingleBet = () => {
    if (!singleNumber || !singleAmount || !selectedAgent) return;

    const amount = parseFloat(singleAmount);
    const newBets: BetItem[] = [];

    // เพิ่มเลขสำหรับทุกประเภทที่เลือก
    selectedBetTypes.forEach((betType) => {
      const betTypeInfo = BET_TYPES[betType as keyof typeof BET_TYPES];
      // ตรวจสอบว่าเลขตรงกับประเภท
      if (singleNumber.length === betTypeInfo.digits) {
        const payRate = DEFAULT_PAY_RATES[selectedLottery as keyof typeof DEFAULT_PAY_RATES]?.[betType as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
        const netAmount = calculateNetAmount(amount, discount);

        newBets.push({
          id: `${Date.now()}-${betType}`,
          number: singleNumber,
          betType,
          amount,
          discount,
          netAmount,
          payRate,
        });
      }
    });

    if (newBets.length > 0) {
      setBetItems([...betItems, ...newBets]);
      setSingleNumber("");
      setSingleAmount("");
    }
  };

  // ฟังก์ชันกลับเลขและเพิ่มรายการ
  const handleReverseAndAdd = () => {
    if (!singleNumber || !singleAmount || !selectedAgent) return;
    if (singleNumber.length < 2) return;

    const reversedNum = reverseNumber(singleNumber);
    if (reversedNum === singleNumber) {
      alert("เลขนี้กลับแล้วเหมือนเดิม");
      return;
    }

    const amount = parseFloat(singleAmount);
    const newBets: BetItem[] = [];

    // เพิ่มเลขต้นฉบับ
    selectedBetTypes.forEach((betType) => {
      const betTypeInfo = BET_TYPES[betType as keyof typeof BET_TYPES];
      if (singleNumber.length === betTypeInfo.digits) {
        const payRate = DEFAULT_PAY_RATES[selectedLottery as keyof typeof DEFAULT_PAY_RATES]?.[betType as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
        const netAmount = calculateNetAmount(amount, discount);

        // เลขต้นฉบับ
        newBets.push({
          id: `${Date.now()}-${betType}-orig`,
          number: singleNumber,
          betType,
          amount,
          discount,
          netAmount,
          payRate,
        });

        // เลขกลับ
        newBets.push({
          id: `${Date.now()}-${betType}-rev`,
          number: reversedNum,
          betType,
          amount,
          discount,
          netAmount,
          payRate,
        });
      }
    });

    if (newBets.length > 0) {
      setBetItems([...betItems, ...newBets]);
      setSingleNumber("");
      setSingleAmount("");
    }
  };

  const handleParseBulk = () => {
    if (!bulkInput || !selectedAgent) return;

    const parsed = parseBulkBet(bulkInput);
    const newBets: BetItem[] = [];

    parsed.forEach((bet, index) => {
      selectedBetTypes.forEach((betType) => {
        const betTypeInfo = BET_TYPES[betType as keyof typeof BET_TYPES];
        if (bet.number.length === betTypeInfo.digits) {
          const payRate = DEFAULT_PAY_RATES[selectedLottery as keyof typeof DEFAULT_PAY_RATES]?.[betType as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
          
          newBets.push({
            id: `${Date.now()}-${index}-${betType}`,
            number: bet.number,
            betType,
            amount: bet.amount,
            discount,
            netAmount: calculateNetAmount(bet.amount, discount),
            payRate,
          });
        }
      });
    });

    setBetItems([...betItems, ...newBets]);
    setBulkInput("");
  };

  const handleRemoveBet = (id: string) => {
    setBetItems(betItems.filter((b) => b.id !== id));
  };

  const handleClearAll = () => {
    setBetItems([]);
  };

  const totalAmount = betItems.reduce((sum, b) => sum + b.amount, 0);
  const totalDiscount = betItems.reduce((sum, b) => sum + (b.amount - b.netAmount), 0);
  const totalNetAmount = betItems.reduce((sum, b) => sum + b.netAmount, 0);

  const handleSubmit = () => {
    // TODO: Submit to API
    alert(`ส่งโพยสำเร็จ!\nจำนวน ${betItems.length} รายการ\nยอดรวม ${formatCurrency(totalNetAmount)}`);
    setBetItems([]);
  };

  // Group bet types by digit count for better UX
  const threeDigitTypes = ["THREE_TOP", "THREE_TOD", "THREE_BOTTOM"];
  const twoDigitTypes = ["TWO_TOP", "TWO_BOTTOM"];
  const oneDigitTypes = ["RUN_TOP", "RUN_BOTTOM"];

  return (
    <div className="min-h-screen">
      <Header title="คีย์หวย" subtitle="คีย์โพยหวยสำหรับ Agent" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select Agent & Lottery */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>เลือก Agent</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือก Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {demoAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-amber-400">{agent.code}</span>
                              <span>{agent.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ประเภทหวย</Label>
                    <Select value={selectedLottery} onValueChange={setSelectedLottery}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <span>{lottery.flag}</span>
                              <span>{lottery.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {agent && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">ส่วนลด Agent นี้:</span>
                      <span className="text-lg font-bold text-amber-400">{discount}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bet Type Selection - Multi Select */}
            <Card>
              <CardContent className="p-6">
                <Label className="mb-4 block">ประเภทการแทง (เลือกได้หลายประเภท)</Label>
                
                {/* 3 ตัว */}
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-2">3 ตัว</p>
                  <div className="flex flex-wrap gap-2">
                    {threeDigitTypes.map((key) => {
                      const type = BET_TYPES[key as keyof typeof BET_TYPES];
                      const isSelected = selectedBetTypes.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleBetType(key)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {type.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2 ตัว */}
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-2">2 ตัว</p>
                  <div className="flex flex-wrap gap-2">
                    {twoDigitTypes.map((key) => {
                      const type = BET_TYPES[key as keyof typeof BET_TYPES];
                      const isSelected = selectedBetTypes.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleBetType(key)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {type.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* วิ่ง */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">วิ่ง</p>
                  <div className="flex flex-wrap gap-2">
                    {oneDigitTypes.map((key) => {
                      const type = BET_TYPES[key as keyof typeof BET_TYPES];
                      const isSelected = selectedBetTypes.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleBetType(key)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {type.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* แสดงประเภทที่เลือก */}
                {selectedBetTypes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-slate-400">เลือกแล้ว:</span>
                    {selectedBetTypes.map((type) => (
                      <Badge key={type} variant="default">
                        {BET_TYPES[type as keyof typeof BET_TYPES]?.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Input Mode */}
            <Card>
              <CardHeader>
                <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "bulk")}>
                  <TabsList>
                    <TabsTrigger value="single">คีย์เดี่ยว</TabsTrigger>
                    <TabsTrigger value="bulk">คีย์โพย</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {mode === "single" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>เลข</Label>
                        <Input
                          type="text"
                          placeholder={getMaxDigits() === 3 ? "xxx" : getMaxDigits() === 2 ? "xx" : "x"}
                          value={singleNumber}
                          onChange={(e) => setSingleNumber(e.target.value.replace(/\D/g, ""))}
                          className="text-2xl font-mono text-center tracking-widest"
                          maxLength={getMaxDigits()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>จำนวนเงิน</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={singleAmount}
                          onChange={(e) => setSingleAmount(e.target.value)}
                          className="text-2xl font-mono text-center"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-2"
                        onClick={handleAddSingleBet}
                        disabled={!singleNumber || !singleAmount || !selectedAgent}
                      >
                        <Plus className="w-4 h-4" />
                        เพิ่มรายการ
                      </Button>
                      
                      {/* ปุ่มกลับเลข */}
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleReverseAndAdd}
                        disabled={!singleNumber || !singleAmount || !selectedAgent || singleNumber.length < 2}
                        title="เพิ่มเลขกลับด้วย"
                      >
                        <RefreshCw className="w-4 h-4" />
                        กลับเลข
                      </Button>
                    </div>

                    {/* แสดงตัวอย่างเลขกลับ */}
                    {singleNumber.length >= 2 && (
                      <div className="p-3 rounded-lg bg-slate-800/50 text-sm">
                        <span className="text-slate-400">เลขกลับ: </span>
                        <span className="font-mono text-amber-400 text-lg">
                          {reverseNumber(singleNumber)}
                        </span>
                        {reverseNumber(singleNumber) === singleNumber && (
                          <span className="text-slate-500 ml-2">(เหมือนเดิม)</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>วางโพย (รูปแบบ: เลข=จำนวนเงิน)</Label>
                      <Textarea
                        placeholder={`ตัวอย่าง:\n12=100\n34=50\n56=200`}
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        className="font-mono min-h-[200px]"
                      />
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={handleParseBulk}
                      disabled={!bulkInput || !selectedAgent}
                    >
                      <FileText className="w-4 h-4" />
                      แปลงโพย
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Summary */}
          <div className="space-y-6">
            {/* Cart Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>รายการแทง</CardTitle>
                {betItems.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    ล้างทั้งหมด
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {betItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>ยังไม่มีรายการ</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {betItems.map((bet) => (
                        <div
                          key={bet.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-mono font-bold text-amber-400">
                              {bet.number}
                            </span>
                            <Badge variant="secondary">
                              {BET_TYPES[bet.betType as keyof typeof BET_TYPES]?.shortName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-100">
                                ฿{formatNumber(bet.amount)}
                              </p>
                              <p className="text-xs text-emerald-400">
                                สุทธิ ฿{formatNumber(bet.netAmount)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveBet(bet.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-slate-700 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">จำนวนรายการ</span>
                        <span className="text-slate-100">{betItems.length} รายการ</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">ยอดรวม</span>
                        <span className="text-slate-100">฿{formatNumber(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">ส่วนลด ({discount}%)</span>
                        <span className="text-emerald-400">-฿{formatNumber(totalDiscount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-2">
                        <span className="text-slate-100">ยอดสุทธิ</span>
                        <span className="text-amber-400">฿{formatNumber(totalNetAmount)}</span>
                      </div>
                    </div>

                    <Button className="w-full gap-2" size="lg" onClick={handleSubmit}>
                      <Send className="w-4 h-4" />
                      ส่งโพย
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ข้อมูลการแทง</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">ประเภทที่เลือก</span>
                  <span className="text-slate-100">
                    {selectedBetTypes.length} ประเภท
                  </span>
                </div>
                {selectedBetTypes.map((type) => {
                  const payRate = DEFAULT_PAY_RATES[selectedLottery as keyof typeof DEFAULT_PAY_RATES]?.[type as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
                  return (
                    <div key={type} className="flex justify-between pl-2 border-l-2 border-amber-500/30">
                      <span className="text-slate-400">
                        {BET_TYPES[type as keyof typeof BET_TYPES]?.name}
                      </span>
                      <span className="text-amber-400">×{payRate}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="text-slate-400">ส่วนลด</span>
                  <span className="text-emerald-400">{discount}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
