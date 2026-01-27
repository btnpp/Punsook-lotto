"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, Send, FileText, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatNumber, formatCurrency, parseBulkBet, calculateNetAmount } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES, DEFAULT_PAY_RATES } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";

interface DiscountPreset {
  id: string;
  name: string;
  discount3Top: number;
  discount3Tod: number;
  discount2Top: number;
  discount2Bottom: number;
  discountRunTop: number;
  discountRunBottom: number;
  isFullPay: boolean;
  isDefault: boolean;
}

interface Agent {
  id: string;
  code: string;
  name: string;
  discounts: Array<{ lotteryType: string; discount: number }>;
  discountPresets: DiscountPreset[];
}

interface Round {
  id: string;
  lotteryType: { code: string; name: string };
  roundDate: string;
  status: string;
}

interface BetItem {
  id: string;
  number: string;
  betType: string;
  amount: number;
  discount: number;
  netAmount: number;
  payRate: number;
}

// ฟังก์ชันกลับเลข (reverse)
function reverseNumber(num: string): string {
  return num.split("").reverse().join("");
}

// ฟังก์ชันสร้าง permutations ทั้งหมด
function getPermutations(str: string): string[] {
  if (str.length <= 1) return [str];
  
  const result: string[] = [];
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remaining = str.slice(0, i) + str.slice(i + 1);
    const perms = getPermutations(remaining);
    
    for (const perm of perms) {
      result.push(char + perm);
    }
  }
  
  // Return unique values only
  return [...new Set(result)];
}

// ฟังก์ชันสร้างเลขกลับทั้งหมด
function getAllReversedNumbers(num: string): string[] {
  if (num.length === 2) {
    // 2 ตัว -> 2 กลับ (หรือ 1 ถ้าเลขซ้ำ เช่น 55)
    const reversed = reverseNumber(num);
    if (reversed === num) return [];
    return [reversed];
  } else if (num.length === 3) {
    // 3 ตัว -> 6 กลับ (หรือน้อยกว่าถ้าเลขซ้ำ)
    const perms = getPermutations(num);
    return perms.filter(p => p !== num);
  }
  return [];
}

