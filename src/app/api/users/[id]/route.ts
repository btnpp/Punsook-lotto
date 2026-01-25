import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, roleCode, isActive, password, customPermissions } = body;

    const updateData: Record<string, unknown> = {};

    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (customPermissions !== undefined) updateData.customPermissions = customPermissions;

    // Update role if provided
    if (roleCode) {
      const role = await prisma.role.findUnique({
        where: { code: roleCode },
      });
      if (role) {
        updateData.roleId = role.id;
      }
    }

    // Update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    const { password: _, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตผู้ใช้ได้" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user has any activity
    const betCount = await prisma.bet.count({
      where: { createdById: id },
    });

    if (betCount > 0) {
      // Soft delete
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "ผู้ใช้ถูกปิดการใช้งาน (มีประวัติกิจกรรม)",
        softDeleted: true,
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถลบผู้ใช้ได้" },
      { status: 500 }
    );
  }
}
