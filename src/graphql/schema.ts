/**
 * iSCARB GraphQL Schema — IDD-08 APIs & Event Architecture
 * ===========================================================================
 * Complete GraphQL type definitions for the Identity Platform.
 * ===========================================================================
 */

export const typeDefs = `
  # ─── Scalar Types ────────────────────────────────────────────────────────
  scalar DateTime
  scalar JSON

  # ─── Enums ───────────────────────────────────────────────────────────────
  enum OrganizationType {
    UNIVERSITY
    COMPANY
    HOSPITAL
    GOVERNMENT
    SCHOOL
    RESEARCH_INSTITUTE
  }

  enum OrganizationStatus {
    ACTIVE
    SUSPENDED
    ARCHIVED
    PENDING
  }

  enum UserStatus {
    ACTIVE
    SUSPENDED
    INACTIVE
    DELETED
  }

  enum AuditCategory {
    AUTHENTICATION
    AUTHORIZATION
    USER_MANAGEMENT
    ROLE_MANAGEMENT
    ORGANIZATION
    DATA_ACCESS
    DATA_MODIFICATION
    SECURITY
    SYSTEM
    COMPLIANCE
  }

  enum AuditSeverity {
    INFO
    WARNING
    ERROR
    CRITICAL
  }

  enum MfaMethod {
    TOTP
    SMS
    FIDO2
    EMAIL
  }

  enum DelegationStatus {
    ACTIVE
    EXPIRED
    REVOKED
  }

  enum ApprovalStatus {
    PENDING
    APPROVED
    REJECTED
    CANCELLED
  }

  # ─── Types ───────────────────────────────────────────────────────────────
  type User {
    id: ID!
    name: String
    email: String
    role: String!
    status: UserStatus!
    organization: Organization
    roles: [Role!]!
    permissions: [String!]!
    mfaEnabled: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Organization {
    id: ID!
    name: String!
    nameAr: String
    slug: String!
    type: OrganizationType!
    status: OrganizationStatus!
    parent: Organization
    children: [Organization!]!
    members: [User!]!
    settings: [OrganizationSetting!]!
    campusCount: Int!
    facultyCount: Int!
    departmentCount: Int!
    programCount: Int!
    teamCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrganizationSetting {
    id: ID!
    key: String!
    value: String!
    category: String!
  }

  type Role {
    id: ID!
    name: String!
    description: String
    isSystem: Boolean!
    organization: Organization
    permissions: [Permission!]!
    userCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Permission {
    id: ID!
    name: String!
    resource: String!
    action: String!
    description: String
  }

  type MfaSettings {
    enabled: Boolean!
    method: MfaMethod
    backupCodesRemaining: Int
  }

  type TrustedDevice {
    id: ID!
    name: String
    userAgent: String
    ipAddress: String
    lastUsedAt: DateTime!
    createdAt: DateTime!
  }

  type ApiKey {
    id: ID!
    name: String!
    keyPrefix: String!
    scopes: [String!]!
    rateLimit: Int!
    expiresAt: DateTime
    lastUsedAt: DateTime
    active: Boolean!
    createdAt: DateTime!
  }

  type AuditLog {
    id: ID!
    actor: User
    action: String!
    entityType: String!
    entityId: String
    category: AuditCategory!
    severity: AuditSeverity!
    ipAddress: String
    details: JSON
    createdAt: DateTime!
  }

  type AccessReview {
    id: ID!
    name: String!
    description: String
    status: String!
    reviewType: String!
    dueDate: DateTime
    completedAt: DateTime
    items: [AccessReviewItem!]!
    createdAt: DateTime!
  }

  type AccessReviewItem {
    id: ID!
    user: User!
    role: Role!
    status: String!
    certifiedBy: String
    certifiedAt: DateTime
  }

  type ComplianceReport {
    id: ID!
    type: String!
    title: String!
    description: String
    status: String!
    generatedAt: DateTime
    createdAt: DateTime!
  }

  type Incident {
    id: ID!
    title: String!
    description: String!
    severity: String!
    status: String!
    category: String!
    detectedAt: DateTime!
    resolvedAt: DateTime
  }

  type Delegation {
    id: ID!
    delegator: User!
    delegatee: User!
    permissions: [String!]!
    reason: String
    startsAt: DateTime!
    expiresAt: DateTime!
    status: DelegationStatus!
    createdAt: DateTime!
  }

  type ApprovalRequest {
    id: ID!
    flow: ApprovalFlow!
    requester: User!
    operationType: String!
    justification: String
    status: ApprovalStatus!
    currentStep: Int!
    decisions: [ApprovalDecision!]!
    createdAt: DateTime!
  }

  type ApprovalFlow {
    id: ID!
    name: String!
    description: String
    operationType: String!
    isActive: Boolean!
  }

  type ApprovalDecision {
    id: ID!
    approver: User!
    decision: String!
    comment: String
    decidedAt: DateTime!
  }

  type ActivityTimeline {
    id: ID!
    actor: User
    action: String!
    entityType: String!
    entityId: String
    category: String!
    severity: String!
    createdAt: DateTime!
  }

  type IdentityAnalytics {
    users: UserAnalytics!
    mfa: MfaAnalytics!
    login: LoginAnalytics!
    audit: AuditAnalytics!
  }

  type UserAnalytics {
    total: Int!
    byStatus: JSON!
    byRole: JSON!
  }

  type MfaAnalytics {
    enabled: Int!
    adoptionRate: Float!
  }

  type LoginAnalytics {
    successRate: Float!
    recentAttempts: Int!
  }

  type AuditAnalytics {
    totalEvents: Int!
  }

  type Group {
    id: ID!
    name: String!
    description: String
    type: String!
    memberCount: Int!
    createdAt: DateTime!
  }

  type Program {
    id: ID!
    name: String!
    nameAr: String
    code: String
    status: String!
    createdAt: DateTime!
  }

  type Team {
    id: ID!
    name: String!
    nameAr: String
    description: String
    status: String!
    createdAt: DateTime!
  }

  # ─── Pagination ──────────────────────────────────────────────────────────
  type UserConnection {
    data: [User!]!
    pagination: Pagination!
  }

  type OrganizationConnection {
    data: [Organization!]!
    pagination: Pagination!
  }

  type Pagination {
    after: String
    limit: Int!
    total: Int!
    hasMore: Boolean!
  }

  # ─── Input Types ─────────────────────────────────────────────────────────
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: String
    organizationId: ID
  }

  input UpdateUserInput {
    name: String
    email: String
    role: String
    status: UserStatus
  }

  input CreateOrganizationInput {
    name: String!
    nameAr: String
    slug: String!
    type: OrganizationType!
    parentId: ID
    countryId: ID
    website: String
    email: String
  }

  input UpdateOrganizationInput {
    name: String
    nameAr: String
    status: OrganizationStatus
    website: String
    email: String
  }

  input CreateRoleInput {
    name: String!
    description: String
    permissionIds: [ID!]
    organizationId: ID
  }

  input UpdateRoleInput {
    name: String
    description: String
    permissionIds: [ID!]
  }

  input CreateAbacPolicyInput {
    name: String!
    effect: String!
    resource: String!
    permission: String!
    conditionExpression: String
    priority: Int
  }

  input CertificationDecision {
    itemId: ID!
    decision: String!
    notes: String
  }

  input ConsentInput {
    purpose: String!
    granted: Boolean!
    scope: String
  }

  # ─── Queries ─────────────────────────────────────────────────────────────
  type Query {
    # Users
    users(organizationId: ID, role: String, status: UserStatus, search: String, after: String, limit: Int): UserConnection!
    user(id: ID!): User
    
    # Organizations
    organizations(type: OrganizationType, status: OrganizationStatus, search: String, after: String, limit: Int): OrganizationConnection!
    organization(id: ID!): Organization
    organizationTree(rootId: ID): [Organization!]!
    
    # Roles
    roles(organizationId: ID, search: String, limit: Int): [Role!]!
    role(id: ID!): Role
    
    # Permissions
    permissions(resource: String, limit: Int): [Permission!]!
    
    # Groups
    groups(search: String, limit: Int): [Group!]!
    
    # Programs
    programs(organizationId: ID, limit: Int): [Program!]!
    
    # Teams
    teams(organizationId: ID, limit: Int): [Team!]!
    
    # Audit
    auditLogs(entityType: String, entityId: ID, category: AuditCategory, severity: AuditSeverity, after: String, limit: Int): [AuditLog!]!
    auditTrail(entityType: String!, entityId: ID!, limit: Int): [AuditLog!]!
    
    # Activity
    activityTimeline(userId: ID, limit: Int): [ActivityTimeline!]!
    
    # Security
    mfaStatus: MfaSettings!
    trustedDevices: [TrustedDevice!]!
    apiKeys: [ApiKey!]!
    
    # Access Reviews
    accessReviews(status: String, limit: Int): [AccessReview!]!
    accessReview(id: ID!): AccessReview
    
    # Compliance
    complianceReports(type: String, status: String, limit: Int): [ComplianceReport!]!
    incidents(severity: String, status: String, category: String, limit: Int): [Incident!]!
    
    # Delegations
    delegations: [Delegation!]!
    
    # Approvals
    approvalRequests(status: ApprovalStatus, limit: Int): [ApprovalRequest!]!
    pendingApprovals: [ApprovalRequest!]!
    
    # Analytics
    identityAnalytics: IdentityAnalytics!
  }

  # ─── Mutations ───────────────────────────────────────────────────────────
  type Mutation {
    # Users
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    suspendUser(id: ID!): User!
    activateUser(id: ID!): User!
    assignRole(userId: ID!, roleId: ID!, expiresAt: DateTime): Boolean!
    revokeRole(userId: ID!, roleId: ID!): Boolean!
    
    # Organizations
    createOrganization(input: CreateOrganizationInput!): Organization!
    updateOrganization(id: ID!, input: UpdateOrganizationInput!): Organization!
    archiveOrganization(id: ID!): Boolean!
    
    # Roles
    createRole(input: CreateRoleInput!): Role!
    updateRole(id: ID!, input: UpdateRoleInput!): Role!
    deleteRole(id: ID!): Boolean!
    assignPermission(roleId: ID!, permissionId: ID!): Boolean!
    revokePermission(roleId: ID!, permissionId: ID!): Boolean!
    
    # Security
    setupMfa(method: MfaMethod!): JSON!
    verifyMfa(code: String!): Boolean!
    disableMfa: Boolean!
    trustDevice(fingerprint: String!, name: String): TrustedDevice!
    revokeDevice(id: ID!): Boolean!
    createApiKey(name: String!, scopes: [String!]!, expiresInDays: Int): JSON!
    revokeApiKey(id: ID!): Boolean!
    
    # Groups
    createGroup(name: String!, description: String, type: String): Group!
    addGroupMember(groupId: ID!, userId: ID!, role: String): Boolean!
    removeGroupMember(groupId: ID!, memberId: ID!): Boolean!
    
    # Access Reviews
    createAccessReview(name: String!, description: String, reviewType: String, dueDate: DateTime): AccessReview!
    certifyAccessReview(reviewId: ID!, decisions: [CertificationDecision!]!): Boolean!
    
    # Compliance
    recordConsent(input: ConsentInput!): Boolean!
    revokeConsent(id: ID!): Boolean!
    generateComplianceReport(type: String!, title: String!): ComplianceReport!
    
    # Delegation
    createDelegation(delegateeId: ID!, permissions: [String!]!, reason: String, expiresInDays: Int): Delegation!
    revokeDelegation(id: ID!): Boolean!
    
    # Approvals
    createApprovalRequest(flowId: ID!, operationType: String!, operationData: JSON!, justification: String): ApprovalRequest!
    decideApproval(requestId: ID!, decision: String!, comment: String): Boolean!
    
    # Impersonation
    startImpersonation(userId: ID!, reason: String!): Boolean!
    stopImpersonation: Boolean!
  }
`;

export default typeDefs;