export default function BetsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [selectedLottery, setSelectedLottery] = useState("THAI");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedBetTypes, setSelectedBetTypes] = useState<string[]>(["TWO_TOP"]);
  const [singleNumbers, setSingleNumbers] = useState(""); // รองรับหลายเลข คั่นด้วย , หรือ เว้นวรรค
  const [singleAmount, setSingleAmount] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [betItems, setBetItems] = useState<BetItem[]>([]);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [slipNote, setSlipNote] = useState(""); // หมายเหตุโพย

  // Fetch agents and rounds on mount
  useEffect(() => {
    Promise.all([fetchAgents(), fetchRounds()]).finally(() => setIsLoading(false));
  }, []);

  // Update selected round when lottery changes
  useEffect(() => {
    const openRound = rounds.find(r => r.lotteryType.code === selectedLottery && r.status === "OPEN");
    if (openRound) {
      setSelectedRoundId(openRound.id);
    }
  }, [selectedLottery, rounds]);

  // Auto-select default preset when agent changes
  useEffect(() => {
    if (selectedAgent) {
      const agentData = agents.find(a => a.id === selectedAgent);
      const presets = agentData?.discountPresets;
      if (presets && presets.length > 0) {
        const defaultPreset = presets.find(p => p.isDefault) || presets[0];
        setSelectedPresetId(defaultPreset.id);
      } else {
        setSelectedPresetId("");
      }
    } else {
      setSelectedPresetId("");
    }
  }, [selectedAgent, agents]);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents.filter((a: Agent) => a));
      }
    } catch (error) {
      console.error("Fetch agents error:", error);
    }
  };

  const fetchRounds = async () => {
    try {
      const res = await fetch("/api/rounds?status=OPEN");
      if (res.ok) {
        const data = await res.json();
        setRounds(data.rounds);
      }
    } catch (error) {
      console.error("Fetch rounds error:", error);
    }
  };

  // Helper to get preset by id
  const getSelectedPreset = (): DiscountPreset | null => {
    if (!selectedAgent || !selectedPresetId) return null;
    const agent = agents.find(a => a.id === selectedAgent);
    return agent?.discountPresets?.find(p => p.id === selectedPresetId) || null;
  };

  // Helper to get discount by bet type from selected preset
  const getDiscountByBetType = (betType: string): number => {
    const preset = getSelectedPreset();
    if (!preset || preset.isFullPay) return 0;
    
    switch (betType) {
      case "THREE_TOP": return preset.discount3Top;
      case "THREE_TOD": return preset.discount3Tod;
      case "TWO_TOP": return preset.discount2Top;
      case "TWO_BOTTOM": return preset.discount2Bottom;
      case "RUN_TOP": return preset.discountRunTop;
      case "RUN_BOTTOM": return preset.discountRunBottom;
      default: return 0;
    }
  };

  // Check if selected preset is full pay
  const isFullPay = (): boolean => {
    const preset = getSelectedPreset();
    return preset?.isFullPay || false;
  };

  // ฟังก์ชันแปลง input เป็นหลายเลข
  const parseMultipleNumbers = (input: string): string[] => {
    // แยกด้วย comma, space, หรือ newline
    const numbers = input
      .split(/[\s,\n]+/)
      .map((n) => n.trim().replace(/\D/g, ""))
      .filter((n) => n.length > 0);
    return [...new Set(numbers)]; // ลบเลขซ้ำ
  };

  // นับเลขที่ valid จาก input
  const getValidNumbersFromInput = (): string[] => {
    const numbers = parseMultipleNumbers(singleNumbers);
    return numbers.filter((n) => {
      // ตรวจสอบว่าเลขตรงกับประเภทที่เลือกอย่างน้อย 1 ประเภท
      return selectedBetTypes.some((betType) => {
        const betTypeInfo = BET_TYPES[betType as keyof typeof BET_TYPES];
        return n.length === betTypeInfo.digits;
      });
    });
  };

  const agent = agents.find((a) => a.id === selectedAgent);
  const selectedPreset = getSelectedPreset();

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
    const validNumbers = getValidNumbersFromInput();
    if (validNumbers.length === 0 || !singleAmount || !selectedAgent) return;

    const amount = parseFloat(singleAmount);
    const newBets: BetItem[] = [];

    // เพิ่มทุกเลขสำหรับทุกประเภทที่เลือก
    validNumbers.forEach((number, numIndex) => {
      selectedBetTypes.forEach((betType) => {
        const betTypeInfo = BET_TYPES[betType as keyof typeof BET_TYPES];
        // ตรวจสอบว่าเลขตรงกับประเภท
        if (number.length === betTypeInfo.digits) {
          const payRate = DEFAULT_PAY_RATES[selectedLottery as keyof typeof DEFAULT_PAY_RATES]?.[betType as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
          const discount = getDiscountByBetType(betType);
          const netAmount = calculateNetAmount(amount, discount);

          newBets.push({
            id: `${Date.now()}-${numIndex}-${betType}`,
            number,
            betType,
            amount,
            discount,
            netAmount,
            payRate,
          });
        }
      });
    });

    if (newBets.length > 0) {
      setBetItems([...betItems, ...newBets]);
      setSingleNumbers("");
      setSingleAmount("");
    }
  };

  // ฟังก์ชันกลับเลขและเพิ่มเข้า input (สร้าง permutations ทั้งหมด)
  const handleReverseNumbers = () => {
    const validNumbers = getValidNumbersFromInput();
    if (validNumbers.length === 0) return;

    const allNumbers = [...validNumbers];
    validNumbers.forEach((num) => {
      if (num.length >= 2) {
        const reversedNums = getAllReversedNumbers(num);
        reversedNums.forEach(reversed => {
          if (!allNumbers.includes(reversed)) {
            allNumbers.push(reversed);
          }
        });
      }
    });

    setSingleNumbers(allNumbers.join(", "));
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
          const discount = getDiscountByBetType(betType);
          
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

  const handleSubmit = async () => {
    if (!selectedAgent || !selectedRoundId || betItems.length === 0) {
      toast.warning("กรุณาเลือก Agent และเพิ่มรายการแทง");
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit all bets at once
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: selectedRoundId,
          agentId: selectedAgent,
          discountPresetId: selectedPresetId || undefined,
          isFullPay: isFullPay(),
          note: slipNote || undefined,
          userId: user?.id,
          bets: betItems.map(bet => ({
            number: bet.number,
            betType: bet.betType,
            amount: bet.amount,
          })),
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(`ส่งโพยสำเร็จ! จำนวน ${data.count} รายการ ยอดรวม ${formatCurrency(totalNetAmount)}`);
        setBetItems([]);
        setSlipNote(""); // Reset note
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถส่งโพยได้");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งโพย");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group bet types by digit count for better UX
  const threeDigitTypes = ["THREE_TOP", "THREE_TOD", "THREE_BOTTOM"];
  const twoDigitTypes = ["TWO_TOP", "TWO_BOTTOM"];
  const oneDigitTypes = ["RUN_TOP", "RUN_BOTTOM"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

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
                        {agents.map((agent) => (
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

                {/* Preset Selection */}
                {agent && agent.discountPresets?.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <Label>รูปแบบส่วนลด</Label>
                      <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรูปแบบส่วนลด" />
                        </SelectTrigger>
                        <SelectContent>
                          {agent.discountPresets.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              <span className="flex items-center gap-2">
                                {preset.isFullPay && <span>💰</span>}
                                {preset.isDefault && <span className="text-amber-400">★</span>}
                                <span>{preset.name}</span>
                                {!preset.isFullPay && (
                                  <span className="text-xs text-slate-400">
                                    ({preset.discount3Top}%/{preset.discount2Top}%/{preset.discountRunTop}%)
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Show selected preset info */}
                    {selectedPreset && (
                      <div className={`p-3 rounded-lg border ${
                        selectedPreset.isFullPay 
                          ? "bg-emerald-500/10 border-emerald-500/30" 
                          : "bg-amber-500/10 border-amber-500/30"
                      }`}>
                        {selectedPreset.isFullPay ? (
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-400">💰 จ่ายเต็ม</p>
                            <p className="text-xs text-slate-400">ไม่ลดส่วนลด และจ่ายรางวัลเต็มอัตราแม้ถูกเลขอั้น</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-6 gap-2 text-center text-xs">
                            <div>
                              <p className="text-slate-500">3บน</p>
                              <p className="text-amber-400 font-bold">{selectedPreset.discount3Top}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500">3โต๊ด</p>
                              <p className="text-amber-400 font-bold">{selectedPreset.discount3Tod}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500">2บน</p>
                              <p className="text-amber-400 font-bold">{selectedPreset.discount2Top}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500">2ล่าง</p>
                              <p className="text-amber-400 font-bold">{selectedPreset.discount2Bottom}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500">วิ่งบน</p>
                              <p className="text-amber-400 font-bold">{selectedPreset.discountRunTop}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500">วิ่งล่าง</p>
                              <p className="text-amber-400 font-bold">{selectedPreset.discountRunBottom}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                    {/* ช่องใส่เลข */}
                    <div className="space-y-2">
                      <Label>เลข (พิมพ์หลายเลขคั่นด้วย , หรือ เว้นวรรค)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder={`เช่น 12, 34, 56 หรือ 12 34 56`}
                          value={singleNumbers}
                          onChange={(e) => setSingleNumbers(e.target.value)}
                          className="text-lg font-mono tracking-wide flex-1"
                        />
                        {/* ปุ่มกลับเลข */}
                        <Button
                          variant="outline"
                          onClick={handleReverseNumbers}
                          disabled={getValidNumbersFromInput().length === 0}
                          title="เพิ่มเลขกลับ"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* แสดง Preview เลขที่พิมพ์ */}
                    {getValidNumbersFromInput().length > 0 && (
                      <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-slate-400">เลขที่จะเพิ่ม:</span>
                          {getValidNumbersFromInput().map((num) => (
                            <span
                              key={num}
                              className="px-2 py-1 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 font-mono font-bold text-amber-400"
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* จำนวนเงิน */}
                    <div className="space-y-2">
                      <Label>จำนวนเงิน (ต่อเลข)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={singleAmount}
                        onChange={(e) => setSingleAmount(e.target.value)}
                        className="text-2xl font-mono text-center"
                      />
                    </div>
                    
                    {/* Preview ยอดรวม */}
                    {getValidNumbersFromInput().length > 0 && singleAmount && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-300">ยอดรวม ({getValidNumbersFromInput().length} เลข × ฿{formatNumber(parseFloat(singleAmount) || 0)})</span>
                          <span className="font-bold text-emerald-400">
                            ฿{formatNumber(getValidNumbersFromInput().length * (parseFloat(singleAmount) || 0))}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleAddSingleBet}
                      disabled={getValidNumbersFromInput().length === 0 || !singleAmount || !selectedAgent}
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่มรายการ ({getValidNumbersFromInput().length} เลข)
                    </Button>
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
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {/* Group betItems by betType */}
                      {Object.entries(
                        betItems.reduce((groups, bet) => {
                          const key = bet.betType;
                          if (!groups[key]) groups[key] = [];
                          groups[key].push(bet);
                          return groups;
                        }, {} as Record<string, BetItem[]>)
                      ).map(([betType, bets]) => (
                        <div key={betType} className="space-y-1">
                          {/* Section Header */}
                          <div className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded-md">
                            <Badge variant="outline" className="text-amber-400 border-amber-400/50">
                              {BET_TYPES[betType as keyof typeof BET_TYPES]?.name || betType}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              ({bets.length} รายการ)
                            </span>
                          </div>
                          {/* Bets in this section */}
                          <div className="space-y-1 pl-2">
                            {bets.map((bet) => (
                              <div
                                key={bet.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 group"
                              >
                                <span className="text-lg font-mono font-bold text-amber-400">
                                  {bet.number}
                                </span>
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
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                                    onClick={() => handleRemoveBet(bet.id)}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                  </Button>
                                </div>
                              </div>
                            ))}
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
                        <span className="text-slate-400">ส่วนลด ({selectedPreset?.name || "-"})</span>
                        <span className="text-emerald-400">-฿{formatNumber(totalDiscount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-2">
                        <span className="text-slate-100">ยอดสุทธิ</span>
                        <span className="text-amber-400">฿{formatNumber(totalNetAmount)}</span>
                      </div>
                    </div>

                    {/* หมายเหตุโพย */}
                    <div className="space-y-2">
                      <Input
                        placeholder="หมายเหตุ (ถ้ามี) เช่น ลูกค้านายก, โพยโทรศัพท์..."
                        value={slipNote}
                        onChange={(e) => setSlipNote(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <Button className="w-full gap-2" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                      <Send className="w-4 h-4" />
                      {isSubmitting ? "กำลังส่ง..." : "ส่งโพย"}
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
                  <span className="text-slate-400">รูปแบบ</span>
                  <span className={selectedPreset?.isFullPay ? "text-emerald-400" : "text-amber-400"}>
                    {selectedPreset?.name || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
