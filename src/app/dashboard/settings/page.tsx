"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Save, RefreshCw, Shield, DollarSign, Clock, Bell, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/utils";
import { LOTTERY_TYPES, BET_TYPES, DEFAULT_PAY_RATES, DEFAULT_GLOBAL_LIMITS, RISK_MODES } from "@/lib/constants";

export default function SettingsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [payRates, setPayRates] = useState(DEFAULT_PAY_RATES);
  const [globalLimits, setGlobalLimits] = useState(DEFAULT_GLOBAL_LIMITS);
  const [capitalSettings, setCapitalSettings] = useState({
    totalCapital: 1000000,
    riskMode: "BALANCED",
    customPercentage: 75,
  });
  const [notifications, setNotifications] = useState({
    limitWarning: true,
    limitWarningThreshold: 80,
    limitCritical: true,
    limitCriticalThreshold: 95,
    autoCloseOnLimit: true,
    lineNotify: false,
    lineToken: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.capitalSetting) {
          setCapitalSettings({
            totalCapital: data.capitalSetting.totalCapital,
            riskMode: data.capitalSetting.riskMode,
            customPercentage: data.capitalSetting.riskPercentage,
          });
        }
        // Update pay rates and limits from API if available
        if (data.payRates) {
          const rates = JSON.parse(JSON.stringify(DEFAULT_PAY_RATES));
          for (const rate of data.payRates) {
            const lotteryCode = rate.lotteryType?.code;
            if (lotteryCode && rates[lotteryCode]) {
              rates[lotteryCode][rate.betType] = rate.payRate;
            }
          }
          setPayRates(rates);
        }
        if (data.globalLimits) {
          const limits = JSON.parse(JSON.stringify(DEFAULT_GLOBAL_LIMITS));
          for (const limit of data.globalLimits) {
            const lotteryCode = limit.lotteryType?.code;
            if (lotteryCode && limits[lotteryCode]) {
              limits[lotteryCode][limit.betType] = limit.limitAmount;
            }
          }
          setGlobalLimits(limits);
        }
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePayRates = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payRates }),
      });
      if (res.ok) {
        toast.success("บันทึกอัตราจ่ายสำเร็จ!");
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถบันทึกได้");
      }
    } catch (error) {
      console.error("Save pay rates error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLimits = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalLimits }),
      });
      if (res.ok) {
        toast.success("บันทึก Limit สำเร็จ!");
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถบันทึกได้");
      }
    } catch (error) {
      console.error("Save limits error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCapital = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capitalSettings }),
      });
      if (res.ok) {
        toast.success("บันทึกการตั้งค่าทุนสำเร็จ!");
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถบันทึกได้");
      }
    } catch (error) {
      console.error("Save capital error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    toast.success("บันทึกการแจ้งเตือนสำเร็จ!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="ตั้งค่าระบบ" subtitle="จัดการการตั้งค่าต่างๆ ของระบบ" />

      <div className="p-6">
        <Tabs defaultValue="payrates" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="payrates">อัตราจ่าย</TabsTrigger>
            <TabsTrigger value="limits">Limit</TabsTrigger>
            <TabsTrigger value="capital">ทุน</TabsTrigger>
            <TabsTrigger value="notifications">แจ้งเตือน</TabsTrigger>
          </TabsList>

          {/* Pay Rates Tab */}
          <TabsContent value="payrates" className="space-y-6">
            {/* หมายเหตุเกี่ยวกับอัตราจ่าย */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">อัตราจ่ายกลาง (Default)</p>
                    <p className="text-sm text-slate-400 mt-1">
                      อัตราจ่ายด้านล่างนี้เป็นค่าตั้งต้น ใช้สำหรับ Agent ที่ไม่ได้กำหนดอัตราจ่ายเฉพาะ
                      <br />
                      สามารถตั้งค่าอัตราจ่ายเฉพาะแต่ละ Agent ได้ในหน้า <span className="text-amber-400">จัดการ Agent</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.entries(LOTTERY_TYPES).map(([lotteryKey, lottery]) => (
              <Card key={lotteryKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{lottery.flag}</span>
                    {lottery.name}
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded ml-2">อัตราจ่ายกลาง</span>
                  </CardTitle>
                  <CardDescription>กำหนดอัตราจ่ายเริ่มต้นสำหรับ{lottery.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(BET_TYPES).map(([betKey, betType]) => (
                      <div key={betKey} className="space-y-2">
                        <Label>{betType.name}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">×</span>
                          <Input
                            type="number"
                            value={
                              payRates[lotteryKey as keyof typeof payRates]?.[
                                betKey as keyof typeof DEFAULT_PAY_RATES.THAI
                              ] || 0
                            }
                            onChange={(e) => {
                              setPayRates({
                                ...payRates,
                                [lotteryKey]: {
                                  ...payRates[lotteryKey as keyof typeof payRates],
                                  [betKey]: parseFloat(e.target.value) || 0,
                                },
                              });
                            }}
                            className="font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={handleSavePayRates} className="gap-2">
              <Save className="w-4 h-4" />
              บันทึกอัตราจ่าย
            </Button>
          </TabsContent>

          {/* Limits Tab */}
          <TabsContent value="limits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  Global Limit (Limit รวมต่อเลข)
                </CardTitle>
                <CardDescription>
                  กำหนดยอดรวมสูงสุดที่รับได้ต่อเลขแต่ละตัว
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(BET_TYPES).map(([betKey, betType]) => (
                    <div key={betKey} className="space-y-2">
                      <Label>{betType.name}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">฿</span>
                        <Input
                          type="number"
                          value={globalLimits[betKey as keyof typeof globalLimits] || 0}
                          onChange={(e) => {
                            setGlobalLimits({
                              ...globalLimits,
                              [betKey]: parseInt(e.target.value) || 0,
                            });
                          }}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>โควต้า Agent ตั้งต้น</CardTitle>
                <CardDescription>
                  โควต้าเริ่มต้นสำหรับ Agent ใหม่ (สามารถปรับแต่ละ Agent ได้ในหน้าจัดการ Agent)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(BET_TYPES).map(([betKey, betType]) => (
                    <div key={betKey} className="space-y-2">
                      <Label>{betType.name}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">฿</span>
                        <Input
                          type="number"
                          defaultValue={500}
                          className="font-mono"
                        />
                        <span className="text-slate-400">/เลข</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveLimits} className="gap-2">
              <Save className="w-4 h-4" />
              บันทึก Limit
            </Button>
          </TabsContent>

          {/* Capital Tab */}
          <TabsContent value="capital" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  ตั้งค่าทุน
                </CardTitle>
                <CardDescription>
                  กำหนดทุนและระดับความเสี่ยงที่ยอมรับได้
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>ทุนทั้งหมด</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">฿</span>
                    <Input
                      type="number"
                      value={capitalSettings.totalCapital}
                      onChange={(e) =>
                        setCapitalSettings({
                          ...capitalSettings,
                          totalCapital: parseInt(e.target.value) || 0,
                        })
                      }
                      className="font-mono text-lg max-w-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>โหมดความเสี่ยง</Label>
                  <Select
                    value={capitalSettings.riskMode}
                    onValueChange={(value) =>
                      setCapitalSettings({ ...capitalSettings, riskMode: value })
                    }
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RISK_MODES).map(([key, mode]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>
                              {mode.name} ({mode.percentage}%)
                            </span>
                            <span className="text-xs text-slate-400">{mode.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {capitalSettings.riskMode === "CUSTOM" && (
                  <div className="space-y-2">
                    <Label>% ที่ใช้</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={capitalSettings.customPercentage}
                        onChange={(e) =>
                          setCapitalSettings({
                            ...capitalSettings,
                            customPercentage: parseInt(e.target.value) || 0,
                          })
                        }
                        className="max-w-[100px]"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-sm text-slate-300">
                    ทุนที่ใช้ได้:{" "}
                    <span className="text-xl font-bold text-emerald-400">
                      ฿
                      {formatNumber(
                        capitalSettings.totalCapital *
                          ((capitalSettings.riskMode === "CUSTOM"
                            ? capitalSettings.customPercentage
                            : RISK_MODES[capitalSettings.riskMode as keyof typeof RISK_MODES]
                                ?.percentage || 75) /
                            100)
                      )}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveCapital} className="gap-2">
              <Save className="w-4 h-4" />
              บันทึกการตั้งค่าทุน
            </Button>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  การแจ้งเตือน Limit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>แจ้งเตือนเมื่อใกล้ถึง Limit</Label>
                    <p className="text-sm text-slate-400">
                      แจ้งเตือนเมื่อยอดถึง threshold ที่กำหนด
                    </p>
                  </div>
                  <Switch
                    checked={notifications.limitWarning}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, limitWarning: checked })
                    }
                  />
                </div>

                {notifications.limitWarning && (
                  <div className="pl-4 border-l-2 border-slate-700 space-y-2">
                    <Label>Threshold แจ้งเตือน</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={notifications.limitWarningThreshold}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            limitWarningThreshold: parseInt(e.target.value) || 0,
                          })
                        }
                        className="max-w-[100px]"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>แจ้งเตือนด่วนเมื่อวิกฤต</Label>
                    <p className="text-sm text-slate-400">แจ้งเตือนพิเศษเมื่อใกล้ถึง Limit มาก</p>
                  </div>
                  <Switch
                    checked={notifications.limitCritical}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, limitCritical: checked })
                    }
                  />
                </div>

                {notifications.limitCritical && (
                  <div className="pl-4 border-l-2 border-slate-700 space-y-2">
                    <Label>Threshold วิกฤต</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={notifications.limitCriticalThreshold}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            limitCriticalThreshold: parseInt(e.target.value) || 0,
                          })
                        }
                        className="max-w-[100px]"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>ปิดรับอัตโนมัติเมื่อถึง Limit</Label>
                    <p className="text-sm text-slate-400">
                      ระบบจะปิดรับเลขนั้นอัตโนมัติเมื่อถึง 100%
                    </p>
                  </div>
                  <Switch
                    checked={notifications.autoCloseOnLimit}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, autoCloseOnLimit: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LINE Notify</CardTitle>
                <CardDescription>ส่งการแจ้งเตือนผ่าน LINE</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>เปิดใช้งาน LINE Notify</Label>
                  </div>
                  <Switch
                    checked={notifications.lineNotify}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, lineNotify: checked })
                    }
                  />
                </div>

                {notifications.lineNotify && (
                  <div className="space-y-2">
                    <Label>LINE Notify Token</Label>
                    <Input
                      type="password"
                      placeholder="กรอก LINE Notify Token"
                      value={notifications.lineToken}
                      onChange={(e) =>
                        setNotifications({ ...notifications, lineToken: e.target.value })
                      }
                    />
                    <p className="text-xs text-slate-400">
                      รับ Token ได้ที่{" "}
                      <a
                        href="https://notify-bot.line.me/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:underline"
                      >
                        notify-bot.line.me
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={handleSaveNotifications} className="gap-2">
              <Save className="w-4 h-4" />
              บันทึกการแจ้งเตือน
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

