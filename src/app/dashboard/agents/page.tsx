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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Settings, Eye, DollarSign, Percent } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES, DEFAULT_PAY_RATES } from "@/lib/constants";

// Demo data
const demoAgents = [
  {
    id: "1",
    code: "A001",
    name: "นายสมชาย ใจดี",
    phone: "081-234-5678",
    isActive: true,
    discounts: { THAI: 15, LAO: 12, HANOI: 10 },
    // null = ใช้อัตราจ่ายกลาง
    customPayRates: null as Record<string, Record<string, number>> | null,
    totalBets: 285000,
    balance: 42500,
  },
  {
    id: "2",
    code: "A002",
    name: "นายวิชัย รวยมาก",
    phone: "089-876-5432",
    isActive: true,
    discounts: { THAI: 20, LAO: 15, HANOI: 12 },
    // อัตราจ่ายเฉพาะ
    customPayRates: {
      THAI: { THREE_TOP: 950, TWO_TOP: 95 },
    },
    totalBets: 458000,
    balance: -15000,
  },
  {
    id: "3",
    code: "A003",
    name: "นายประสิทธิ์ ดีเลิศ",
    phone: "062-345-6789",
    isActive: true,
    discounts: { THAI: 18, LAO: 14, HANOI: 11 },
    customPayRates: null,
    totalBets: 125000,
    balance: 28000,
  },
  {
    id: "4",
    code: "A004",
    name: "นายสุรศักดิ์ มั่งมี",
    phone: "095-111-2222",
    isActive: false,
    discounts: { THAI: 12, LAO: 10, HANOI: 8 },
    customPayRates: {
      THAI: { THREE_TOP: 880, THREE_TOD: 140, TWO_TOP: 88, TWO_BOTTOM: 88 },
      LAO: { TWO_TOP: 90 },
    },
    totalBets: 0,
    balance: 5000,
  },
];

type Agent = typeof demoAgents[0];

// สร้าง default pay rates object เปล่า
const createEmptyPayRates = () => {
  const rates: Record<string, Record<string, number | null>> = {};
  Object.keys(LOTTERY_TYPES).forEach((lotteryKey) => {
    rates[lotteryKey] = {};
    Object.keys(BET_TYPES).forEach((betKey) => {
      rates[lotteryKey][betKey] = null; // null = ใช้ค่ากลาง
    });
  });
  return rates;
};

