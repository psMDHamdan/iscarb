import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const g = await guard(req, "assessment:content:read");
  if (!g.ok) {
    return NextResponse.json({ error: g.error }, { status: g.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const spec = searchParams.get("specialization");
    const code = searchParams.get("code");
    
    // Fetch latest versions of modules
    const modules = await db.assessmentModule.findMany({
      where: {
        ...(spec ? { specialization: spec } : {}),
        ...(code ? { code } : {}),
      },
      orderBy: [
        { code: "asc" },
        { version: "desc" }
      ]
    });
    
    // De-duplicate to only return the latest version for each code+spec
    const latestModulesMap = new Map();
    for (const mod of modules) {
      const key = `${mod.code}-${mod.specialization || 'global'}`;
      if (!latestModulesMap.has(key)) {
        latestModulesMap.set(key, mod);
      }
    }

    return NextResponse.json({ modules: Array.from(latestModulesMap.values()) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(req, "assessment:content:write");
  if (!g.ok) {
    return NextResponse.json({ error: g.error }, { status: g.status });
  }

  try {
    const body = await req.json();
    const { code, title, dimension, specialization, level, framework, rubricJson, action } = body;

    if (!code || !title || !dimension || !rubricJson) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get current max version
    const latest = await db.assessmentModule.findFirst({
      where: { code, specialization: specialization || null },
      orderBy: { version: "desc" }
    });

    const newVersion = (latest?.version || 0) + 1;

    // Create new version in draft or pending state
    const signOffState = action === "submit_for_approval" ? "pending" : "draft";

    const newModule = await db.assessmentModule.create({
      data: {
        code,
        title,
        dimension,
        specialization: specialization || null,
        level: level || "Bachelors",
        framework: framework || "Universal",
        rubricJson: typeof rubricJson === "string" ? rubricJson : JSON.stringify(rubricJson),
        version: newVersion,
        signOffState,
        authorId: g.studentId, // Or user ID from guard
      }
    });

    return NextResponse.json({ success: true, module: newModule });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const g = await guard(req, "assessment:content:signoff");
  if (!g.ok) {
    return NextResponse.json({ error: g.error }, { status: g.status });
  }

  try {
    const body = await req.json();
    const { moduleId, action } = body; // action: 'approve' | 'reject'

    if (!moduleId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const mod = await db.assessmentModule.findUnique({ where: { id: moduleId }});
    if (!mod) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const updated = await db.assessmentModule.update({
      where: { id: moduleId },
      data: {
        signOffState: action === 'approve' ? 'approved' : 'rejected'
      }
    });

    return NextResponse.json({ success: true, module: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
