import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from './route'

const mockFirestoreTemplates = new Map<string, any>()

vi.mock('@/lib/firebase/auth-helper', () => ({
  getAccountContext: vi.fn(),
}))

vi.mock('@/lib/whatsapp/get-config', () => ({
  getWhatsAppConfigForAccount: vi.fn(async () => null),
}))

vi.mock('@/lib/whatsapp/meta-api', () => ({
  editMessageTemplate: vi.fn(),
  submitMessageTemplate: vi.fn(async () => ({ id: 'meta-123456789012', status: 'PENDING' })),
  deleteMessageTemplate: vi.fn(),
}))

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: (name: string) => {
      if (name === 'accounts') {
        return {
          doc: (_accId: string) => ({
            collection: (_subName: string) => ({
              doc: (docId: string) => ({
                get: async () => ({
                  exists: mockFirestoreTemplates.has(docId),
                  id: docId,
                  data: () => mockFirestoreTemplates.get(docId),
                }),
                set: async (data: any) => {
                  mockFirestoreTemplates.set(docId, { ...mockFirestoreTemplates.get(docId), ...data })
                },
              }),
              where: (field: string, _op: string, val: any) => ({
                limit: () => ({
                  get: async () => {
                    const match = Array.from(mockFirestoreTemplates.entries()).find(
                      ([_, d]) => d[field] === val,
                    )
                    return {
                      empty: !match,
                      docs: match ? [{ id: match[0], data: () => match[1] }] : [],
                    }
                  },
                }),
              }),
            }),
          }),
        }
      }
      return {
        doc: (docId: string) => ({
          get: async () => ({
            exists: mockFirestoreTemplates.has(docId),
            id: docId,
            data: () => mockFirestoreTemplates.get(docId),
          }),
          set: async (data: any) => {
            mockFirestoreTemplates.set(docId, { ...mockFirestoreTemplates.get(docId), ...data })
          },
        }),
        where: (field: string, _op: string, val: any) => ({
          limit: () => ({
            get: async () => {
              const match = Array.from(mockFirestoreTemplates.entries()).find(
                ([_, d]) => d[field] === val,
              )
              return {
                empty: !match,
                docs: match ? [{ id: match[0], data: () => match[1] }] : [],
              }
            },
          }),
        }),
      }
    },
  })),
  cleanForFirestore: (obj: any) => obj,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null }),
        }),
        or: () => ({
          maybeSingle: async () => ({ data: null }),
        }),
      }),
      update: () => ({ eq: async () => ({}) }),
    }),
  })),
}))

import { getAccountContext } from '@/lib/firebase/auth-helper'

describe('/api/whatsapp/templates/[id] route handler', () => {
  beforeEach(() => {
    mockFirestoreTemplates.clear()
    vi.clearAllMocks()
  })

  it('rejects with 400 on invalid or null/undefined id', async () => {
    vi.mocked(getAccountContext).mockResolvedValue({
      user: { uid: 'usr-1', email: 'test@example.com' },
      accountId: 'acct-1',
      accountRole: 'owner',
    })
    const req = new Request('http://localhost/api/whatsapp/templates/undefined', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'undefined' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid template id.')
  })

  it('resolves template by name and formats toll-free buttons with +91', async () => {
    vi.mocked(getAccountContext).mockResolvedValue({
      user: { uid: 'usr-1', email: 'test@example.com' },
      accountId: 'acct-1',
      accountRole: 'owner',
    })

    // Seed existing template under its docId
    const docId = 'acct-1_order_confirmed_en_US'
    mockFirestoreTemplates.set(docId, {
      id: docId,
      name: 'order_confirmed',
      category: 'Utility',
      language: 'en_US',
      status: 'APPROVED',
      body_text: 'Your order is confirmed',
      buttons: [],
    })

    const req = new Request(`http://localhost/api/whatsapp/templates/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'order_confirmed',
        category: 'Utility',
        language: 'en_US',
        body_text: 'Your order is confirmed. Call our support:',
        buttons: [
          { type: 'PHONE_NUMBER', text: 'Call Us', phone_number: '18008890860' },
        ],
      }),
    })

    const res = await PATCH(req, { params: Promise.resolve({ id: docId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.template.buttons).toEqual([
      { type: 'PHONE_NUMBER', text: 'Call Us', phone_number: '+9118008890860' },
    ])
  })
})
