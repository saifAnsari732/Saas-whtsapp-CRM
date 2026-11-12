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
                collection: (_subSub: string) => ({
                  doc: (_nId: string) => ({
                    set: async () => {},
                  }),
                }),
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
    batch: () => ({
      set: () => {},
      commit: async () => {},
    }),
  })),
  cleanForFirestore: (obj: any) => obj,
}))

vi.mock('@/lib/flows/admin-client', () => ({
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

describe('/api/flows route handler', () => {
  beforeEach(() => {
    mockFirestoreData.clear()
    vi.clearAllMocks()
  })

  it('returns 401 on GET when unauthenticated', async () => {
    vi.mocked(getAccountContext).mockResolvedValue(null)
    const req = new Request('http://localhost/api/flows')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 on POST when unauthenticated', async () => {
    vi.mocked(getAccountContext).mockResolvedValue(null)
    const req = new Request('http://localhost/api/flows', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Flow' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 on POST when name is missing for blank flow', async () => {
    vi.mocked(getAccountContext).mockResolvedValue({
      user: { uid: 'usr-1', email: 'test@example.com' },
      accountId: 'acct-1',
      accountRole: 'owner',
    })
    const req = new Request('http://localhost/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('name is required')
  })

  it('creates a blank flow with start_1 node and next_node_key initialized', async () => {
    vi.mocked(getAccountContext).mockResolvedValue({
      user: { uid: 'usr-1', email: 'test@example.com' },
      accountId: 'acct-1',
      accountRole: 'owner',
    })
    const req = new Request('http://localhost/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'My Inbound Flow',
        trigger_type: 'keyword',
        trigger_config: { keywords: ['hi', 'hello'] },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.flow).toBeDefined()
    expect(json.flow.name).toBe('My Inbound Flow')
    expect(json.flow.status).toBe('draft')
    expect(json.flow.entry_node_id).toBe('start_1')
    expect(json.flow.nodes).toHaveLength(1)
    expect(json.flow.nodes[0].node_type).toBe('start')
    expect(json.flow.nodes[0].config).toEqual({ next_node_key: '' })

    // Verify it can be listed via GET
    const getReq = new Request('http://localhost/api/flows')
    const getRes = await GET(getReq)
    expect(getRes.status).toBe(200)
    const getJson = await getRes.json()
    expect(getJson.flows).toHaveLength(1)
    expect(getJson.flows[0].name).toBe('My Inbound Flow')
  })
})
