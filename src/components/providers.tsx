"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import { ReactNode } from "react";
import { SWRConfig } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false, // ไม่ reload ทุกครั้งที่กลับมาที่ tab
        revalidateIfStale: false, // ใช้ cache ถ้ามี
        dedupingInterval: 30000, // ไม่ยิง request ซ้ำภายใน 30 วินาที
        errorRetryCount: 2,
        keepPreviousData: true, // แสดงข้อมูลเดิมขณะโหลดใหม่
      }}
    >
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </SWRConfig>
  );
}
