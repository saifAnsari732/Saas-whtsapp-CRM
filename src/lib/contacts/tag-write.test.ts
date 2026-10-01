import { describe, expect, it, vi, beforeEach } from 'vitest';
import { addContactTagIfAbsent } from './tag-write';

const h = vi.hoisted(() => ({
  contactExists: true,
  tagExists: true,
  contactTags: [] as any[],
  updateFn: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    arrayUnion: (...args: any[]) => ({ type: 'arrayUnion', args }),
    serverTimestamp: () => 'SERVER_TIMESTAMP',
  },
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    doc: (path: string) => {
      const isContact = path.includes('/contacts/');
      const isTag = path.includes('/tags/');
      return {
        get: async () => {
          if (isContact) {
            return {
              exists: h.contactExists,
              id: path.split('/').pop(),
              data: () => ({ tags: h.contactTags }),
            };
          }
          if (isTag) {
            return {
              exists: h.tagExists,
              id: path.split('/').pop(),
              data: () => ({ name: 'VIP', color: '#ff0000' }),
            };
          }
          return { exists: false, data: () => null };
        },
        update: h.updateFn,
      };
    },
  }),
}));

const input = {
  accountId: 'account-1',
  contactId: 'contact-1',
  tagId: 'tag-1',
};

describe('addContactTagIfAbsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.contactExists = true;
    h.tagExists = true;
    h.contactTags = [];
    h.updateFn.mockResolvedValue(undefined);
  });

  it('returns true and updates contact when tag is absent', async () => {
    const res = await addContactTagIfAbsent(null, input);
    expect(res).toBe(true);
    expect(h.updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.anything(),
        updatedAt: 'SERVER_TIMESTAMP',
      })
    );
  });

  it('returns false when contact already has tag', async () => {
    h.contactTags = [{ id: 'tag-1', name: 'VIP' }];
    const res = await addContactTagIfAbsent(null, input);
    expect(res).toBe(false);
    expect(h.updateFn).not.toHaveBeenCalled();
  });

  it('refuses contacts and tags outside the account', async () => {
    h.contactExists = false;
    await expect(addContactTagIfAbsent(null, input)).rejects.toMatchObject({ status: 404 });

    h.contactExists = true;
    h.tagExists = false;
    await expect(addContactTagIfAbsent(null, input)).rejects.toMatchObject({ status: 404 });
  });
});
