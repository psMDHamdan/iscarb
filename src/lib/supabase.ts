/**
 * Supabase Client Helper
 * Provides Supabase client instance and connection configuration for iSCARB.
 */

import { PrismaClient } from '@prisma/client';

// Global Prisma instance for Supabase PostgreSQL (via transaction pooler or direct connection)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

import { createClient } from '@supabase/supabase-js';

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, anonKey, serviceRoleKey };
}

export const supabaseClient = createClient(
  getSupabaseConfig().url,
  getSupabaseConfig().anonKey
);
