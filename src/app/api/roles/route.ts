import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCacheHeaders } from "@/lib/utils";

// GET - List roles
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { code: "asc" },
    });

    // Parse permissions JSON
    const rolesWithParsedPermissions = [];
    for (const role of roles) {
      rolesWithParsedPermissions.push({
        ...role,
        permissions: JSON.parse(role.permissions),
      });
    }

    return NextResponse.json({ roles: rolesWithParsedPermissions }, { headers: getCacheHeaders(120, 300) });
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูล Role ได้" },
      { status: 500 }
    );
  }
}
