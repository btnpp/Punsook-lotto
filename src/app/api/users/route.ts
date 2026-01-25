import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - List users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });

    // Don't return passwords
    const safeUsers = [];
    for (const user of users) {
      const { password: _pwd, ...safeUser } = user;
      safeUsers.push(safeUser);
    }

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" },
      { status: 500 }
    );
  }
}

// POST - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, name, email, phone, roleCode } = body;

    if (!username || !password || !name || !roleCode) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    // Check if username exists
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    // Get role
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      return NextResponse.json(
        { error: "ไม่พบ Role ที่ระบุ" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        phone,
        roleId: role.id,
      },
      include: { role: true },
    });

    // Don't return password
    const { password: _, ...safeUser } = user;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างผู้ใช้ได้" },
      { status: 500 }
    );
  }
}
