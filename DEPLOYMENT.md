# 🚀 Production Deployment Guide

## สถาปัตยกรรม (Architecture)
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cloudflare    │────▶│  Cloudflare      │────▶│    Supabase     │
│      DNS        │     │    Pages         │     │   (Database)    │
│   (Domain)      │     │  (Next.js App)   │     │   PostgreSQL    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## 📋 Checklist ก่อน Deploy

### 1. Environment Variables ที่ต้องเตรียม
```env
# Supabase
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_KEY="eyJ..."

# App
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Optional
NODE_ENV="production"
```

---

## 🗄️ Step 1: ตั้งค่า Supabase

### 1.1 สร้าง Project ใหม่
1. ไปที่ [supabase.com](https://supabase.com)
2. สร้าง New Project
3. เลือก Region: Singapore (ใกล้ไทย)
4. ตั้งรหัสผ่าน Database

### 1.2 เปลี่ยน Prisma ใช้ PostgreSQL
```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 1.3 ดึง Connection String
ไปที่ Project Settings > Database > Connection string
- **DATABASE_URL**: ใช้ Pooler connection (Transaction mode)
- **DIRECT_URL**: ใช้ Direct connection

### 1.4 Run Migration
```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## ☁️ Step 2: ตั้งค่า Cloudflare Pages

### 2.1 เชื่อม GitHub Repository
1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers & Pages > Create application > Pages
3. Connect to Git > เลือก Repository `Punsook-lotto`

### 2.2 Build Settings
```yaml
Framework preset: Next.js
Build command: npx @cloudflare/next-on-pages
Build output directory: .vercel/output/static
Root directory: /
Node.js version: 20.x
```

### 2.3 Environment Variables
เพิ่มทุกตัวจาก `.env.production`:
- DATABASE_URL
- DIRECT_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- NEXTAUTH_SECRET
- NEXTAUTH_URL

### 2.4 ติดตั้ง @cloudflare/next-on-pages
```bash
npm install -D @cloudflare/next-on-pages
```

### 2.5 เพิ่ม wrangler.toml
```toml
name = "punsook-lotto"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
NODE_ENV = "production"
```

---

## 🔧 Step 3: ปรับ Code สำหรับ Production

### 3.1 เพิ่ม next.config.ts สำหรับ Cloudflare
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // สำหรับ Cloudflare Pages
  output: "standalone",
  
  // ปิด image optimization (ใช้ Cloudflare แทน)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### 3.2 สร้าง API Routes สำหรับ Auth
```typescript
// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  
  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: true },
  });
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  
  // Return user with JWT token
  return NextResponse.json({ user });
}
```

---

## 🔐 Step 4: ตั้งค่า Authentication (Production)

### 4.1 ติดตั้ง Dependencies
```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 4.2 Hash Passwords
```typescript
// utils/auth.ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}
```

---

## 🌐 Step 5: ตั้งค่า Domain (Cloudflare DNS)

### 5.1 เพิ่ม Custom Domain
1. Cloudflare Pages > Your Project > Custom domains
2. เพิ่ม domain: `lotto.yourdomain.com`
3. Cloudflare จะสร้าง DNS record อัตโนมัติ

### 5.2 SSL/TLS
- Mode: Full (strict)
- Always Use HTTPS: On
- Auto Minify: CSS, JS, HTML

---

## 📦 Step 6: Deploy Commands

### Deploy แบบ Manual
```bash
# Build
npm run build

# Preview locally
npx wrangler pages dev .vercel/output/static

# Deploy to Cloudflare
npx wrangler pages deploy .vercel/output/static
```

### Deploy แบบ Auto (Recommended)
- Push to `main` branch = Deploy to Production
- Push to `develop` branch = Deploy to Preview

---

## 🔄 Rollback Version

### ดู Version History
```bash
git log --oneline -20
```

### Rollback ไป Version ก่อนหน้า
```bash
# Soft rollback (สร้าง commit ใหม่)
git revert <commit-hash>
git push origin main

# Hard rollback (กลับไปเลย)
git reset --hard <commit-hash>
git push origin main --force
```

### Rollback บน Cloudflare
1. ไปที่ Cloudflare Pages > Deployments
2. เลือก deployment ที่ต้องการ
3. Click "Rollback to this deployment"

---

## 📊 Monitoring

### Cloudflare Analytics
- Request metrics
- Performance
- Error rates

### Supabase Dashboard
- Database queries
- Storage usage
- Auth logs

---

## 🛡️ Security Checklist

- [ ] เปลี่ยนรหัสผ่าน default (admin/admin123)
- [ ] ตั้ง NEXTAUTH_SECRET ที่ปลอดภัย
- [ ] Enable Row Level Security (RLS) ใน Supabase
- [ ] ตั้ง Rate Limiting
- [ ] Enable 2FA สำหรับ Cloudflare & Supabase accounts

---

## 💰 Cost Estimate (Free Tier)

| Service | Free Tier |
|---------|-----------|
| Cloudflare Pages | Unlimited requests |
| Supabase | 500MB database, 2GB bandwidth |
| Total | **$0/month** (เริ่มต้น) |

---

## 🆘 Troubleshooting

### Build Error: Prisma
```bash
# เพิ่มใน package.json scripts
"postinstall": "prisma generate"
```

### Edge Runtime Error
```typescript
// เพิ่มใน API routes ที่ใช้ Prisma
export const runtime = "nodejs";
```

### Database Connection Error
- ตรวจสอบ DATABASE_URL format
- ใช้ Pooler connection สำหรับ serverless
