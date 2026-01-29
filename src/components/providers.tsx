"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ReactNode } from "react";
import { SWRConfig } from "swr";

// Optimized fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        // === Revalidation Settings ===
        revalidateOnFocus: false,      // ไม่ reload เมื่อกลับมาที่ tab
        revalidateOnReconnect: false,  // ไม่ reload เมื่อ reconnect internet
        revalidateIfStale: false,      // ใช้ cache ถ้ามี ไม่ revalidate อัตโนมัติ
        
        // === Deduplication & Caching ===
        dedupingInterval: 60000,       // ไม่ยิง request ซ้ำภายใน 60 วินาที (เพิ่มจาก 30)
        
        // === Error Handling ===
        errorRetryCount: 2,            // retry 2 ครั้งถ้า error
        errorRetryInterval: 3000,      // รอ 3 วินาทีก่อน retry
        shouldRetryOnError: true,      // retry เมื่อ error
        
        // === UX Improvements ===
        keepPreviousData: true,        // แสดงข้อมูลเดิมขณะโหลดใหม่
        
        // === Performance ===
        focusThrottleInterval: 60000,  // ถ้าเปิด revalidateOnFocus จะ throttle 60 วินาที
        loadingTimeout: 3000,          // แสดง loading ถ้านานเกิน 3 วินาที
      }}
    >
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>{children}</AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </SWRConfig>
  );
}
