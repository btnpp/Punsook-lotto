"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Ban, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Trash2, 
  Settings,
  Lock,
  Unlock,
  Edit,
  Loader2
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { RoundsSkeleton } from "@/components/ui/skeleton";
import { LOTTERY_TYPES, BET_TYPES, RESTRICTION_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Round {
  id: string;
  lotteryTypeId: string;
  lotteryType: { code: string; name: string; closeTime: string };
  roundDate: string;
  status: string;
  restrictions: Restriction[];
}

// Lottery settings
const defaultLotterySettings = {
  THAI: {
    openTime: "00:00",
    closeTime: "14:30",
    drawDays: "1,16",
    isActive: true,
  },
  LAO: {
    openTime: "00:00",
    closeTime: "20:00",
    drawDays: "จันทร์,พุธ,ศุกร์",
    isActive: true,
  },
  HANOI: {
    openTime: "00:00",
    closeTime: "18:00",
    drawDays: "ทุกวัน",
    isActive: true,
  },
};

interface Restriction {
  number: string;
  betType: string;
  restrictionType: string;
  value?: number;
}

// ฟังก์ชันแยกเลขจาก input
function parseNumbers(input: string): string[] {
  // แยกด้วย , ; เว้นวรรค หรือขึ้นบรรทัดใหม่
  return input
    .split(/[,;\s\n]+/)
    .map((n) => n.trim().replace(/\D/g, ""))
    .filter((n) => n.length > 0);
}

export default function RoundsPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [lotteryTypes, setLotteryTypes] = useState<{ id: string; code: string; name: string }[]>([]);
  const [lotterySettings, setLotterySettings] = useState(defaultLotterySettings);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isEditRoundDialogOpen, setIsEditRoundDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLotteryForSettings, setSelectedLotteryForSettings] = useState<string | null>(null);
  const [editRoundDate, setEditRoundDate] = useState("");
  const [editCloseTime, setEditCloseTime] = useState("");
  const [newRoundLotteryType, setNewRoundLotteryType] = useState("");
  const [newRoundDate, setNewRoundDate] = useState("");
  const [restrictionFilter, setRestrictionFilter] = useState<string>("ALL");
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  // SWR for rounds and settings
  const { data: roundsData, isLoading: roundsLoading, mutate: mutateRounds } = useSWR<{ rounds: Round[] }>("/api/rounds");
  const { data: settingsData, isLoading: settingsLoading } = useSWR<{ lotteryTypes: Array<{ id: string; code: string; name: string; openTime?: string; closeTime?: string; drawDays?: string; isActive?: boolean }> }>("/api/settings");
  
  const isLoading = roundsLoading || settingsLoading;

  // Update local state when SWR data changes
  useEffect(() => {
    if (roundsData?.rounds) {
      setRounds(roundsData.rounds);
    }
  }, [roundsData]);

  useEffect(() => {
    if (settingsData?.lotteryTypes) {
      setLotteryTypes(settingsData.lotteryTypes.map((lt) => ({
        id: lt.id,
        code: lt.code,
        name: lt.name,
      })));
      
      const newSettings = { ...defaultLotterySettings };
      for (const lt of settingsData.lotteryTypes) {
        if (newSettings[lt.code as keyof typeof newSettings]) {
          newSettings[lt.code as keyof typeof newSettings] = {
            openTime: lt.openTime || "00:00",
            closeTime: lt.closeTime || "14:30",
            drawDays: lt.drawDays || "",
            isActive: lt.isActive ?? true,
          };
        }
      }
      setLotterySettings(newSettings);
    }
  }, [settingsData]);

  // Refetch helper for mutations
  const fetchRounds = () => mutateRounds();

  // Helper to get round by lottery type code
  const getRoundByLotteryCode = (code: string) => {
    return rounds.find(r => r.lotteryType.code === code && r.status === "OPEN");
  };

  // Helper to get rounds filtered by lottery code
  const getRoundsByLotteryCode = (code: string) => {
    return rounds.filter(r => r.lotteryType.code === code);
  };
  
  // รองรับหลายเลข
  const [numbersInput, setNumbersInput] = useState("");
  const [parsedNumbers, setParsedNumbers] = useState<string[]>([]);
  const [selectedBetTypes, setSelectedBetTypes] = useState<string[]>(["TWO_TOP"]);
  const [restrictionType, setRestrictionType] = useState("BLOCKED");
  const [restrictionValue, setRestrictionValue] = useState<number | undefined>(undefined);
  const [includeReversed, setIncludeReversed] = useState(true); // อั้นทั้งไปและกลับ

  // Handle input change and parse numbers
  const handleNumbersInputChange = (value: string) => {
    setNumbersInput(value);
    const parsed = parseNumbers(value);
    setParsedNumbers(parsed);
    
    // Auto-select bet types based on digit count
    if (parsed.length > 0) {
      const digitCounts = new Set(parsed.map((n) => n.length));
      const autoSelectedTypes: string[] = [];
      
      if (digitCounts.has(3)) {
        autoSelectedTypes.push("THREE_TOP", "THREE_TOD");
      }
      if (digitCounts.has(2)) {
        autoSelectedTypes.push("TWO_TOP", "TWO_BOTTOM");
      }
      if (digitCounts.has(1)) {
        autoSelectedTypes.push("RUN_TOP", "RUN_BOTTOM");
      }
      
      if (autoSelectedTypes.length > 0) {
        setSelectedBetTypes(autoSelectedTypes);
      }
    }
  };

  // ฟังก์ชันกลับเลข - ได้ทุก permutations
  const getAllPermutations = (str: string): string[] => {
    if (str.length <= 1) return [str];
    
    const result: Set<string> = new Set();
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const remaining = str.slice(0, i) + str.slice(i + 1);
      const perms = getAllPermutations(remaining);
      for (const perm of perms) {
        result.add(char + perm);
      }
    }
    
    return Array.from(result);
  };

  // Toggle bet type selection
  const toggleBetType = (betType: string) => {
    setSelectedBetTypes((prev) =>
      prev.includes(betType)
        ? prev.filter((t) => t !== betType)
        : [...prev, betType]
    );
  };

  const handleAddRestriction = async () => {
    if (!selectedRound || parsedNumbers.length === 0 || selectedBetTypes.length === 0) return;

    // รวบรวมเลขทั้งหมด (รวม permutations ถ้าติ๊กอั้นทั้งไปและกลับ)
    const allNumbers: Set<string> = new Set();
    parsedNumbers.forEach((num) => {
      if (includeReversed && num.length >= 2) {
        // เพิ่มทุก permutations
        const perms = getAllPermutations(num);
        perms.forEach((p) => allNumbers.add(p));
      } else {
        allNumbers.add(num);
      }
    });

    // Helper: ตรวจสอบว่า betType ตรงกับจำนวนหลักของเลขหรือไม่
    const isValidBetTypeForNumber = (num: string, betType: string): boolean => {
      const digits = num.length;
      if (digits === 3) {
        return ["THREE_TOP", "THREE_TOD", "THREE_BOTTOM"].includes(betType);
      } else if (digits === 2) {
        return ["TWO_TOP", "TWO_BOTTOM"].includes(betType);
      } else if (digits === 1) {
        return ["RUN_TOP", "RUN_BOTTOM"].includes(betType);
      }
      return false;
    };

    // สร้าง restrictions จากทุกเลขและทุกประเภทที่เลือก (filter ตามจำนวนหลัก)
    const newRestrictions: Restriction[] = [];
    allNumbers.forEach((num) => {
      selectedBetTypes.forEach((betType) => {
        // ตรวจสอบว่า betType ตรงกับจำนวนหลักของเลข
        if (!isValidBetTypeForNumber(num, betType)) return;
        
        // ตรวจสอบว่ามี restriction นี้อยู่แล้วหรือไม่
        const exists = selectedRound.restrictions?.some(
          (r) => r.number === num && r.betType === betType
        );
        if (!exists) {
          newRestrictions.push({
            number: num,
            betType,
            restrictionType: restrictionType,
            value: restrictionValue,
          });
        }
      });
    });

    if (newRestrictions.length === 0) {
      toast.error("ไม่มีเลขอั้นที่จะเพิ่ม");
      return;
    }

    // Save to database via API
    try {
      const res = await fetch(`/api/rounds/${selectedRound.id}/restrictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restrictions: newRestrictions }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถเพิ่มเลขอั้นได้");
        return;
      }

      // Refresh data from server
      mutateRounds();
      toast.success(`เพิ่มเลขอั้น ${newRestrictions.length} รายการสำเร็จ`);
      setNumbersInput("");
      setParsedNumbers([]);
      setSelectedBetTypes(["TWO_TOP"]);
      setRestrictionType("BLOCKED");
      setRestrictionValue(undefined);
      setIncludeReversed(true);
      setIsRestrictionDialogOpen(false);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มเลขอั้น");
    }
  };

  const handleRemoveRestriction = async (roundId: string, number: string, betType: string) => {
    try {
      const res = await fetch(
        `/api/rounds/${roundId}/restrictions?number=${encodeURIComponent(number)}&betType=${encodeURIComponent(betType)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถลบเลขอั้นได้");
        return;
      }

      // Refresh data from server
      mutateRounds();
      toast.success("ลบเลขอั้นสำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบเลขอั้น");
    }
  };

  // ล้างเลขอั้นทั้งหมดในงวดนั้น
  const handleClearAllRestrictions = async (roundId: string) => {
    const confirmed = await confirm({
      title: "ล้างเลขอั้นทั้งหมด",
      message: "ต้องการล้างเลขอั้นทั้งหมดในงวดนี้หรือไม่?",
      type: "warning",
      confirmText: "ล้างทั้งหมด",
      cancelText: "ยกเลิก",
    });
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/rounds/${roundId}/restrictions?clearAll=true`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถล้างเลขอั้นได้");
        return;
      }

      // Refresh data from server
      mutateRounds();
      toast.success("ล้างเลขอั้นทั้งหมดสำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการล้างเลขอั้น");
    }
  };

  const handleOpenRestrictionDialog = (round: Round) => {
    setSelectedRound(round);
    setIsRestrictionDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="งวดหวย / เลขอั้น" subtitle="จัดการงวดหวยและกำหนดเลขอั้น" />
        <RoundsSkeleton />
      </div>
    );
  }

  const handleOpenSettingsDialog = (lotteryKey: string) => {
    setSelectedLotteryForSettings(lotteryKey);
    setIsSettingsDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedLotteryForSettings) return;
    
    const settings = lotterySettings[selectedLotteryForSettings as keyof typeof lotterySettings];
    const lotteryType = lotteryTypes.find(lt => lt.code === selectedLotteryForSettings);
    
    if (!lotteryType) {
      toast.error("ไม่พบประเภทหวย");
      return;
    }

    try {
      const res = await fetch(`/api/lottery-types/${lotteryType.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openTime: settings.openTime,
          closeTime: settings.closeTime,
          drawDays: settings.drawDays,
          isActive: settings.isActive,
        }),
      });
      
      if (res.ok) {
        toast.success("บันทึกการตั้งค่าสำเร็จ!");
        setIsSettingsDialogOpen(false);
        fetchRounds(); // Refresh data
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถบันทึกได้");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleToggleRoundStatus = async (roundId: string) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round) return;

    const newStatus = round.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      const res = await fetch(`/api/rounds/${roundId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchRounds();
      }
    } catch (error) {
      console.error("Toggle status error:", error);
    }
  };

  const handleCreateRound = async () => {
    if (!newRoundLotteryType || !newRoundDate) return;

    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotteryTypeId: newRoundLotteryType,
          roundDate: newRoundDate,
        }),
      });
      if (res.ok) {
        toast.success("สร้างงวดหวยสำเร็จ!");
        fetchRounds();
        setIsCreateDialogOpen(false);
        setNewRoundLotteryType("");
        setNewRoundDate("");
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถสร้างงวดได้");
      }
    } catch (error) {
      console.error("Create round error:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างงวด");
    }
  };

  const handleOpenEditRoundDialog = (round: Round) => {
    setSelectedRound(round);
    // Format date for input type="date"
    const dateStr = new Date(round.roundDate).toISOString().split("T")[0];
    setEditRoundDate(dateStr);
    setEditCloseTime(round.lotteryType.closeTime);
    setIsEditRoundDialogOpen(true);
  };

  const handleSaveRoundChanges = async () => {
    if (!selectedRound || !editRoundDate) return;

    try {
      const res = await fetch(`/api/rounds/${selectedRound.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundDate: editRoundDate }),
      });
      if (res.ok) {
        fetchRounds();
        setIsEditRoundDialogOpen(false);
        setSelectedRound(null);
      }
    } catch (error) {
      console.error("Save round changes error:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="จัดการงวดหวย" subtitle="ตั้งค่างวดหวย เลขอั้น และเวลาเปิด-ปิด" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Tabs defaultValue="rounds" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rounds">งวดหวย & เลขอั้น</TabsTrigger>
            <TabsTrigger value="settings">ตั้งค่าเวลา</TabsTrigger>
          </TabsList>

          {/* Rounds Tab */}
          <TabsContent value="rounds" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => {
                const round = getRoundByLotteryCode(key);
                return (
                  <Card key={key} className={`${round ? "border-emerald-500/30" : "border-slate-700"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{lottery.flag}</span>
                          <span className="font-bold">{lottery.name}</span>
                        </div>
                        {round ? (
                          <Badge variant="success">เปิดรับ</Badge>
                        ) : (
                          <Badge variant="secondary">ปิด</Badge>
                        )}
                      </div>
                      {round ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">งวด</span>
                            <span>{new Date(round.roundDate).toLocaleDateString("th-TH")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">ปิดรับ</span>
                            <span className="text-amber-400">{round.lotteryType.closeTime} น.</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">เลขอั้น</span>
                            <span className="text-red-400">{round.restrictions?.length || 0} เลข</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-400 mb-3">ยังไม่มีงวดที่เปิดรับ</p>
                          <Button
                            size="sm"
                            onClick={() => {
                              const lt = lotteryTypes.find(l => l.code === key);
                              if (lt) {
                                setNewRoundLotteryType(lt.id);
                                setIsCreateDialogOpen(true);
                              }
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            สร้างงวดใหม่
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Rounds List */}
            {Object.entries(LOTTERY_TYPES).map(([lotteryKey, lottery]) => {
              const lotteryRounds = getRoundsByLotteryCode(lotteryKey);
              if (lotteryRounds.length === 0) return null;

              return (
                <Card key={lotteryKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{lottery.flag}</span>
                      {lottery.name}
                    </CardTitle>
                    <CardDescription>จัดการงวดและเลขอั้น</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lotteryRounds.map((round) => (
                      <div key={round.id} className="border border-slate-700 rounded-lg p-4">
                        {/* Round Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold text-lg">
                                งวด {new Date(round.roundDate).toLocaleDateString("th-TH")}
                              </p>
                              <p className="text-sm text-slate-400">
                                ปิดรับ {round.lotteryType.closeTime} น.
                              </p>
                            </div>
                            {round.status === "OPEN" ? (
                              <Badge variant="success">เปิดรับ</Badge>
                            ) : (
                              <Badge variant="secondary">ปิดรับ</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditRoundDialog(round)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              แก้ไขงวด
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleRoundStatus(round.id)}
                            >
                              {round.status === "OPEN" ? (
                                <>
                                  <Lock className="w-4 h-4 mr-1" />
                                  ปิดรับ
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 mr-1" />
                                  เปิดรับ
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenRestrictionDialog(round)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              เพิ่มเลขอั้น
                            </Button>
                            {(round.restrictions?.length || 0) > 0 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleClearAllRestrictions(round.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                ล้างทั้งหมด
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Restrictions List */}
                        {(round.restrictions?.length || 0) > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-sm font-medium text-red-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                เลขอั้น ({round.restrictions?.length || 0} เลข)
                              </p>
                              {/* Filter buttons */}
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  size="sm"
                                  variant={restrictionFilter === "ALL" ? "default" : "outline"}
                                  onClick={() => setRestrictionFilter("ALL")}
                                  className="h-6 px-2 text-xs"
                                >
                                  ทั้งหมด
                                </Button>
                                <Button
                                  size="sm"
                                  variant={restrictionFilter === "THREE_TOP" ? "default" : "outline"}
                                  onClick={() => setRestrictionFilter("THREE_TOP")}
                                  className="h-6 px-2 text-xs"
                                >
                                  3บน ({(round.restrictions || []).filter(r => r.betType === "THREE_TOP").length})
                                </Button>
                                <Button
                                  size="sm"
                                  variant={restrictionFilter === "THREE_TOD" ? "default" : "outline"}
                                  onClick={() => setRestrictionFilter("THREE_TOD")}
                                  className="h-6 px-2 text-xs"
                                >
                                  3โต๊ด ({(round.restrictions || []).filter(r => r.betType === "THREE_TOD").length})
                                </Button>
                                <Button
                                  size="sm"
                                  variant={restrictionFilter === "TWO_TOP" ? "default" : "outline"}
                                  onClick={() => setRestrictionFilter("TWO_TOP")}
                                  className="h-6 px-2 text-xs"
                                >
                                  2บน ({(round.restrictions || []).filter(r => r.betType === "TWO_TOP").length})
                                </Button>
                                <Button
                                  size="sm"
                                  variant={restrictionFilter === "TWO_BOTTOM" ? "default" : "outline"}
                                  onClick={() => setRestrictionFilter("TWO_BOTTOM")}
                                  className="h-6 px-2 text-xs"
                                >
                                  2ล่าง ({(round.restrictions || []).filter(r => r.betType === "TWO_BOTTOM").length})
                                </Button>
                                <Button
                                  size="sm"
                                  variant={restrictionFilter === "RUN_TOP" ? "default" : "outline"}
                                  onClick={() => setRestrictionFilter("RUN_TOP")}
                                  className="h-6 px-2 text-xs"
                                >
                                  วิ่งบน ({(round.restrictions || []).filter(r => r.betType === "RUN_TOP").length})
                                </Button>
                                <Button
                                  size="sm"
                                  variant={restrictionFilter === "RUN_BOTTOM" ? "default" : "outline"}
                                  onClick={() => setRestrictionFilter("RUN_BOTTOM")}
                                  className="h-6 px-2 text-xs"
                                >
                                  วิ่งล่าง ({(round.restrictions || []).filter(r => r.betType === "RUN_BOTTOM").length})
                                </Button>
                              </div>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>เลข</TableHead>
                                  <TableHead>ประเภท</TableHead>
                                  <TableHead>การอั้น</TableHead>
                                  <TableHead>ค่า</TableHead>
                                  <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(() => {
                                  const filtered = (round.restrictions || []).filter((res) => {
                                    if (restrictionFilter === "ALL") return true;
                                    return res.betType === restrictionFilter;
                                  });
                                  const isExpanded = expandedRounds.has(round.id);
                                  const displayCount = isExpanded ? filtered.length : 5;
                                  const displayItems = filtered.slice(0, displayCount);
                                  const hasMore = filtered.length > 5;
                                  
                                  return (
                                    <>
                                      {displayItems.map((res, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell>
                                            <span className="font-mono font-bold text-xl text-amber-400">
                                              {res.number}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="secondary">
                                              {BET_TYPES[res.betType as keyof typeof BET_TYPES]?.shortName}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              variant={
                                                res.restrictionType === "BLOCKED"
                                                  ? "destructive"
                                                  : res.restrictionType === "REDUCED_LIMIT"
                                                  ? "warning"
                                                  : res.restrictionType === "HALF_PAYOUT"
                                                  ? "warning"
                                                  : "secondary"
                                              }
                                            >
                                              {RESTRICTION_TYPES[res.restrictionType as keyof typeof RESTRICTION_TYPES]?.name}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            {res.restrictionType === "BLOCKED" ? (
                                              <span className="text-red-400">ปิดรับ</span>
                                            ) : res.restrictionType === "REDUCED_LIMIT" ? (
                                              <span>Limit: ฿{formatNumber(res.value || 0)}</span>
                                            ) : res.restrictionType === "HALF_PAYOUT" ? (
                                              <span className="text-amber-400">จ่ายครึ่งราคา</span>
                                            ) : (
                                              <span>จ่าย: ×{res.value}</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                handleRemoveRestriction(round.id, res.number, res.betType)
                                              }
                                            >
                                              <Trash2 className="w-4 h-4 text-red-400" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      {hasMore && (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center py-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const newSet = new Set(expandedRounds);
                                                if (isExpanded) {
                                                  newSet.delete(round.id);
                                                } else {
                                                  newSet.add(round.id);
                                                }
                                                setExpandedRounds(newSet);
                                              }}
                                              className="text-amber-400 hover:text-amber-300"
                                            >
                                              {isExpanded ? (
                                                <>ซ่อน</>
                                              ) : (
                                                <>ดูทั้งหมด ({filtered.length} รายการ)</>
                                              )}
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </>
                                  );
                                })()}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm py-4 text-center">
                            ไม่มีเลขอั้น
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  ตั้งค่าเวลาเปิด-ปิดรับแต่ละประเภท
                </CardTitle>
                <CardDescription>
                  กำหนดเวลาเปิด-ปิดรับและวันออกผลของหวยแต่ละประเภท
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => {
                    const settings = lotterySettings[key as keyof typeof lotterySettings];
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{lottery.flag}</span>
                          <div>
                            <p className="font-bold text-lg">{lottery.name}</p>
                            <div className="flex gap-4 text-sm text-slate-400">
                              <span>
                                เปิด: {settings.openTime} น.
                              </span>
                              <span>
                                ปิด: <span className="text-amber-400">{settings.closeTime} น.</span>
                              </span>
                              <span>
                                วันออก: {settings.drawDays}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">เปิดใช้งาน</span>
                            <Switch
                              checked={settings.isActive}
                              onCheckedChange={(checked) => {
                                setLotterySettings({
                                  ...lotterySettings,
                                  [key]: { ...settings, isActive: checked },
                                });
                              }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSettingsDialog(key)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            แก้ไข
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Reference */}
            <Card>
              <CardHeader>
                <CardTitle>📅 วันออกผลหวย</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🇹🇭</span>
                      <span className="font-bold">หวยไทย</span>
                    </div>
                    <p className="text-sm text-slate-400">วันที่ 1 และ 16 ของทุกเดือน</p>
                    <p className="text-amber-400 text-sm mt-1">ปิดรับ 14:30 น.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🇱🇦</span>
                      <span className="font-bold">หวยลาว</span>
                    </div>
                    <p className="text-sm text-slate-400">จันทร์ พุธ ศุกร์</p>
                    <p className="text-amber-400 text-sm mt-1">ปิดรับ 20:00 น.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🇻🇳</span>
                      <span className="font-bold">หวยฮานอย</span>
                    </div>
                    <p className="text-sm text-slate-400">ทุกวัน</p>
                    <p className="text-amber-400 text-sm mt-1">ปิดรับ 18:00 น.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Restriction Dialog */}
      <Dialog open={isRestrictionDialogOpen} onOpenChange={setIsRestrictionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              เพิ่มเลขอั้น
            </DialogTitle>
            <DialogDescription>
              งวด {selectedRound && new Date(selectedRound.roundDate).toLocaleDateString("th-TH")} -{" "}
              {selectedRound?.lotteryType.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>เลขที่ต้องการอั้น (ใส่ได้หลายเลข)</Label>
              <textarea
                placeholder="กรอกเลข คั่นด้วย , หรือเว้นวรรค หรือขึ้นบรรทัดใหม่&#10;ตัวอย่าง: 25, 36, 99"
                value={numbersInput}
                onChange={(e) => handleNumbersInputChange(e.target.value)}
                className="w-full min-h-[80px] p-3 rounded-lg bg-slate-800 border border-slate-700 text-lg font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              />
              {/* Checkbox อั้นทั้งไปและกลับ */}
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="includeReversed"
                  checked={includeReversed}
                  onCheckedChange={(checked) => setIncludeReversed(checked as boolean)}
                />
                <label htmlFor="includeReversed" className="text-sm text-slate-300 cursor-pointer">
                  🔄 อั้นทั้งไปและกลับ (รวม permutations ทั้งหมด)
                </label>
              </div>
              {/* Preview */}
              {parsedNumbers.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-400 mb-2">
                    เลขที่ใส่ ({parsedNumbers.length} เลข):
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {parsedNumbers.map((num, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-slate-800 font-mono text-lg text-amber-400"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                  {includeReversed && (
                    <p className="text-xs text-slate-400">
                      รวม permutations ทั้งหมด ~{" "}
                      {parsedNumbers.reduce((sum, num) => {
                        const perms = new Set(getAllPermutations(num));
                        return sum + perms.size;
                      }, 0)}{" "}
                      เลข
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>ประเภทการแทง (เลือกได้หลายประเภท)</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(BET_TYPES).map(([key, type]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={selectedBetTypes.includes(key) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleBetType(key)}
                    className={selectedBetTypes.includes(key) ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    {type.shortName}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                เลือก: {selectedBetTypes.map(t => BET_TYPES[t as keyof typeof BET_TYPES]?.shortName).join(", ") || "ยังไม่ได้เลือก"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>ประเภทการอั้น</Label>
              <Select
                value={restrictionType}
                onValueChange={setRestrictionType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESTRICTION_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{type.name}</span>
                        <span className="text-xs text-slate-400">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(restrictionType === "REDUCED_LIMIT" ||
              restrictionType === "REDUCED_PAYOUT") && (
              <div className="space-y-2">
                <Label>
                  {restrictionType === "REDUCED_LIMIT" ? "Limit ใหม่ (บาท)" : "อัตราจ่ายใหม่"}
                </Label>
                <Input
                  type="number"
                  placeholder={restrictionType === "REDUCED_LIMIT" ? "1000" : "70"}
                  value={restrictionValue || ""}
                  onChange={(e) => setRestrictionValue(parseFloat(e.target.value) || undefined)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestrictionDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddRestriction} 
              disabled={parsedNumbers.length === 0 || selectedBetTypes.length === 0}
            >
              เพิ่มเลขอั้น ({(() => {
                // คำนวณจำนวนที่ถูกต้อง - filter ตามจำนวนหลัก
                let count = 0;
                const numbersToCount = includeReversed
                  ? parsedNumbers.flatMap((num) => Array.from(new Set(getAllPermutations(num))))
                  : parsedNumbers;
                
                numbersToCount.forEach((num) => {
                  selectedBetTypes.forEach((betType) => {
                    const digits = num.length;
                    const isValid = 
                      (digits === 3 && ["THREE_TOP", "THREE_TOD", "THREE_BOTTOM"].includes(betType)) ||
                      (digits === 2 && ["TWO_TOP", "TWO_BOTTOM"].includes(betType)) ||
                      (digits === 1 && ["RUN_TOP", "RUN_BOTTOM"].includes(betType));
                    if (isValid) count++;
                  });
                });
                return count;
              })()} รายการ)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lottery Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              ตั้งค่า{" "}
              {selectedLotteryForSettings &&
                LOTTERY_TYPES[selectedLotteryForSettings as keyof typeof LOTTERY_TYPES]?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedLotteryForSettings && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เวลาเปิดรับ</Label>
                  <Input
                    type="time"
                    value={
                      lotterySettings[selectedLotteryForSettings as keyof typeof lotterySettings]
                        ?.openTime
                    }
                    onChange={(e) =>
                      setLotterySettings({
                        ...lotterySettings,
                        [selectedLotteryForSettings]: {
                          ...lotterySettings[
                            selectedLotteryForSettings as keyof typeof lotterySettings
                          ],
                          openTime: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>เวลาปิดรับ</Label>
                  <Input
                    type="time"
                    value={
                      lotterySettings[selectedLotteryForSettings as keyof typeof lotterySettings]
                        ?.closeTime
                    }
                    onChange={(e) =>
                      setLotterySettings({
                        ...lotterySettings,
                        [selectedLotteryForSettings]: {
                          ...lotterySettings[
                            selectedLotteryForSettings as keyof typeof lotterySettings
                          ],
                          closeTime: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>วันออกผล</Label>
                <Input
                  type="text"
                  value={
                    lotterySettings[selectedLotteryForSettings as keyof typeof lotterySettings]
                      ?.drawDays
                  }
                  onChange={(e) =>
                    setLotterySettings({
                      ...lotterySettings,
                      [selectedLotteryForSettings]: {
                        ...lotterySettings[
                          selectedLotteryForSettings as keyof typeof lotterySettings
                        ],
                        drawDays: e.target.value,
                      },
                    })
                  }
                  placeholder="เช่น 1,16 หรือ จันทร์,พุธ,ศุกร์"
                />
                <p className="text-xs text-slate-400">
                  ระบุวันที่หรือวันในสัปดาห์ คั่นด้วยเครื่องหมายจุลภาค
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveSettings}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Round Dialog */}
      <Dialog open={isEditRoundDialogOpen} onOpenChange={setIsEditRoundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              แก้ไขงวดหวย
            </DialogTitle>
            <DialogDescription>
              {selectedRound?.lotteryType.name}
              {" - "}งวดเดิม: {selectedRound && new Date(selectedRound.roundDate).toLocaleDateString("th-TH")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                สำหรับกรณีวันหยุด หรือเหตุการณ์พิเศษที่ต้องเลื่อนวันออกผล
              </p>
            </div>

            <div className="space-y-2">
              <Label>วันที่ออกผลใหม่</Label>
              <Input
                type="date"
                value={editRoundDate}
                onChange={(e) => setEditRoundDate(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>เวลาปิดรับ</Label>
              <Input
                type="time"
                value={editCloseTime}
                onChange={(e) => setEditCloseTime(e.target.value)}
              />
              <p className="text-xs text-slate-400">
                ปรับเวลาปิดรับหากต้องการเปลี่ยนแปลง
              </p>
            </div>

            {editRoundDate && selectedRound && (
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">สรุปการเปลี่ยนแปลง:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">วันเดิม:</span>
                    <span className="line-through text-red-400">
                      {new Date(selectedRound.roundDate).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">วันใหม่:</span>
                    <span className="text-emerald-400 font-bold">
                      {new Date(editRoundDate).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  {editCloseTime !== selectedRound.lotteryType.closeTime && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">ปิดรับ:</span>
                      <span className="line-through text-red-400">{selectedRound.lotteryType.closeTime}</span>
                      <span className="text-emerald-400">→ {editCloseTime} น.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoundDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveRoundChanges}>
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Round Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              สร้างงวดหวยใหม่
            </DialogTitle>
            <DialogDescription>
              เลือกประเภทหวยและวันที่ออกผล
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ประเภทหวย</Label>
              <Select value={newRoundLotteryType} onValueChange={setNewRoundLotteryType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทหวย" />
                </SelectTrigger>
                <SelectContent>
                  {lotteryTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {LOTTERY_TYPES[lt.code as keyof typeof LOTTERY_TYPES]?.flag} {lt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>วันที่ออกผล</Label>
              <Input
                type="date"
                value={newRoundDate}
                onChange={(e) => setNewRoundDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateRound} disabled={!newRoundLotteryType || !newRoundDate}>
              สร้างงวด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