export default function AgentsPage() {
  const [agents, setAgents] = useState(demoAgents);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    note: "",
  });
  const [discountData, setDiscountData] = useState({
    THAI: 15,
    LAO: 12,
    HANOI: 10,
  });
  const [payRateData, setPayRateData] = useState<Record<string, Record<string, number | null>>>(
    createEmptyPayRates()
  );
  const [selectedLottery, setSelectedLottery] = useState("THAI");

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAgent = () => {
    setSelectedAgent(null);
    setFormData({ name: "", phone: "", note: "" });
    setIsDialogOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      phone: agent.phone,
      note: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenSettings = (agent: Agent) => {
    setSelectedAgent(agent);
    setDiscountData(agent.discounts);
    
    // โหลด pay rate data
    const rates = createEmptyPayRates();
    if (agent.customPayRates) {
      Object.entries(agent.customPayRates).forEach(([lotteryKey, betRates]) => {
        Object.entries(betRates).forEach(([betKey, rate]) => {
          rates[lotteryKey][betKey] = rate;
        });
      });
    }
    setPayRateData(rates);
    setIsSettingsDialogOpen(true);
  };

  const handleSaveAgent = () => {
    if (selectedAgent) {
      setAgents(
        agents.map((a) =>
          a.id === selectedAgent.id
            ? { ...a, name: formData.name, phone: formData.phone }
            : a
        )
      );
    } else {
      const newCode = `A${String(agents.length + 1).padStart(3, "0")}`;
      setAgents([
        ...agents,
        {
          id: String(agents.length + 1),
          code: newCode,
          name: formData.name,
          phone: formData.phone,
          isActive: true,
          discounts: { THAI: 15, LAO: 12, HANOI: 10 },
          customPayRates: null,
          totalBets: 0,
          balance: 0,
        },
      ]);
    }
    setIsDialogOpen(false);
  };

  const handleSaveSettings = () => {
    if (selectedAgent) {
      // รวบรวม custom pay rates ที่ไม่ใช่ null
      const customRates: Record<string, Record<string, number>> = {};
      Object.entries(payRateData).forEach(([lotteryKey, betRates]) => {
        Object.entries(betRates).forEach(([betKey, rate]) => {
          if (rate !== null && rate > 0) {
            if (!customRates[lotteryKey]) {
              customRates[lotteryKey] = {};
            }
            customRates[lotteryKey][betKey] = rate;
          }
        });
      });

      setAgents(
        agents.map((a) =>
          a.id === selectedAgent.id
            ? {
                ...a,
                discounts: discountData,
                customPayRates: Object.keys(customRates).length > 0 ? customRates : null,
              }
            : a
        )
      );
    }
    setIsSettingsDialogOpen(false);
  };

  const handleToggleActive = (agentId: string) => {
    setAgents(
      agents.map((a) =>
        a.id === agentId ? { ...a, isActive: !a.isActive } : a
      )
    );
  };

  // ดึงอัตราจ่ายจริงของ Agent (ใช้ค่าเฉพาะหรือค่ากลาง)
  const getAgentPayRate = (agent: Agent, lotteryType: string, betType: string): number => {
    if (agent.customPayRates?.[lotteryType]?.[betType]) {
      return agent.customPayRates[lotteryType][betType];
    }
    return DEFAULT_PAY_RATES[lotteryType as keyof typeof DEFAULT_PAY_RATES]?.[
      betType as keyof typeof DEFAULT_PAY_RATES.THAI
    ] || 0;
  };

  // ตรวจสอบว่า Agent มีอัตราจ่ายเฉพาะหรือไม่
  const hasCustomPayRates = (agent: Agent): boolean => {
    return agent.customPayRates !== null && Object.keys(agent.customPayRates).length > 0;
  };

  return (
    <div className="min-h-screen">
      <Header title="จัดการ Agent" subtitle="เพิ่ม แก้ไข และจัดการข้อมูล Agent" />

      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="ค้นหา Agent..."
              icon={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAddAgent} className="gap-2">
            <Plus className="w-4 h-4" />
            เพิ่ม Agent ใหม่
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Agent ทั้งหมด</p>
                  <p className="text-2xl font-bold text-slate-100">{agents.length}</p>
                </div>
                <Badge variant="default">{agents.filter((a) => a.isActive).length} Active</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">ยอดแทงรวม</p>
                  <p className="text-2xl font-bold text-amber-400">
                    ฿{formatNumber(agents.reduce((sum, a) => sum + a.totalBets, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">ยอดคงค้าง</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ฿{formatNumber(agents.reduce((sum, a) => sum + a.balance, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายชื่อ Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>ส่วนลด</TableHead>
                  <TableHead>อัตราจ่าย</TableHead>
                  <TableHead className="text-right">ยอดแทง</TableHead>
                  <TableHead className="text-right">คงค้าง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id} className="table-row-hover">
                    <TableCell>
                      <span className="font-mono font-bold text-amber-400">
                        {agent.code}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="text-slate-400">{agent.phone}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          🇹🇭 {agent.discounts.THAI}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          🇱🇦 {agent.discounts.LAO}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          🇻🇳 {agent.discounts.HANOI}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasCustomPayRates(agent) ? (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          <DollarSign className="w-3 h-3 mr-1" />
                          กำหนดเอง
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400">
                          ใช้ค่ากลาง
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{formatNumber(agent.totalBets)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        agent.balance >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      ฿{formatNumber(agent.balance)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={agent.isActive}
                        onCheckedChange={() => handleToggleActive(agent.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenSettings(agent)}
                          title="ตั้งค่าส่วนลด & อัตราจ่าย"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditAgent(agent)}
                          title="แก้ไข"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="ดูรายละเอียด">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Agent Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAgent ? "แก้ไข Agent" : "เพิ่ม Agent ใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ Agent</Label>
              <Input
                id="name"
                placeholder="กรอกชื่อ Agent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทร</Label>
              <Input
                id="phone"
                placeholder="กรอกเบอร์โทร"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">หมายเหตุ</Label>
              <Input
                id="note"
                placeholder="หมายเหตุ (ถ้ามี)"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveAgent}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog (Discount + Pay Rates) */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              ตั้งค่า: {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription>
              กำหนดส่วนลดและอัตราจ่ายเฉพาะ Agent นี้
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="discount" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="discount" className="gap-2">
                <Percent className="w-4 h-4" />
                ส่วนลด
              </TabsTrigger>
              <TabsTrigger value="payrate" className="gap-2">
                <DollarSign className="w-4 h-4" />
                อัตราจ่าย
              </TabsTrigger>
            </TabsList>

            {/* Discount Tab */}
            <TabsContent value="discount" className="space-y-4 py-4">
              {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => (
                <div key={key} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="text-xl">{lottery.flag}</span>
                    {lottery.name}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discountData[key as keyof typeof discountData]}
                      onChange={(e) =>
                        setDiscountData({
                          ...discountData,
                          [key]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Pay Rate Tab */}
            <TabsContent value="payrate" className="space-y-4 py-4">
              {/* Info Box */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                <p className="text-amber-400 font-medium mb-1">💡 อัตราจ่ายเฉพาะ Agent</p>
                <p className="text-slate-400">
                  เว้นว่างหรือใส่ 0 เพื่อใช้อัตราจ่ายกลาง
                </p>
              </div>

              {/* Lottery Type Selector */}
              <div className="flex gap-2">
                {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => (
                  <Button
                    key={key}
                    variant={selectedLottery === key ? "default" : "outline"}
                    onClick={() => setSelectedLottery(key)}
                    className="gap-1"
                  >
                    <span>{lottery.flag}</span>
                    {lottery.name}
                  </Button>
                ))}
              </div>

              {/* Pay Rate Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(BET_TYPES).map(([betKey, betType]) => {
                  const defaultRate = DEFAULT_PAY_RATES[
                    selectedLottery as keyof typeof DEFAULT_PAY_RATES
                  ]?.[betKey as keyof typeof DEFAULT_PAY_RATES.THAI] || 0;
                  const customRate = payRateData[selectedLottery]?.[betKey];

                  return (
                    <div key={betKey} className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span>{betType.name}</span>
                        <span className="text-xs text-slate-500">
                          ค่ากลาง: ×{defaultRate}
                        </span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">×</span>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder={String(defaultRate)}
                          value={customRate || ""}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : null;
                            setPayRateData({
                              ...payRateData,
                              [selectedLottery]: {
                                ...payRateData[selectedLottery],
                                [betKey]: value,
                              },
                            });
                          }}
                          className={`font-mono ${customRate ? "border-amber-500" : ""}`}
                        />
                        {customRate && customRate > 0 && (
                          <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                            กำหนดเอง
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 rounded-lg bg-slate-800">
                <p className="text-sm text-slate-400 mb-2">สรุปอัตราจ่ายเฉพาะที่ตั้ง:</p>
                {Object.entries(payRateData).some(([_, betRates]) =>
                  Object.values(betRates).some((rate) => rate !== null && rate > 0)
                ) ? (
                  <div className="space-y-1">
                    {Object.entries(payRateData).map(([lotteryKey, betRates]) =>
                      Object.entries(betRates)
                        .filter(([_, rate]) => rate !== null && rate > 0)
                        .map(([betKey, rate]) => (
                          <div key={`${lotteryKey}-${betKey}`} className="flex items-center gap-2 text-sm">
                            <span>{LOTTERY_TYPES[lotteryKey as keyof typeof LOTTERY_TYPES]?.flag}</span>
                            <span>{BET_TYPES[betKey as keyof typeof BET_TYPES]?.name}:</span>
                            <span className="text-amber-400 font-mono">×{rate}</span>
                          </div>
                        ))
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">ไม่มี - ใช้อัตราจ่ายกลางทั้งหมด</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

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
