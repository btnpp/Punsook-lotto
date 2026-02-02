"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
import { BetsSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatNumber, formatCurrency, parseBulkBet, calculateNetAmount } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES, DEFAULT_PAY_RATES } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";

interface DiscountPreset {
  id: string;
  lotteryType: string;
  name: string;
  discount: number;
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
  const [mode, setMode] = useState<"quick" | "single" | "bulk">("quick");
  const [slipNote, setSlipNote] = useState(""); // หมายเหตุโพย
  
  // Quick mode states
  const [quickNumber, setQuickNumber] = useState("");
  const [quickAmountTop, setQuickAmountTop] = useState("");
  const [quickAmountTod, setQuickAmountTod] = useState("");
  const [quickAmountBottom, setQuickAmountBottom] = useState("");
  const [quickReverse, setQuickReverse] = useState(false);
  const [quickAutoClear, setQuickAutoClear] = useState(true); // ล้างยอดเงินอัตโนมัติ
  
  // Refs for auto-focus and Enter navigation
  const quickNumberInputRef = useRef<HTMLInputElement>(null);
  const quickAmountTopRef = useRef<HTMLInputElement>(null);
  const quickAmountTodRef = useRef<HTMLInputElement>(null);
  const quickAmountBottomRef = useRef<HTMLInputElement>(null);
  const quickAddButtonRef = useRef<HTMLButtonElement>(null);

  // SWR for agents and rounds
  interface AgentsResponse { agents: Agent[] }
  interface RoundsResponse { rounds: Round[] }
  const { data: agentsData, isLoading: agentsLoading } = useSWR<AgentsResponse>("/api/agents");
  const { data: roundsData, isLoading: roundsLoading } = useSWR<RoundsResponse>("/api/rounds?status=OPEN");
  
  const isLoading = agentsLoading || roundsLoading;

  useEffect(() => {
    if (agentsData?.agents) {
      setAgents(agentsData.agents.filter((a) => a));
    }
  }, [agentsData]);

  useEffect(() => {
    if (roundsData?.rounds) {
      setRounds(roundsData.rounds);
    }
  }, [roundsData]);

  // Update selected round when lottery changes
  useEffect(() => {
    const openRound = rounds.find(r => r.lotteryType.code === selectedLottery && r.status === "OPEN");
    if (openRound) {
      setSelectedRoundId(openRound.id);
    }
  }, [selectedLottery, rounds]);

  // Auto-select default preset when agent or lottery changes
  useEffect(() => {
    if (selectedAgent) {
      const agentData = agents.find(a => a.id === selectedAgent);
      // Filter presets by selected lottery type
      const presets = agentData?.discountPresets?.filter(p => p.lotteryType === selectedLottery);
      if (presets && presets.length > 0) {
        const defaultPreset = presets.find(p => p.isDefault) || presets[0];
        setSelectedPresetId(defaultPreset.id);
      } else {
        setSelectedPresetId("");
      }
    } else {
      setSelectedPresetId("");
    }
  }, [selectedAgent, selectedLottery, agents]);

  // Recalculate discounts when preset changes
  useEffect(() => {
    if (betItems.length === 0) return;
    
    // Get current discount from preset
    const agent = agents.find(a => a.id === selectedAgent);
    const preset = agent?.discountPresets?.find(p => p.id === selectedPresetId);
    const discount = preset && !preset.isFullPay ? preset.discount : 0;
    
    // Update all bet items with new discount
    setBetItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        discount,
        netAmount: calculateNetAmount(item.amount, discount),
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPresetId, selectedAgent]);

  // Helper to get preset by id
  const getSelectedPreset = (): DiscountPreset | null => {
    if (!selectedAgent || !selectedPresetId) return null;
    const agent = agents.find(a => a.id === selectedAgent);
    return agent?.discountPresets?.find(p => p.id === selectedPresetId) || null;
  };

  // Get presets for selected agent and lottery type
  const getPresetsForLottery = (): DiscountPreset[] => {
    if (!selectedAgent) return [];
    const agent = agents.find(a => a.id === selectedAgent);
    return agent?.discountPresets?.filter(p => p.lotteryType === selectedLottery) || [];
  };

  // Helper to get discount (same for all bet types now)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDiscountByBetType = (_betType: string): number => {
    const preset = getSelectedPreset();
    if (!preset || preset.isFullPay) return 0;
    return preset.discount;
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
      // รวมยอดเลขซ้ำ
      const updatedBets = [...betItems];
      let addedCount = 0;
      let mergedCount = 0;
      
