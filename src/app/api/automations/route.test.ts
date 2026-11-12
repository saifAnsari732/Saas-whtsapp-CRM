import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

const mockFirestoreData = new Map<string, any>()

vi.mock('@/lib/firebase/auth-helper', () => ({
  getAccountContext: vi.fn(),
}))

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: (name: string) => {
      if (name === 'accounts') {
        return {
          doc: (_accId: string) => ({
            collection: (_subName: string) => ({
              get: async () => ({
                docs: Array.from(mockFirestoreData.entries()).map(([id, d]) => ({
                  id,
                  data: () => d,
                })),
              }),
              doc: (docId: string) => ({
                set: async (data: any) => {
                  mockFirestoreData.set(docId, data)
                },
              }),
            }),
          }),
        }
      }
      return {
        where: () => ({
          get: async () => ({ docs: [] }),
        }),
        doc: (docId: string) => ({
          set: async (data: any) => {
            mockFirestoreData.set(docId, data)
          },
        }),
      }
    },
  })),
  cleanForFirestore: (obj: any) => obj,
}))

vi.mock('@/lib/automations/admin-client', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: () => ({
      insert: async () => ({ error: null }),
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  })),
}))

import { getAccountContext } from '@/lib/firebase/auth-helper'

describe('/api/automations route handler', () => {
  beforeEach(() => {
    mockFirestoreData.clear()
    vi.clearAllMocks()
  })

  it('returns 401 on GET when unauthenticated', async () => {
    vi.mocked(getAccountContext).mockResolvedValue(null)
    const req = new Request('http://localhost/api/automations')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 on POST when unauthenticated', async () => {
    vi.mocked(getAccountContext).mockResolvedValue(null)
    const req = new Request('http://localhost/api/automations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Auto 1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 on POST when required fields are missing', async () => {
    vi.mocked(getAccountContext).mockResolvedValue({
      user: { uid: 'usr-1', email: 'test@example.com' },
      accountId: 'acct-1',
      accountRole: 'owner',
    })
    const req = new Request('http://localhost/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates automation from template slug and expands flat seeds into tree structure', async () => {
    vi.mocked(getAccountContext).mockResolvedValue({
      user: { uid: 'usr-1', email: 'test@example.com' },
      accountId: 'acct-1',
      accountRole: 'owner',
    })
    const req = new Request('http://localhost/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'welcome_message',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.automation).toBeDefined()
    expect(json.automation.name).toBe('Welcome Message')
    expect(json.automation.trigger_type).toBe('first_inbound_message')
    expect(Array.isArray(json.automation.steps)).toBe(true)
    expect(json.automation.steps.length).toBeGreaterThan(0)
  })
})
