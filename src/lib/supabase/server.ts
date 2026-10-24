// ============================================================
// Safe Stub Supabase Server Client — 100% Pure Firebase Architecture
// ============================================================
import { createClient as createBrowserStub } from './client';

export async function createClient(): Promise<any> {
  return createBrowserStub();
}