      for (const newBet of newBets) {
        const existingIndex = updatedBets.findIndex(
          b => b.number === newBet.number && b.betType === newBet.betType
        );
        
        if (existingIndex >= 0) {
          // รวมยอดเลขซ้ำ
          updatedBets[existingIndex] = {
            ...updatedBets[existingIndex],
            amount: updatedBets[existingIndex].amount + newBet.amount,
            netAmount: updatedBets[existingIndex].netAmount + newBet.netAmount,
          };
          mergedCount++;
        } else {
          updatedBets.push(newBet);
          addedCount++;
        }
      }
      
      setBetItems(updatedBets);
      setSingleNumbers("");
      setSingleAmount("");
      
      if (mergedCount > 0 && addedCount > 0) {
        toast.success(`เพิ่ม ${addedCount} รายการ, รวมยอด ${mergedCount} รายการ`);
      } else if (mergedCount > 0) {
        toast.success(`รวมยอด ${mergedCount} รายการ`);
      } else {
        toast.success(`เพิ่ม ${addedCount} รายการ`);
      }
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
      // ถ้า bet มี betType ระบุมาแล้ว (จาก pattern พิเศษ) ให้ใช้เลย
      if (bet.betType) {
        const betType = bet.betType;
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
      } else {
        // ไม่มี betType → ใช้ selectedBetTypes ตามปกติ
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
      }
    });

    // รวมยอดเลขซ้ำ
    const updatedBets = [...betItems];
    let addedCount = 0;
    let mergedCount = 0;
    
    for (const newBet of newBets) {
      const existingIndex = updatedBets.findIndex(
        b => b.number === newBet.number && b.betType === newBet.betType
      );
      
      if (existingIndex >= 0) {
        // รวมยอดเลขซ้ำ
        updatedBets[existingIndex] = {
          ...updatedBets[existingIndex],
          amount: updatedBets[existingIndex].amount + newBet.amount,
          netAmount: updatedBets[existingIndex].netAmount + newBet.netAmount,
        };
        mergedCount++;
      } else {
        updatedBets.push(newBet);
        addedCount++;
      }
    }
    
    setBetItems(updatedBets);
    setBulkInput("");
    
    if (mergedCount > 0 && addedCount > 0) {
      toast.success(`เพิ่ม ${addedCount} รายการ, รวมยอด ${mergedCount} รายการ`);
    } else if (mergedCount > 0) {
      toast.success(`รวมยอด ${mergedCount} รายการ`);
    } else if (addedCount > 0) {
      toast.success(`เพิ่ม ${addedCount} รายการ`);
    }
  };

  const handleRemoveBet = (id: string) => {
    setBetItems(betItems.filter((b) => b.id !== id));
  };

  const handleRemoveByType = (betType: string) => {
    setBetItems(betItems.filter((b) => b.betType !== betType));
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

    // Optimistic update - clear immediately for better UX
    const itemsCount = betItems.length;
    const netAmount = totalNetAmount;
    const betsToSubmit = betItems.map(bet => ({
      number: bet.number,
      betType: bet.betType,
      amount: bet.amount,
    }));
    
    // Clear UI immediately (optimistic)
    setBetItems([]);
    setSlipNote("");
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
          bets: betsToSubmit,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(`ส่งโพยสำเร็จ! จำนวน ${data.count} รายการ ยอดรวม ${formatCurrency(netAmount)}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถส่งโพยได้");
        // Could restore betItems here if needed, but usually not worth it
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
      <div className="min-h-screen">
        <Header title="คีย์หวย" subtitle="บันทึกการรับแทงหวย" />
        <BetsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="คีย์หวย" subtitle="คีย์โพยหวยสำหรับ Agent" />

      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Select Agent & Lottery */}
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
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
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedLottery(key)}
                          className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                            selectedLottery === key
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          <span>{lottery.flag}</span>
                          <span className="text-sm">{lottery.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preset Selection - filtered by selected lottery */}
                {agent && getPresetsForLottery().length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <Label>รูปแบบส่วนลด ({LOTTERY_TYPES[selectedLottery as keyof typeof LOTTERY_TYPES]?.name})</Label>
                      <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรูปแบบส่วนลด" />
                        </SelectTrigger>
                        <SelectContent>
                          {getPresetsForLottery().map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              <span className="flex items-center gap-2">
                                {preset.isFullPay && <span>💰</span>}
                                {preset.isDefault && <span className="text-amber-400">★</span>}
                                <span>{preset.name}</span>
                                {preset.isFullPay ? (
                                  <span className="text-xs text-slate-400">
                                    (ไม่ลด %)
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    (ลด {preset.discount}%)
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
                          <div className="text-center">
                            <p className="text-3xl font-bold text-amber-400">ลด {selectedPreset.discount}%</p>
                            <p className="text-xs text-slate-400 mt-1">ส่วนลดสำหรับทุกประเภทการแทง</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bet Type Selection removed - now auto-determined by digit count and amount fields */}

            {/* Input Mode */}
            <Card>
              <CardHeader>
                <Tabs value={mode} onValueChange={(v) => setMode(v as "quick" | "single" | "bulk")}>
                  <TabsList>
                    <TabsTrigger value="quick">คีย์ด่วน</TabsTrigger>
                    <TabsTrigger value="single">คีย์เดี่ยว</TabsTrigger>
                    <TabsTrigger value="bulk">คีย์โพย</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {/* Quick Mode - แบบใส่เลขแล้วเลือกบน/โต๊ด/ล่าง */}
                {mode === "quick" && (
                  <div className="space-y-4">
                    {/* Toggle ล้างยอดเงินอัตโนมัติ */}
                    <div className="flex items-center gap-3">
                      <Switch
                        id="quickAutoClear"
                        checked={quickAutoClear}
                        onCheckedChange={setQuickAutoClear}
                      />
                      <Label htmlFor="quickAutoClear" className="cursor-pointer text-sm text-slate-300">
                        ล้างยอดเงินอัตโนมัติ หลังเพิ่มรายการ
                      </Label>
                    </div>

                    {/* ช่องใส่เลขและจำนวนเงิน - อยู่แถวเดียวกัน ความกว้างเท่ากัน */}
                    <div className="grid grid-cols-4 gap-3">
                      {/* เลข */}
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400 text-center block">🔢 เลข</Label>
                        <Input
                          ref={quickNumberInputRef}
                          type="text"
                          placeholder="123"
                          value={quickNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            if (val.length <= 3) {
                              setQuickNumber(val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              quickAmountTopRef.current?.focus();
                            }
                          }}
                          className="text-2xl font-mono text-center tracking-widest h-12"
                          maxLength={3}
                        />
                      </div>
                      
                      {/* บน */}
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400 text-center block">บน</Label>
                        <Input
                          ref={quickAmountTopRef}
                          type="number"
                          placeholder="0"
                          value={quickAmountTop}
                          onChange={(e) => setQuickAmountTop(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              // ถ้าเลข 3 ตัว → ไปโต๊ด, ถ้า 2 ตัว → ไปล่าง
                              if (quickNumber.length === 3) {
                                quickAmountTodRef.current?.focus();
                              } else if (quickNumber.length >= 2) {
                                quickAmountBottomRef.current?.focus();
                              }
                            }
                          }}
                          className="text-lg font-mono text-center h-12"
                        />
                      </div>
                      
                      {/* โต๊ด */}
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400 text-center block">โต๊ด</Label>
                        <Input
                          ref={quickAmountTodRef}
                          type="number"
                          placeholder="0"
                          value={quickAmountTod}
                          onChange={(e) => setQuickAmountTod(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              quickAmountBottomRef.current?.focus();
                            }
                          }}
                          className="text-lg font-mono text-center h-12"
                          disabled={quickNumber.length !== 3}
                        />
                      </div>
                      
                      {/* ล่าง */}
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400 text-center block">ล่าง</Label>
                        <Input
                          ref={quickAmountBottomRef}
                          type="number"
                          placeholder="0"
                          value={quickAmountBottom}
                          onChange={(e) => setQuickAmountBottom(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              // กด Enter ที่ช่องล่าง → กดปุ่มเพิ่มรายการ
                              quickAddButtonRef.current?.click();
                            }
                          }}
                          className="text-lg font-mono text-center h-12"
                          disabled={quickNumber.length === 1}
                        />
                      </div>
                    </div>

                    {/* Toggle กลับเลข */}
                    {quickNumber.length >= 2 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <Switch
                          id="quickReverse"
                          checked={quickReverse}
                          onCheckedChange={setQuickReverse}
                        />
                        <Label htmlFor="quickReverse" className="cursor-pointer">
                          {quickNumber.length === 2 ? "2กลับ" : "6กลับ"} (เพิ่มเลขกลับอัตโนมัติ)
                        </Label>
                      </div>
                    )}

                    {/* Preview */}
                    {quickNumber && (parseFloat(quickAmountTop) > 0 || parseFloat(quickAmountTod) > 0 || parseFloat(quickAmountBottom) > 0) && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="space-y-1 text-sm">
                          {parseFloat(quickAmountTop) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                {quickNumber.length === 3 ? "3ตัวบน" : quickNumber.length === 2 ? "2ตัวบน" : "วิ่งบน"}
                                {quickReverse && quickNumber.length >= 2 && ` (${quickNumber.length === 2 ? 2 : 6} เลข)`}
                              </span>
                              <span className="font-bold text-amber-400">฿{formatNumber(parseFloat(quickAmountTop) * (quickReverse && quickNumber.length >= 2 ? (quickNumber.length === 2 ? 2 : 6) : 1))}</span>
                            </div>
                          )}
                          {parseFloat(quickAmountTod) > 0 && quickNumber.length === 3 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">3ตัวโต๊ด</span>
                              <span className="font-bold text-amber-400">฿{formatNumber(parseFloat(quickAmountTod))}</span>
                            </div>
                          )}
                          {parseFloat(quickAmountBottom) > 0 && quickNumber.length >= 2 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                {quickNumber.length === 3 ? "3ตัวล่าง" : "2ตัวล่าง"}
                                {quickReverse && quickNumber.length === 2 && " (2 เลข)"}
                              </span>
                              <span className="font-bold text-amber-400">฿{formatNumber(parseFloat(quickAmountBottom) * (quickReverse && quickNumber.length === 2 ? 2 : 1))}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ปุ่มเพิ่มรายการ */}
                    <Button
                      ref={quickAddButtonRef}
                      onClick={() => {
                        if (!quickNumber) return;
                        
                        const newBets: BetItem[] = [];
                        const numbers = [quickNumber];
                        
                        // ถ้าเลือกกลับเลข
                        if (quickReverse && quickNumber.length >= 2) {
                          const reversed = getAllReversedNumbers(quickNumber);
                          numbers.push(...reversed);
                        }
                        
                        let itemIndex = 0;
                        for (const num of numbers) {
                          // บน
                          if (parseFloat(quickAmountTop) > 0) {
                            const betType = num.length === 3 ? "THREE_TOP" : num.length === 2 ? "TWO_TOP" : "RUN_TOP";
                            const payRate = DEFAULT_PAY_RATES[selectedLottery as keyof typeof DEFAULT_PAY_RATES]?.[betType as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
                            const discount = getDiscountByBetType(betType);
                            const amount = parseFloat(quickAmountTop);
                            newBets.push({
                              id: `${Date.now()}-${itemIndex++}-${betType}`,
                              number: num,
                              betType,
                              amount,
                              discount,
                              netAmount: calculateNetAmount(amount, discount),
                              payRate,
                            });
                          }
                          
                          // ล่าง (ไม่รวม 1 ตัว)
                          if (parseFloat(quickAmountBottom) > 0 && num.length >= 2) {
                            const betType = num.length === 3 ? "THREE_BOTTOM" : "TWO_BOTTOM";
                            const payRate = DEFAULT_PAY_RATES[selectedLottery as keyof typeof DEFAULT_PAY_RATES]?.[betType as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
                            const discount = getDiscountByBetType(betType);
                            const amount = parseFloat(quickAmountBottom);
                            newBets.push({
                              id: `${Date.now()}-${itemIndex++}-${betType}`,
                              number: num,
                              betType,
                              amount,
                              discount,
                              netAmount: calculateNetAmount(amount, discount),
                              payRate,
                            });
                          }
                        }
                        
                        // โต๊ด (แค่เลขแรก ไม่ต้องกลับ)
                        if (parseFloat(quickAmountTod) > 0 && quickNumber.length === 3) {
                          const betType = "THREE_TOD";
                          const payRate = DEFAULT_PAY_RATES[selectedLottery as keyof typeof DEFAULT_PAY_RATES]?.[betType as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
                          const discount = getDiscountByBetType(betType);
                          const amount = parseFloat(quickAmountTod);
                          newBets.push({
                            id: `${Date.now()}-${itemIndex++}-${betType}`,
                            number: quickNumber,
                            betType,
                            amount,
                            discount,
                            netAmount: calculateNetAmount(amount, discount),
                            payRate,
                          });
                        }
                        
// รวมยอดเลขซ้ำ
                                        const updatedBets = [...betItems];
                                        let addedCount = 0;
                                        let mergedCount = 0;
                                        
                                        for (const newBet of newBets) {
                                          const existingIndex = updatedBets.findIndex(
                                            b => b.number === newBet.number && b.betType === newBet.betType
                                          );
                                          
                                          if (existingIndex >= 0) {
                                            // รวมยอดเลขซ้ำ
                                            updatedBets[existingIndex] = {
                                              ...updatedBets[existingIndex],
                                              amount: updatedBets[existingIndex].amount + newBet.amount,
                                              netAmount: updatedBets[existingIndex].netAmount + newBet.netAmount,
                                            };
                                            mergedCount++;
                                          } else {
                                            updatedBets.push(newBet);
                                            addedCount++;
                                          }
                                        }
                                        
                                        setBetItems(updatedBets);
                                        
                                        if (mergedCount > 0 && addedCount > 0) {
                                          toast.success(`เพิ่ม ${addedCount} รายการ, รวมยอด ${mergedCount} รายการ`);
                                        } else if (mergedCount > 0) {
                                          toast.success(`รวมยอด ${mergedCount} รายการ`);
                                        } else if (addedCount > 0) {
                                          toast.success(`เพิ่ม ${addedCount} รายการ`);
                                        }
                        
                        // Reset and focus back to number input
                        setQuickNumber(""); // ล้างเลขเสมอ
                        
                        // ล้างยอดเงินเฉพาะเมื่อติ๊ก "ล้างยอดเงินอัตโนมัติ"
                        if (quickAutoClear) {
                          setQuickAmountTop("");
                          setQuickAmountTod("");
                          setQuickAmountBottom("");
                        }
                        
                        // Auto-focus back to number input
                        setTimeout(() => {
                          quickNumberInputRef.current?.focus();
                        }, 50);
                        setQuickReverse(false);
                      }}
                      disabled={!quickNumber || (parseFloat(quickAmountTop) <= 0 && parseFloat(quickAmountTod) <= 0 && parseFloat(quickAmountBottom) <= 0)}
                      className="w-full h-12 text-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      เพิ่มรายการ
                    </Button>
                  </div>
                )}

                {/* Single Mode - คีย์เดี่ยว */}
                {mode === "single" && (
                  <div className="space-y-4">
                    {/* ช่องใส่เลข + ปุ่มกลับเลข + ประเภทการแทง */}
                    <div className="space-y-2">
                      <Label>เลข (พิมพ์หลายเลขคั่นด้วย , หรือ เว้นวรรค)</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="text"
                          placeholder={`เช่น 12, 34, 56 หรือ 1`}
                          value={singleNumbers}
                          onChange={(e) => setSingleNumbers(e.target.value)}
                          className="text-lg font-mono tracking-wide flex-1 min-w-[120px]"
                        />
                        {/* ปุ่มกลับเลข */}
                        <Button
                          variant="outline"
                          onClick={handleReverseNumbers}
                          disabled={getValidNumbersFromInput().length === 0}
                          title="เพิ่มเลขกลับ"
                          className="shrink-0"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        {/* ประเภทการแทง - กดเลือกได้หลายตัว */}
                        {[
                          { key: "THREE_TOP", label: "3บ" },
                          { key: "THREE_TOD", label: "3ด" },
                          { key: "THREE_BOTTOM", label: "3ล" },
                          { key: "TWO_TOP", label: "2บ" },
                          { key: "TWO_BOTTOM", label: "2ล" },
                          { key: "RUN_TOP", label: "วบ" },
                          { key: "RUN_BOTTOM", label: "วล" },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => toggleBetType(key)}
                            className={`px-2 py-1.5 rounded text-xs font-medium transition-all shrink-0 ${
                              selectedBetTypes.includes(key)
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
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
                )}

                {mode === "bulk" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>วางโพย (รูปแบบ: เลข=จำนวนเงิน)</Label>
                      <Textarea
                        placeholder={`ตัวอย่าง:\n123=100\n12=100\n123=100x50\n123=100x50x30\n123/\n\nหรือแบบมีหัว:\nบน\n289=350×350\n289×6ตัวล่ะ50\n800×3ตัวล่ะ200`}
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
                          <div className="flex items-center justify-between px-2 py-1 bg-slate-700/50 rounded-md">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-amber-400 border-amber-400/50">
                                {BET_TYPES[betType as keyof typeof BET_TYPES]?.name || betType}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                ({bets.length} รายการ)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              onClick={() => handleRemoveByType(betType)}
                              title={`ลบ ${BET_TYPES[betType as keyof typeof BET_TYPES]?.name} ทั้งหมด`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
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
