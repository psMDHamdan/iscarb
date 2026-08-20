/**
 * NFR-08 — Saudi PDPL Data Residency Configuration.
 * ===========================================================================
 * GET  /api/iscarb/lecture/admin/data-residency  → read current config
 * POST /api/iscarb/lecture/admin/data-residency  → upsert configuration
 *
 * Saudi PDPL (Personal Data Protection Law) requires organizations to
 * declare:
 *   - Whether the system acts as Data Controller, Processor, or Both
 *   - Primary data residency region (Saudi KSA, GCC, or International)
 *   - Cross-border transfer rules (allowed / restricted / prohibited)
 *   - Data subject rights handling (access, rectification, erasure, portability)
 *   - Breach notification contact and SLA
 *   - DPO / Data Protection Officer contact
 *   - Processing purposes and legal basis per PDPL Article 5
 *
 * Configuration is stored in OrganizationSettings (key-value) scoped to the
 * tenant. A global default exists for tenants that haven't configured yet.
 *
 * Admin role only. All mutations are audited (NFR-02).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";

const PDPL_CONFIG_KEY = "pdpl_data_residency";

const pdplSchema = z.object({
  /** "controller" | "processor" | "both" — who controls personal data */
  role: z.enum(["controller", "processor", "both"]),
  /** "ksa" | "gcc" | "international" — where data is primarily stored */
  dataRegion: z.enum(["ksa", "gcc", "international"]),
  /** "allowed" | "restricted" | "prohibited" — cross-border data transfer */
  crossBorderTransfer: z.enum(["allowed", "restricted", "prohibited"]),
  /** List of allowed destination countries when cross-border is "restricted" */
  allowedDestinations: z.array(z.string()).default([]),
  /** Data subject rights — which PDPL rights are supported */
  subjectRights: z.object({
    access: z.boolean().default(true),
    rectification: z.boolean().default(true),
    erasure: z.boolean().default(true),
    portability: z.boolean().default(true),
    objection: z.boolean().default(true),
  }).default({
    access: true, rectification: true, erasure: true, portability: true, objection: true,
  }),
  /** Breach notification settings per PDPL Article 26 */
  breachNotification: z.object({
    /** Must notify authority within N hours per PDPL */
    slaHours: z.number().int().min(1).max(720).default(72),
    contactName: z.string().default(""),
    contactEmail: z.string().default(""),
    contactPhone: z.string().default(""),
  }).default({ slaHours: 72, contactName: "", contactEmail: "", contactPhone: "" }),
  /** DPO / Data Protection Officer */
  dpo: z.object({
    name: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
  }).default({ name: "", email: "", phone: "" }),
  /** Processing purposes per PDPL Article 5 */
  processingPurposes: z.array(z.object({
    purpose: z.string(),
    legalBasis: z.string(),
    dataCategories: z.array(z.string()),
  })).default([]),
  /** Whether the organization has completed PDPL readiness assessment */
  readinessAssessed: z.boolean().default(false),
  /** Last assessment date */
  lastAssessedAt: z.string().nullable().default(null),
});

type PdplConfig = z.infer<typeof pdplSchema>;

async function getConfig(orgId: string | null): Promise<PdplConfig> {
  const setting = await db.organizationSettings.findFirst({
    where: {
      key: PDPL_CONFIG_KEY,
      organizationId: orgId ?? "global",
    },
  });
  if (setting?.value) {
    try {
      return JSON.parse(setting.value);
    } catch {
      // fall through to default
    }
  }
  // Default config for Saudi higher-education PDPL compliance
  return {
    role: "both",
    dataRegion: "ksa",
    crossBorderTransfer: "restricted",
    allowedDestinations: [],
    subjectRights: { access: true, rectification: true, erasure: true, portability: true, objection: true },
    breachNotification: { slaHours: 72, contactName: "", contactEmail: "", contactPhone: "" },
    dpo: { name: "", email: "", phone: "" },
    processingPurposes: [
      {
        purpose: "Lecture transformation and academic quality assurance",
        legalBasis: "Legitimate academic interest (PDPL Art. 5(1)(d))",
        dataCategories: ["Course materials", "Faculty CLOs", "Student readiness scores"],
      },
      {
        purpose: "NCAAA accreditation evidence compilation",
        legalBasis: "Legal obligation (PDPL Art. 5(1)(a))",
        dataCategories: ["Course outcomes", "Assessment alignment data"],
      },
    ],
    readinessAssessed: false,
    lastAssessedAt: null,
  };
}

export const GET = guard(
  { tier: "read", roles: ["admin"] },
  async (_req: Request, ctx: GuardContext) => {
    const orgId = ctx.session.universityId ?? null;
    const config = await getConfig(orgId);

    // Compose response with residency status summary
    const residencyStatus = {
      compliant: config.dataRegion === "ksa" && config.crossBorderTransfer !== "prohibited",
      region: config.dataRegion,
      role: config.role,
      crossBorder: config.crossBorderTransfer,
      dpoConfigured: Boolean(config.dpo.name && config.dpo.email),
      breachNotificationConfigured: Boolean(config.breachNotification.contactEmail),
      readinessAssessed: config.readinessAssessed,
    };

    return NextResponse.json({ config, residencyStatus }, { status: 200 });
  }
);

export const POST = guard(
  { tier: "write", roles: ["admin"] },
  async (req: Request, ctx: GuardContext) => {
    const orgId = ctx.session.universityId ?? null;
    const tenantId = orgId ?? "global";

    const body = await req.json().catch(() => null);
    const parsed = pdplSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid PDPL configuration", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const config = parsed.data;

    // Upsert into OrganizationSettings
    const existing = await db.organizationSettings.findFirst({
      where: { key: PDPL_CONFIG_KEY, organizationId: tenantId },
    });

    if (existing) {
      await db.organizationSettings.update({
        where: { id: existing.id },
        data: { value: JSON.stringify(config), category: "compliance" },
      });
    } else {
      await db.organizationSettings.create({
        data: {
          organizationId: tenantId,
          key: PDPL_CONFIG_KEY,
          value: JSON.stringify(config),
          category: "compliance",
          description: "Saudi PDPL data residency configuration per NFR-08",
        },
      });
    }

    // Audit the PDPL config change
    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: "pdpl_config_updated",
        entityType: "OrganizationSettings",
        entityId: PDPL_CONFIG_KEY,
        category: "GOVERNANCE",
        severity: "info",
        organizationId: orgId,
        details: {
          dataRegion: config.dataRegion,
          role: config.role,
          crossBorderTransfer: config.crossBorderTransfer,
          dpoConfigured: Boolean(config.dpo.name),
        },
      },
    });

    return NextResponse.json({ config }, { status: 200 });
  }
);
