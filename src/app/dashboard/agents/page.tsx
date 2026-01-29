"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AgentsSkeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Settings, DollarSign, Percent, Trash2, Tag, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatNumber } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { LOTTERY_TYPES, BET_TYPES, DEFAULT_PAY_RATES } from "@/lib/constants";

interface AgentDiscount {
  id: string;
  lotteryType: string;
  discount: number;
}

interface DiscountPreset {
  id: string;
  agentId: string;
  lotteryType: string;
  name: string;
  discount: number;
  isFullPay: boolean;
  isDefault: boolean;
  isActive: boolean;
  payRates?: Record<string, number> | null;
}

interface Agent {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  note: string | null;
  isActive: boolean;
  discounts: AgentDiscount[];
  discountPresets: DiscountPreset[];
  customPayRates: Record<string, Record<string, number>> | null;
  totalBets?: number;
  balance?: number;
}

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
  const toast = useToast();
  const { confirm } = useConfirm();
  
  // Use SWR for data fetching with caching
  const { data: agentsData, isLoading, mutate } = useSWR<{ agents: Agent[] }>(
    "/api/agents",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );
  const agents = agentsData?.agents || [];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  const [presets, setPresets] = useState<DiscountPreset[]>([]);
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetDiscount, setEditingPresetDiscount] = useState<number>(0);
  const [selectedPresetLottery, setSelectedPresetLottery] = useState("THAI");
  const [newPresetData, setNewPresetData] = useState<{
    lotteryType: string;
    name: string;
    discount: number;
    isDefault: boolean;
    payRates: Record<string, number | undefined>;
  }>({
    lotteryType: "THAI",
    name: "",
    discount: 0,
    isDefault: false,
    payRates: {},
  });
  const [showPayRatesForm, setShowPayRatesForm] = useState(false);

  // Helper to get discount value from agent
  const getAgentDiscounts = (agent: Agent): { THAI: number; LAO: number; HANOI: number } => {
    const discounts = { THAI: 0, LAO: 0, HANOI: 0 };
    if (agent.discounts) {
      for (const d of agent.discounts) {
        if (d.lotteryType === "THAI") discounts.THAI = d.discount;
        if (d.lotteryType === "LAO") discounts.LAO = d.discount;
        if (d.lotteryType === "HANOI") discounts.HANOI = d.discount;
      }
    }
    return discounts;
  };

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
      phone: agent.phone || "",
      note: agent.note || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenSettings = async (agent: Agent) => {
    setSelectedAgent(agent);
    setDiscountData(getAgentDiscounts(agent));
    
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
    
    // โหลด presets
    setPresets(agent.discountPresets || []);
    setIsAddingPreset(false);
    setEditingPresetId(null);
    setEditingPresetDiscount(0);
    setSelectedPresetLottery("THAI");
    setNewPresetData({
      lotteryType: "THAI",
      name: "",
      discount: 0,
      isDefault: false,
      payRates: {},
    });
    setShowPayRatesForm(false);
    
    setIsSettingsDialogOpen(true);
  };

  const handleAddPreset = async () => {
    if (!selectedAgent || !newPresetData.name) return;
    
    setIsSaving(true);
    try {
      // กรอง payRates ที่มีค่าจริงๆ
      const filteredPayRates = Object.fromEntries(
        Object.entries(newPresetData.payRates).filter(([, v]) => v !== undefined && v !== null && !isNaN(v))
      );
      const dataToSend = {
        ...newPresetData,
        payRates: Object.keys(filteredPayRates).length > 0 ? filteredPayRates : null,
      };
      
      const res = await fetch(`/api/agents/${selectedAgent.id}/presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      
      if (res.ok) {
        const data = await res.json();
        setPresets([...presets, data.preset]);
        setIsAddingPreset(false);
        setNewPresetData({
          lotteryType: selectedPresetLottery,
          name: "",
          discount: 0,
          isDefault: false,
          payRates: {},
        });
        setShowPayRatesForm(false);
        toast.success("เพิ่ม Preset สำเร็จ");
        mutate();
      } else {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถเพิ่ม Preset ได้");
      }
    } catch (error) {
      console.error("Add preset error:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    if (preset.isFullPay && preset.name === "จ่ายเต็ม") {
      toast.error("ไม่สามารถลบ Preset จ่ายเต็มได้");
      return;
    }
    
    const confirmed = await confirm({
      title: "ลบ Preset",
      message: `ต้องการลบ Preset "${preset.name}" หรือไม่?`,
      type: "danger",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
    });
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/presets/${presetId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setPresets(presets.filter(p => p.id !== presetId));
        toast.success("ลบ Preset สำเร็จ");
        mutate();
      } else {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถลบ Preset ได้");
      }
    } catch (error) {
      console.error("Delete preset error:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleSetDefaultPreset = async (presetId: string) => {
    try {
      const res = await fetch(`/api/presets/${presetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      
      if (res.ok) {
        setPresets(presets.map(p => ({
          ...p,
          isDefault: p.id === presetId,
        })));
        toast.success("ตั้งเป็น Default สำเร็จ");
        mutate();
      }
    } catch (error) {
      console.error("Set default preset error:", error);
    }
  };

  const handleStartEditPreset = (preset: DiscountPreset) => {
    setEditingPresetId(preset.id);
    setEditingPresetDiscount(preset.discount);
  };

  const handleCancelEditPreset = () => {
    setEditingPresetId(null);
    setEditingPresetDiscount(0);
  };

  const handleUpdatePresetDiscount = async (presetId: string) => {
    try {
      const res = await fetch(`/api/presets/${presetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: editingPresetDiscount }),
      });
      
      if (res.ok) {
        setPresets(presets.map(p => 
          p.id === presetId 
            ? { ...p, discount: editingPresetDiscount }
            : p
        ));
        toast.success("อัพเดทส่วนลดสำเร็จ");
        setEditingPresetId(null);
        mutate();
      } else {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถอัพเดทได้");
      }
    } catch (error) {
      console.error("Update preset discount error:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleSaveAgent = async () => {
    setIsSaving(true);
    try {
      if (selectedAgent) {
        // Update existing agent
        const res = await fetch(`/api/agents/${selectedAgent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            note: formData.note,
          }),
        });
        if (res.ok) {
          mutate();
        }
      } else {
        // Create new agent
        const newCode = `A${String(agents.length + 1).padStart(3, "0")}`;
        const res = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: newCode,
            name: formData.name,
            phone: formData.phone,
            note: formData.note,
            discounts: [
              { lotteryType: "THAI", discount: 15 },
              { lotteryType: "LAO", discount: 12 },
              { lotteryType: "HANOI", discount: 10 },
            ],
          }),
        });
        if (res.ok) {
          mutate();
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Save agent error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedAgent) return;
    
    setIsSaving(true);
    try {
      // Convert discountData to array format
      const discounts = Object.entries(discountData).map(([lotteryType, discount]) => ({
        lotteryType,
        discount,
      }));

      // Convert payRateData to array format
      const payRates: { lotteryType: string; betType: string; rate: number | null }[] = [];
      for (const [lotteryType, betRates] of Object.entries(payRateData)) {
        for (const [betType, rate] of Object.entries(betRates)) {
          payRates.push({ lotteryType, betType, rate });
        }
      }

      const res = await fetch(`/api/agents/${selectedAgent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discounts, payRates }),
      });

      if (res.ok) {
        toast.success("บันทึกการตั้งค่าสำเร็จ");
        mutate();
      } else {
        toast.error("ไม่สามารถบันทึกได้");
      }
      setIsSettingsDialogOpen(false);
    } catch (error) {
      console.error("Save settings error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !agent.isActive }),
      });

      if (res.ok) {
        mutate();
      }
    } catch (error) {
      console.error("Toggle active error:", error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const confirmed = await confirm({
      title: "ลบ Agent",
      message: `ต้องการลบ Agent "${agent.name}" (${agent.code}) หรือไม่? ถ้า Agent มีประวัติการแทง จะถูกปิดการใช้งานแทนการลบ`,
      type: "danger",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.softDeleted) {
          toast.warning("Agent ถูกปิดการใช้งาน (มีประวัติการแทง)");
        } else {
          toast.success("ลบ Agent สำเร็จ");
        }
        mutate();
      } else {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถลบ Agent ได้");
      }
    } catch (error) {
      console.error("Delete agent error:", error);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
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
    return agent.customPayRates !== null && Object.keys(agent.customPayRates || {}).length > 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="จัดการ Agent" subtitle="เพิ่ม แก้ไข และจัดการข้อมูล Agent" />
        <AgentsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="จัดการ Agent" subtitle="เพิ่ม แก้ไข และจัดการข้อมูล Agent" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="ค้นหา Agent..."
              icon={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAddAgent} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            เพิ่ม Agent ใหม่
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 lg:gap-4">
          <Card>
            <CardContent className="p-3 lg:p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
                <div>
                  <p className="text-xs lg:text-sm text-slate-400">Agent ทั้งหมด</p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-100">{agents.length}</p>
                </div>
                <Badge variant="default" className="w-fit text-xs">{agents.filter((a) => a.isActive).length} Active</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 lg:p-4">
              <div>
                <p className="text-xs lg:text-sm text-slate-400">ยอดแทงรวม</p>
                <p className="text-lg lg:text-2xl font-bold text-amber-400">
                  ฿{formatNumber(agents.reduce((sum, a) => sum + (a.totalBets || 0), 0))}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 lg:p-4">
              <div>
                <p className="text-xs lg:text-sm text-slate-400">ยอดคงค้าง</p>
                <p className="text-lg lg:text-2xl font-bold text-emerald-400">
                  ฿{formatNumber(agents.reduce((sum, a) => sum + (a.balance || 0), 0))}
                </p>
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
                          🇹🇭 {getAgentDiscounts(agent).THAI}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          🇱🇦 {getAgentDiscounts(agent).LAO}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          🇻🇳 {getAgentDiscounts(agent).HANOI}%
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
                      ฿{formatNumber(agent.totalBets || 0)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        (agent.balance || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      ฿{formatNumber(agent.balance || 0)}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAgent(agent.id)}
                          title="ลบ"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
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

          <Tabs defaultValue="presets" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="presets" className="gap-2">
                <Tag className="w-4 h-4" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="discount" className="gap-2">
                <Percent className="w-4 h-4" />
                ส่วนลด (เก่า)
              </TabsTrigger>
              <TabsTrigger value="payrate" className="gap-2">
                <DollarSign className="w-4 h-4" />
                อัตราจ่าย
              </TabsTrigger>
            </TabsList>

            {/* Presets Tab */}
            <TabsContent value="presets" className="space-y-4 py-4">
              {/* Info Box */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
                <p className="text-emerald-400 font-medium mb-1">📋 Preset ส่วนลด</p>
                <p className="text-slate-400">
                  กำหนดรูปแบบส่วนลดหลายแบบ เพื่อเลือกใช้ตอนคีย์หวย ทุก Agent จะมี &quot;จ่ายเต็ม&quot; อัตโนมัติ
                </p>
              </div>

              {/* Lottery Type Filter */}
              <div className="flex gap-2">
                {Object.entries(LOTTERY_TYPES).map(([key, lottery]) => (
                  <Button
                    key={key}
                    variant={selectedPresetLottery === key ? "default" : "outline"}
                    onClick={() => setSelectedPresetLottery(key)}
                    className="gap-1"
                  >
                    <span>{lottery.flag}</span>
                    {lottery.name}
                  </Button>
                ))}
              </div>

              {/* Preset List - filtered by lottery type */}
              <div className="space-y-2">
                {presets
                  .filter(p => p.lotteryType === selectedPresetLottery)
                  .map((preset) => (
                  <div
                    key={preset.id}
                    className={`p-3 rounded-lg border ${
                      preset.isDefault
                        ? "bg-amber-500/10 border-amber-500/30"
                        : preset.isFullPay
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-slate-800/50 border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{LOTTERY_TYPES[preset.lotteryType as keyof typeof LOTTERY_TYPES]?.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-100">{preset.name}</span>
                            {preset.isDefault && (
                              <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">Default</span>
                            )}
                            {preset.isFullPay && (
                              <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">💰 จ่ายเต็ม</span>
                            )}
                          </div>
                          {!preset.isFullPay && editingPresetId === preset.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-slate-400">ลด</span>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editingPresetDiscount}
                                onChange={(e) => setEditingPresetDiscount(parseInt(e.target.value) || 0)}
                                className="w-20 h-8 text-center font-bold"
                              />
                              <span className="text-slate-400">%</span>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUpdatePresetDiscount(preset.id)}
                                className="h-7"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditPreset}
                                className="h-7"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : !preset.isFullPay && (
                            <button 
                              onClick={() => handleStartEditPreset(preset)}
                              className="text-lg font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                            >
                              ลด {preset.discount}%
                              <Edit className="w-3 h-3 opacity-50" />
                            </button>
                          )}
                          {/* แสดงอัตราจ่ายพิเศษ */}
                          {preset.payRates && Object.keys(preset.payRates).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(preset.payRates).map(([betType, rate]) => (
                                <span key={betType} className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                  {BET_TYPES[betType as keyof typeof BET_TYPES]?.shortName}: ×{rate}
                                </span>
                              ))}
                            </div>
                          )}
                          {preset.isFullPay && (
                            <p className="text-xs text-slate-400">ไม่ลดส่วนลด จ่ายรางวัลเต็มอัตรา</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!preset.isDefault && !preset.isFullPay && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefaultPreset(preset.id)}
                            className="text-xs h-7"
                          >
                            ตั้งเป็น Default
                          </Button>
                        )}
                        {!preset.isFullPay && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePreset(preset.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Preset Form */}
              {isAddingPreset ? (
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-100">เพิ่ม Preset ใหม่</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAddingPreset(false)}
                      className="h-7 w-7"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ประเภทหวย</Label>
                    <Select 
                      value={newPresetData.lotteryType} 
                      onValueChange={(value) => setNewPresetData({ ...newPresetData, lotteryType: value })}
                    >
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
                  
                  <div className="space-y-2">
                    <Label>ชื่อ Preset</Label>
                    <Input
                      placeholder="เช่น VIP, Premium, ลูกค้าประจำ"
                      value={newPresetData.name}
                      onChange={(e) => setNewPresetData({ ...newPresetData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ส่วนลด (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newPresetData.discount}
                        onChange={(e) => setNewPresetData({ ...newPresetData, discount: parseInt(e.target.value) || 0 })}
                        className="w-32 text-center text-xl font-bold"
                      />
                      <span className="text-slate-400 text-lg">%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newPresetData.isDefault}
                      onCheckedChange={(checked) => setNewPresetData({ ...newPresetData, isDefault: checked })}
                    />
                    <Label>ตั้งเป็น Default สำหรับหวยนี้</Label>
                  </div>

                  {/* อัตราจ่ายพิเศษ */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showPayRatesForm}
                        onCheckedChange={setShowPayRatesForm}
                      />
                      <Label>กำหนดอัตราจ่ายพิเศษ</Label>
                    </div>
                    
                    {showPayRatesForm && (
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
                        <p className="text-xs text-slate-400">
                          ถ้าไม่กำหนด จะใช้อัตราจ่ายกลาง (เว้นว่างเพื่อใช้ค่าเดิม)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(BET_TYPES).map(([betKey, betType]) => (
                            <div key={betKey} className="space-y-1">
                              <Label className="text-xs">{betType.name}</Label>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-sm">×</span>
                                <Input
                                  type="number"
                                  placeholder="—"
                                  value={newPresetData.payRates[betKey] || ""}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setNewPresetData({
                                      ...newPresetData,
                                      payRates: {
                                        ...newPresetData.payRates,
                                        [betKey]: val || undefined,
                                      },
                                    });
                                  }}
                                  className="font-mono text-sm h-8"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsAddingPreset(false)} className="flex-1">
                      ยกเลิก
                    </Button>
                    <Button onClick={handleAddPreset} disabled={!newPresetData.name || isSaving} className="flex-1">
                      <Check className="w-4 h-4 mr-2" />
                      บันทึก
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsAddingPreset(true)} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  เพิ่ม Preset ใหม่
                </Button>
              )}
            </TabsContent>

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
