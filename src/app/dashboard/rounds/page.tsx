"use client";

import { useState, useEffect } from "react";
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
import { LOTTERY_TYPES, BET_TYPES, RESTRICTION_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

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
  type: string;
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
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch rounds on mount
  useEffect(() => {
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    try {
      const res = await fetch("/api/rounds");
      if (res.ok) {
        const data = await res.json();
        setRounds(data.rounds);
      }
    } catch (error) {
      console.error("Fetch rounds error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handle input change and parse numbers
  const handleNumbersInputChange = (value: string) => {
    setNumbersInput(value);
    setParsedNumbers(parseNumbers(value));
  };

  // ฟังก์ชันกลับเลข
  const reverseNumber = (num: string): string | null => {
    if (num.length < 2) return null;
    const reversed = num.split("").reverse().join("");
    return reversed !== num ? reversed : null;
  };

  // เพิ่มเลขกลับ
  const handleAddReversedNumbers = () => {
    const newNumbers = new Set(parsedNumbers);
    parsedNumbers.forEach((num) => {
      const reversed = reverseNumber(num);
      if (reversed) {
        newNumbers.add(reversed);
      }
    });
    const updatedNumbers = Array.from(newNumbers);
    setParsedNumbers(updatedNumbers);
    setNumbersInput(updatedNumbers.join(" "));
  };

  // Toggle bet type selection
  const toggleBetType = (betType: string) => {
    setSelectedBetTypes((prev) =>
      prev.includes(betType)
        ? prev.filter((t) => t !== betType)
        : [...prev, betType]
    );
  };

  const handleAddRestriction = () => {
    if (!selectedRound || parsedNumbers.length === 0 || selectedBetTypes.length === 0) return;

    // สร้าง restrictions จากทุกเลขและทุกประเภทที่เลือก
    const newRestrictions: Restriction[] = [];
    parsedNumbers.forEach((num) => {
      selectedBetTypes.forEach((betType) => {
        newRestrictions.push({
          number: num,
          betType,
          type: restrictionType,
          value: restrictionValue,
        });
      });
    });

    setRounds(
      rounds.map((r) =>
        r.id === selectedRound.id
          ? {
              ...r,
              restrictions: [...r.restrictions, ...newRestrictions],
            }
          : r
      )
    );
    setNumbersInput("");
    setParsedNumbers([]);
    setSelectedBetTypes(["TWO_TOP"]);
    setRestrictionType("BLOCKED");
    setRestrictionValue(undefined);
    setIsRestrictionDialogOpen(false);
  };

  const handleRemoveRestriction = (roundId: string, number: string, betType: string) => {
    setRounds(
      rounds.map((r) =>
        r.id === roundId
          ? {
              ...r,
              restrictions: r.restrictions.filter(
                (res) => !(res.number === number && res.betType === betType)
              ),
            }
          : r
      )
    );
  };

  // ล้างเลขอั้นทั้งหมดในงวดนั้น
  const handleClearAllRestrictions = (roundId: string) => {
    if (!confirm("ต้องการล้างเลขอั้นทั้งหมดในงวดนี้หรือไม่?")) return;
    
    setRounds(
      rounds.map((r) =>
        r.id === roundId
          ? { ...r, restrictions: [] }
          : r
      )
    );
  };

  const handleOpenRestrictionDialog = (round: Round) => {
    setSelectedRound(round);
    setIsRestrictionDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleOpenSettingsDialog = (lotteryKey: string) => {
    setSelectedLotteryForSettings(lotteryKey);
    setIsSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    // TODO: Save to API
    toast.success("บันทึกการตั้งค่าสำเร็จ!");
    setIsSettingsDialogOpen(false);
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
        fetchRounds();
        setIsCreateDialogOpen(false);
        setNewRoundLotteryType("");
        setNewRoundDate("");
      }
    } catch (error) {
      console.error("Create round error:", error);
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

      <div className="p-6 space-y-6">
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
                      {round && (
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
                            {round.restrictions.length > 0 && (
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
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-red-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                เลขอั้น ({round.restrictions?.length || 0} เลข)
                              </p>
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
                                {(round.restrictions || []).map((res, idx) => (
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
                                          res.type === "BLOCKED"
                                            ? "destructive"
                                            : res.type === "REDUCED_LIMIT"
                                            ? "warning"
                                            : "secondary"
                                        }
                                      >
                                        {RESTRICTION_TYPES[res.type as keyof typeof RESTRICTION_TYPES]?.name}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {res.type === "BLOCKED" ? (
                                        <span className="text-red-400">ปิดรับ</span>
                                      ) : res.type === "REDUCED_LIMIT" ? (
                                        <span>Limit: ฿{formatNumber(res.value || 0)}</span>
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
              {/* ปุ่มกลับเลข */}
              {parsedNumbers.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddReversedNumbers}
                  className="gap-2"
                >
                  🔄 กลับเลข
                </Button>
              )}
              {/* Preview */}
              {parsedNumbers.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-400 mb-2">
                    จะเพิ่ม {parsedNumbers.length} เลข:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parsedNumbers.map((num, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-slate-800 font-mono text-lg text-amber-400"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
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
              เพิ่มเลขอั้น ({parsedNumbers.length * selectedBetTypes.length} รายการ)
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
    </div>
  );
}

