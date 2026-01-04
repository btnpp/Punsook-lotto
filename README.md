# 🎰 Punsook Lotto

ระบบคีย์หวยสำหรับเจ้ามือ - Lottery Management System for Dealers

## ✨ Features

### 👥 จัดการ Agent
- เพิ่ม/แก้ไข/ลบ Agent
- ตั้งค่า % ส่วนลดแยกตามประเภทหวย (ไทย/ลาว/ฮานอย)
- ตั้งค่าโควต้าต่อ Agent

### 🎫 คีย์หวย
- คีย์เลขเดี่ยว
- คีย์โพย (Bulk entry)
- รองรับหลายประเภท: 3ตัวบน/โต๊ด, 2ตัวบน/ล่าง, วิ่งบน/ล่าง
- คำนวณส่วนลดอัตโนมัติ

### 🛡️ บริหารความเสี่ยง
- Global Limit - จำกัดยอดรวมต่อเลข
- Agent Quota - โควต้าต่อ Agent
- Dynamic Mode - ยืดหยุ่นตาม Limit ที่เหลือ
- Dashboard ความเสี่ยง Real-time

### 💰 ระบบบริหารทุน
- กำหนดทุนทั้งหมด
- โหมดความเสี่ยง: Conservative/Balanced/Aggressive
- คำนวณ Safe Limit อัตโนมัติ

### 🔄 ระบบตีออก
- สร้างรายการตีออกอัตโนมัติ
- Export Excel
- Copy ข้อความพร้อมส่ง
- Track สถานะการตีออก

### 📊 รายงาน
- Dashboard ภาพรวม
- ประวัติการแทง
- ออกผลหวย
- สรุปกำไร/ขาดทุน

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial data (optional)
npx prisma db seed

# Start development server
npm run dev
```

### Demo Login
- Username: `admin`
- Password: `admin`

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Database**: SQLite (Prisma ORM)
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Dashboard pages
│   │   ├── agents/         # Agent management
│   │   ├── bets/           # Betting
│   │   ├── risk/           # Risk management
│   │   ├── layoff/         # Lay off system
│   │   ├── results/        # Lottery results
│   │   ├── history/        # Betting history
│   │   └── settings/       # System settings
│   └── page.tsx            # Login page
├── components/
│   ├── layout/             # Layout components
│   └── ui/                 # UI components
├── lib/
│   ├── constants.ts        # Constants & configs
│   ├── db.ts               # Database client
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
└── prisma/
    └── schema.prisma       # Database schema
```

## 📝 License

MIT License

## 👨‍💻 Author

Created with ❤️ for Thai lottery dealers
