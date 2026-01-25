-- =============================================
-- SEED DATA FOR PUNSOOK LOTTO
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create Roles (with new permission format)
INSERT INTO "Role" (id, code, name, description, permissions, "isSystem", "createdAt", "updatedAt")
VALUES 
  ('role_master', 'MASTER', 'Master', 'เจ้าของระบบ - สิทธิ์เต็ม', '["dashboard:view","agent:view","agent:create","agent:edit","agent:delete","bet:view","bet:create","bet:cancel","risk:view","risk:manage","layoff:view","layoff:manage","round:view","round:manage","result:view","result:submit","history:view","report:view","report:export","settings:view","settings:manage","user:view","user:create","user:edit","user:delete"]', true, NOW(), NOW()),
  ('role_admin', 'ADMIN', 'Admin', 'ผู้ดูแลระบบ', '["dashboard:view","agent:view","agent:create","agent:edit","agent:delete","bet:view","bet:create","bet:cancel","risk:view","risk:manage","layoff:view","layoff:manage","round:view","round:manage","result:view","result:submit","history:view","report:view","report:export","settings:view","settings:manage"]', true, NOW(), NOW()),
  ('role_operator', 'OPERATOR', 'Operator', 'พนักงานคีย์หวย', '["dashboard:view","bet:view","bet:create","history:view","report:view"]', true, NOW(), NOW()),
  ('role_viewer', 'VIEWER', 'Viewer', 'ดูข้อมูลอย่างเดียว', '["dashboard:view","history:view","report:view"]', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Create Admin User (password: admin)
-- bcrypt hash of "admin" with cost 10
INSERT INTO "User" (id, username, password, name, "roleId", "isActive", "createdAt", "updatedAt")
VALUES (
  'user_admin',
  'admin',
  '$2b$10$lAmF0QqFiAph1WUzrRLHs..CL.NoMIcWldj4/Fx76/yV8NYMdLMmG',
  'Administrator',
  'role_admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- 3. Create Lottery Types
INSERT INTO "LotteryType" (id, code, name, description, "drawDays", "closeTime", "isActive", "createdAt", "updatedAt")
VALUES 
  ('lottery_thai', 'THAI', 'หวยไทย', 'หวยรัฐบาลไทย', '1,16', '14:30', true, NOW(), NOW()),
  ('lottery_lao', 'LAO', 'หวยลาว', 'หวยลาว', 'MON,WED,FRI', '20:00', true, NOW(), NOW()),
  ('lottery_hanoi', 'HANOI', 'หวยฮานอย', 'หวยฮานอย', 'DAILY', '18:00', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 4. Create Pay Rates
-- Thai
INSERT INTO "PayRate" (id, "lotteryTypeId", "betType", "payRate", "isActive", "createdAt", "updatedAt")
VALUES 
  ('pr_thai_3top', 'lottery_thai', 'THREE_TOP', 900, true, NOW(), NOW()),
  ('pr_thai_3tod', 'lottery_thai', 'THREE_TOD', 150, true, NOW(), NOW()),
  ('pr_thai_2top', 'lottery_thai', 'TWO_TOP', 90, true, NOW(), NOW()),
  ('pr_thai_2bot', 'lottery_thai', 'TWO_BOTTOM', 90, true, NOW(), NOW()),
  ('pr_thai_rtop', 'lottery_thai', 'RUN_TOP', 3.2, true, NOW(), NOW()),
  ('pr_thai_rbot', 'lottery_thai', 'RUN_BOTTOM', 4.2, true, NOW(), NOW()),
  -- Lao
  ('pr_lao_3top', 'lottery_lao', 'THREE_TOP', 850, true, NOW(), NOW()),
  ('pr_lao_3tod', 'lottery_lao', 'THREE_TOD', 120, true, NOW(), NOW()),
  ('pr_lao_2top', 'lottery_lao', 'TWO_TOP', 95, true, NOW(), NOW()),
  ('pr_lao_2bot', 'lottery_lao', 'TWO_BOTTOM', 95, true, NOW(), NOW()),
  ('pr_lao_rtop', 'lottery_lao', 'RUN_TOP', 3.5, true, NOW(), NOW()),
  ('pr_lao_rbot', 'lottery_lao', 'RUN_BOTTOM', 4.5, true, NOW(), NOW()),
  -- Hanoi
  ('pr_hanoi_3top', 'lottery_hanoi', 'THREE_TOP', 850, true, NOW(), NOW()),
  ('pr_hanoi_3tod', 'lottery_hanoi', 'THREE_TOD', 120, true, NOW(), NOW()),
  ('pr_hanoi_2top', 'lottery_hanoi', 'TWO_TOP', 95, true, NOW(), NOW()),
  ('pr_hanoi_2bot', 'lottery_hanoi', 'TWO_BOTTOM', 95, true, NOW(), NOW()),
  ('pr_hanoi_rtop', 'lottery_hanoi', 'RUN_TOP', 3.5, true, NOW(), NOW()),
  ('pr_hanoi_rbot', 'lottery_hanoi', 'RUN_BOTTOM', 4.5, true, NOW(), NOW())
ON CONFLICT ("lotteryTypeId", "betType") DO NOTHING;

-- 5. Create Global Limits
INSERT INTO "GlobalLimit" (id, "lotteryTypeId", "betType", "limitAmount", "isActive", "createdAt", "updatedAt")
VALUES 
  -- Thai
  ('gl_thai_3top', 'lottery_thai', 'THREE_TOP', 200, true, NOW(), NOW()),
  ('gl_thai_3tod', 'lottery_thai', 'THREE_TOD', 500, true, NOW(), NOW()),
  ('gl_thai_2top', 'lottery_thai', 'TWO_TOP', 5000, true, NOW(), NOW()),
  ('gl_thai_2bot', 'lottery_thai', 'TWO_BOTTOM', 5000, true, NOW(), NOW()),
  ('gl_thai_rtop', 'lottery_thai', 'RUN_TOP', 10000, true, NOW(), NOW()),
  ('gl_thai_rbot', 'lottery_thai', 'RUN_BOTTOM', 10000, true, NOW(), NOW()),
  -- Lao
  ('gl_lao_3top', 'lottery_lao', 'THREE_TOP', 200, true, NOW(), NOW()),
  ('gl_lao_3tod', 'lottery_lao', 'THREE_TOD', 500, true, NOW(), NOW()),
  ('gl_lao_2top', 'lottery_lao', 'TWO_TOP', 5000, true, NOW(), NOW()),
  ('gl_lao_2bot', 'lottery_lao', 'TWO_BOTTOM', 5000, true, NOW(), NOW()),
  ('gl_lao_rtop', 'lottery_lao', 'RUN_TOP', 10000, true, NOW(), NOW()),
  ('gl_lao_rbot', 'lottery_lao', 'RUN_BOTTOM', 10000, true, NOW(), NOW()),
  -- Hanoi
  ('gl_hanoi_3top', 'lottery_hanoi', 'THREE_TOP', 200, true, NOW(), NOW()),
  ('gl_hanoi_3tod', 'lottery_hanoi', 'THREE_TOD', 500, true, NOW(), NOW()),
  ('gl_hanoi_2top', 'lottery_hanoi', 'TWO_TOP', 5000, true, NOW(), NOW()),
  ('gl_hanoi_2bot', 'lottery_hanoi', 'TWO_BOTTOM', 5000, true, NOW(), NOW()),
  ('gl_hanoi_rtop', 'lottery_hanoi', 'RUN_TOP', 10000, true, NOW(), NOW()),
  ('gl_hanoi_rbot', 'lottery_hanoi', 'RUN_BOTTOM', 10000, true, NOW(), NOW())
ON CONFLICT ("lotteryTypeId", "betType") DO NOTHING;

-- 6. Create Capital Settings
INSERT INTO "CapitalSetting" (id, "totalCapital", "riskMode", "riskPercentage", "usableCapital", "isActive", "createdAt", "updatedAt")
VALUES (
  'capital_default',
  1000000,
  'BALANCED',
  75,
  750000,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 7. Create Demo Agents
INSERT INTO "Agent" (id, code, name, phone, "isActive", "createdAt", "updatedAt")
VALUES 
  ('agent_001', 'A001', 'นายสมชาย ใจดี', '081-234-5678', true, NOW(), NOW()),
  ('agent_002', 'A002', 'นายวิชัย รวยมาก', '089-876-5432', true, NOW(), NOW()),
  ('agent_003', 'A003', 'นายประสิทธิ์ ดีเลิศ', '062-345-6789', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 8. Create Agent Discounts
INSERT INTO "AgentDiscount" (id, "agentId", "lotteryType", discount, "createdAt", "updatedAt")
VALUES 
  -- Agent 001
  ('ad_001_thai', 'agent_001', 'THAI', 15, NOW(), NOW()),
  ('ad_001_lao', 'agent_001', 'LAO', 12, NOW(), NOW()),
  ('ad_001_hanoi', 'agent_001', 'HANOI', 10, NOW(), NOW()),
  -- Agent 002
  ('ad_002_thai', 'agent_002', 'THAI', 15, NOW(), NOW()),
  ('ad_002_lao', 'agent_002', 'LAO', 12, NOW(), NOW()),
  ('ad_002_hanoi', 'agent_002', 'HANOI', 10, NOW(), NOW()),
  -- Agent 003
  ('ad_003_thai', 'agent_003', 'THAI', 15, NOW(), NOW()),
  ('ad_003_lao', 'agent_003', 'LAO', 12, NOW(), NOW()),
  ('ad_003_hanoi', 'agent_003', 'HANOI', 10, NOW(), NOW())
ON CONFLICT ("agentId", "lotteryType") DO NOTHING;

-- Done!
SELECT 'Seed completed successfully!' as status;
