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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Edit, Trash2, Settings, Eye } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { LOTTERY_TYPES } from "@/lib/constants";

// Demo data
const demoAgents = [
  {
    id: "1",
    code: "A001",
    name: "นายสมชาย ใจดี",
    phone: "081-234-5678",
    isActive: true,
    discounts: { THAI: 15, LAO: 12, HANOI: 10 },
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
    totalBets: 0,
    balance: 5000,
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState(demoAgents);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<typeof demoAgents[0] | null>(null);
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

  const handleEditAgent = (agent: typeof demoAgents[0]) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      phone: agent.phone,
      note: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditDiscount = (agent: typeof demoAgents[0]) => {
    setSelectedAgent(agent);
    setDiscountData(agent.discounts);
    setIsDiscountDialogOpen(true);
  };

  const handleSaveAgent = () => {
    if (selectedAgent) {
      // Update existing agent
      setAgents(
        agents.map((a) =>
          a.id === selectedAgent.id
            ? { ...a, name: formData.name, phone: formData.phone }
            : a
        )
      );
    } else {
      // Add new agent
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
          totalBets: 0,
          balance: 0,
        },
      ]);
    }
    setIsDialogOpen(false);
  };

  const handleSaveDiscount = () => {
    if (selectedAgent) {
      setAgents(
        agents.map((a) =>
          a.id === selectedAgent.id ? { ...a, discounts: discountData } : a
        )
      );
    }
    setIsDiscountDialogOpen(false);
  };

  const handleToggleActive = (agentId: string) => {
    setAgents(
      agents.map((a) =>
        a.id === agentId ? { ...a, isActive: !a.isActive } : a
      )
    );
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
                          onClick={() => handleEditDiscount(agent)}
                          title="ตั้งค่าส่วนลด"
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

      {/* Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ตั้งค่าส่วนลด: {selectedAgent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveDiscount}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

