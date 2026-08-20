import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with roles and permissions...')

  // Clear existing data (optional - comment out to preserve existing data)
  await Promise.all([
    prisma.rolePermissions.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.role.deleteMany(),
  ])

  // Define default permissions
  const permissions = [
    // User management
    { name: 'user:read', description: 'View user profiles', resource: 'user', action: 'read' },
    { name: 'user:create', description: 'Create new user accounts', resource: 'user', action: 'create' },
    { name: 'user:update', description: 'Modify user information', resource: 'user', action: 'update' },
    { name: 'user:delete', description: 'Remove user accounts', resource: 'user', action: 'delete' },

    // Role management
    { name: 'role:read', description: 'View role definitions', resource: 'role', action: 'read' },
    { name: 'role:create', description: 'Create new roles', resource: 'role', action: 'create' },
    { name: 'role:update', description: 'Modify role definitions', resource: 'role', action: 'update' },
    { name: 'role:delete', description: 'Remove roles', resource: 'role', action: 'delete' },

    // Course management
    { name: 'course:read', description: 'View course information', resource: 'course', action: 'read' },
    { name: 'course:create', description: 'Create new courses', resource: 'course', action: 'create' },
    { name: 'course:update', description: 'Modify course information', resource: 'course', action: 'update' },
    { name: 'course:delete', description: 'Remove courses', resource: 'course', action: 'delete' },

    // Assessment management
    { name: 'assessment:read', description: 'View assessment results', resource: 'assessment', action: 'read' },
    { name: 'assessment:create', description: 'Create new assessments', resource: 'assessment', action: 'create' },
    { name: 'assessment:update', description: 'Modify assessments', resource: 'assessment', action: 'update' },
    { name: 'assessment:delete', description: 'Remove assessments', resource: 'assessment', action: 'delete' },

    // Portfolio management
    { name: 'portfolio:read', description: 'View student portfolios', resource: 'portfolio', action: 'read' },
    { name: 'portfolio:create', description: 'Create student portfolios', resource: 'portfolio', action: 'create' },
    { name: 'portfolio:update', description: 'Update student portfolios', resource: 'portfolio', action: 'update' },
    { name: 'portfolio:delete', description: 'Delete student portfolios', resource: 'portfolio', action: 'delete' },

    // Admin settings
    { name: 'settings:read', description: 'View system settings', resource: 'settings', action: 'read' },
    { name: 'settings:update', description: 'Modify system settings', resource: 'settings', action: 'update' },

    // Analytics
    { name: 'analytics:view', description: 'View analytics and reports', resource: 'analytics', action: 'view' },
    { name: 'analytics:export', description: 'Export analytics data', resource: 'analytics', action: 'export' },

    // System administration
    { name: 'system:admin', description: 'Full system access', resource: 'system', action: 'admin' },

    // Research
    { name: 'research:read', description: 'View research projects', resource: 'research', action: 'read' },
    { name: 'research:create', description: 'Create research projects', resource: 'research', action: 'create' },
    { name: 'research:update', description: 'Update research projects', resource: 'research', action: 'update' },
    { name: 'research:delete', description: 'Delete research projects', resource: 'research', action: 'delete' },

    // Career / Jobs
    { name: 'career:read', description: 'View job postings', resource: 'career', action: 'read' },
    { name: 'career:create', description: 'Create job postings', resource: 'career', action: 'create' },
    { name: 'career:update', description: 'Update job postings', resource: 'career', action: 'update' },
    { name: 'career:delete', description: 'Delete job postings', resource: 'career', action: 'delete' },

    // Auditing
    { name: 'audit:read', description: 'Read audit logs', resource: 'audit', action: 'read' },
    { name: 'export:data', description: 'Export data', resource: 'export', action: 'data' },

    // API / Developer
    { name: 'api:read', description: 'View API documentation', resource: 'api', action: 'read' },
    { name: 'api:create', description: 'Create API keys', resource: 'api', action: 'create' },
    { name: 'api:update', description: 'Update API keys', resource: 'api', action: 'update' },
    { name: 'api:delete', description: 'Delete API keys', resource: 'api', action: 'delete' },

    // Partner
    { name: 'partner:read', description: 'View partner data', resource: 'partner', action: 'read' },
    { name: 'partner:create', description: 'Create partner content', resource: 'partner', action: 'create' },
    { name: 'partner:update', description: 'Update partner content', resource: 'partner', action: 'update' },
  ]

  // Create permissions
  const createdPermissions = {}
  for (const permData of permissions) {
    const perm = await prisma.permission.upsert({
      where: { name: permData.name },
      update: {},
      create: permData,
    })
    createdPermissions[permData.name] = perm
  }

  // Define default roles with their permissions
  const rolesWithPermissions = [
    {
      name: 'Student',
      description: 'Enrolled student with access to learning materials',
      permissions: [
        'user:read', 'course:read', 'assessment:read',
        'portfolio:create', 'portfolio:read', 'portfolio:update', 'portfolio:delete',
      ],
    },
    {
      name: 'Faculty',
      description: 'Teaching faculty member with course and assessment management',
      permissions: [
        'user:read', 'course:read', 'course:create', 'course:update',
        'assessment:read', 'assessment:create', 'assessment:update', 'portfolio:read',
      ],
    },
    {
      name: 'Recruiter',
      description: 'University career/placement officer',
      permissions: [
        'user:read', 'portfolio:read', 'analytics:view',
        'career:read', 'career:create', 'career:update',
      ],
    },
    {
      name: 'Dean',
      description: 'College/department dean with administrative oversight',
      permissions: [
        'user:read', 'user:create', 'user:update',
        'course:read', 'course:create', 'course:update',
        'assessment:read', 'assessment:create',
      ],
    },
    {
      name: 'University Admin',
      description: 'Top-level university administrator (Provost/Registrar)',
      permissions: [
        'user:read', 'user:create', 'user:update',
        'course:read', 'course:create', 'course:update',
        'assessment:read', 'portfolio:read',
        'settings:read', 'settings:update', 'analytics:view', 'analytics:export',
        'career:read', 'audit:read',
      ],
    },
    {
      name: 'Super Admin',
      description: 'System super administrator with unrestricted access',
      permissions: Object.keys(createdPermissions).map(name => name),
    },
    {
      name: 'System Admin',
      description: 'Platform operator with full system management access',
      permissions: Object.keys(createdPermissions).map(name => name),
    },
    {
      name: 'IT/Ops',
      description: 'Technical staff for infrastructure and operations',
      permissions: [
        'user:read', 'user:update', 'settings:read', 'settings:update',
        'analytics:view', 'system:admin', 'audit:read',
      ],
    },
    {
      name: 'Researcher',
      description: 'Research-focused faculty or student',
      permissions: [
        'user:read', 'course:read', 'assessment:read', 'portfolio:read',
        'analytics:view',
      ],
    },
    {
      name: 'Developer',
      description: 'External or internal developer extending the platform',
      permissions: [
        'user:read', 'settings:read', 'analytics:view',
      ],
    },
    {
      name: 'Partner',
      description: 'Institutional or corporate partner',
      permissions: [
        'user:read', 'course:read', 'course:create', 'course:update',
        'portfolio:read', 'analytics:view',
      ],
    },
    {
      name: 'Alumni',
      description: 'Graduate with continuing access to platform',
      permissions: [
        'user:read', 'course:read', 'portfolio:read', 'portfolio:update',
        'career:read', 'analytics:view',
      ],
    },
    {
      name: 'Employer',
      description: 'Company representative posting opportunities',
      permissions: [
        'user:read', 'portfolio:read',
        'career:read', 'career:create', 'career:update', 'career:delete',
        'analytics:view',
      ],
    },
    {
      name: 'Auditor',
      description: 'Compliance auditor with read-only access',
      permissions: [
        'user:read', 'course:read', 'assessment:read', 'portfolio:read',
        'settings:read', 'analytics:view', 'analytics:export', 'audit:read',
      ],
    },
  ]

  // Create roles and assign permissions
  for (const roleData of rolesWithPermissions) {
    const role = await prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        permissions: {
          connect: roleData.permissions.map((permissionName) => ({
            name: permissionName,
          })),
        },
      },
    })
    console.log(`Created role: ${role.name} with ${roleData.permissions.length} permissions`)
  }

  console.log('Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })