"use client";

import { useState } from "react";
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
  Edit
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES, RESTRICTION_TYPES } from "@/lib/constants";

// Demo rounds data
const demoRounds = [
  {
    id: "1",
    lotteryType: "THAI",
    roundDate: new Date("2026-01-16"),
    status: "OPEN",
    closeTime: "14:30",
    restrictions: [
      { number: "25", betType: "TWO_TOP", type: "BLOCKED" },
      { number: "36", betType: "TWO_TOP", type: "REDUCED_LIMIT", value: 1000 },
      { number: "99", betType: "TWO_BOTTOM", type: "REDUCED_PAYOUT", value: 70 },
    ],
  },
  {
    id: "2",
    lotteryType: "LAO",
    roundDate: new Date("2026-01-06"),
    status: "OPEN",
    closeTime: "20:00",
    restrictions: [
      { number: "123", betType: "THREE_TOP", type: "BLOCKED" },
    ],
  },
  {
    id: "3",
    lotteryType: "HANOI",
    roundDate: new Date("2026-01-04"),
    status: "OPEN",
    closeTime: "18:00",
    restrictions: [],
  },
];

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

export default function RoundsPage() {
  const [rounds, setRounds] = useState(demoRounds);
  const [lotterySettings, setLotterySettings] = useState(defaultLotterySettings);
  const [selectedRound, setSelectedRound] = useState<typeof demoRounds[0] | null>(null);
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedLotteryForSettings, setSelectedLotteryForSettings] = useState<string | null>(null);
  
  const [newRestriction, setNewRestriction] = useState<Restriction>({
    number: "",
    betType: "TWO_TOP",
    type: "BLOCKED",
    value: undefined,
  });

  const handleAddRestriction = () => {
    if (!selectedRound || !newRestriction.number) return;

    setRounds(
      rounds.map((r) =>
        r.id === selectedRound.id
          ? {
              ...r,
              restrictions: [...r.restrictions, newRestriction],
            }
          : r
      )
    );
    setNewRestriction({ number: "", betType: "TWO_TOP", type: "BLOCKED", value: undefined });
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

  const handleOpenRestrictionDialog = (round: typeof demoRounds[0]) => {
    setSelectedRound(round);
    setIsRestrictionDialogOpen(true);
  };

  const handleOpenSettingsDialog = (lotteryKey: string) => {
    setSelectedLotteryForSettings(lotteryKey);
    setIsSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    // TODO: Save to API
    alert("บันทึกการตั้งค่าสำเร็จ!");
    setIsSettingsDialogOpen(false);
  };

  const handleToggleRoundStatus = (roundId: string) => {
    setRounds(
      rounds.map((r) =>
        r.id === roundId
          ? { ...r, status: r.status === "OPEN" ? "CLOSED" : "OPEN" }
          : r
      )
    );
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
                const round = rounds.find((r) => r.lotteryType === key && r.status === "OPEN");
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
                            <span>{round.roundDate.toLocaleDateString("th-TH")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">ปิดรับ</span>
                            <span className="text-amber-400">{round.closeTime} น.</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">เลขอั้น</span>
                            <span className="text-red-400">{round.restrictions.length} เลข</span>
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
              const lotteryRounds = rounds.filter((r) => r.lotteryType === lotteryKey);
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
                                งวด {round.roundDate.toLocaleDateString("th-TH")}
                              </p>
                              <p className="text-sm text-slate-400">
                                ปิดรับ {round.closeTime} น.
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
                          </div>
                        </div>

                        {/* Restrictions List */}
                        {round.restrictions.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              เลขอั้น ({round.restrictions.length} เลข)
                            </p>
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
                                {round.restrictions.map((res, idx) => (
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
              งวด {selectedRound?.roundDate.toLocaleDateString("th-TH")} -{" "}
              {LOTTERY_TYPES[selectedRound?.lotteryType as keyof typeof LOTTERY_TYPES]?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>เลขที่ต้องการอั้น</Label>
              <Input
                type="text"
                placeholder="กรอกเลข เช่น 25, 123"
                value={newRestriction.number}
                onChange={(e) =>
                  setNewRestriction({
                    ...newRestriction,
                    number: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="text-2xl font-mono text-center"
                maxLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label>ประเภทการแทง</Label>
              <Select
                value={newRestriction.betType}
                onValueChange={(value) =>
                  setNewRestriction({ ...newRestriction, betType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BET_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ประเภทการอั้น</Label>
              <Select
                value={newRestriction.type}
                onValueChange={(value) =>
                  setNewRestriction({ ...newRestriction, type: value })
                }
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

            {(newRestriction.type === "REDUCED_LIMIT" ||
              newRestriction.type === "REDUCED_PAYOUT") && (
              <div className="space-y-2">
                <Label>
                  {newRestriction.type === "REDUCED_LIMIT" ? "Limit ใหม่ (บาท)" : "อัตราจ่ายใหม่"}
                </Label>
                <Input
                  type="number"
                  placeholder={newRestriction.type === "REDUCED_LIMIT" ? "1000" : "70"}
                  value={newRestriction.value || ""}
                  onChange={(e) =>
                    setNewRestriction({
                      ...newRestriction,
                      value: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestrictionDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAddRestriction} disabled={!newRestriction.number}>
              เพิ่มเลขอั้น
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
    </div>
  );
}

