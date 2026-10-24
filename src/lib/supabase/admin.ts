// ============================================================
// Safe Stub Supabase Admin Client — 100% Pure Firebase Architecture
// ============================================================
import { createClient as createBrowserStub } from './client';

export function createAdminClient(): any {
  return createBrowserStub();
}
