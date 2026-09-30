import { getAdminDb } from "@/lib/firebase/admin";
import { Collections } from "@/lib/firebase/db-collections";
import { FieldValue } from "firebase-admin/firestore";

export class ContactTagWriteError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ContactTagWriteError";
    this.status = status;
  }
}

interface ContactTagWriteInput {
  accountId: string;
  contactId: string;
  tagId: string;
}

async function assertContactAndTagOwnership(
  db: FirebaseFirestore.Firestore,
  input: ContactTagWriteInput
): Promise<{ tagData: any }> {
  const contactRef = db.doc(`accounts/${input.accountId}/contacts/${input.contactId}`);
  const tagRef = db.doc(`accounts/${input.accountId}/tags/${input.tagId}`);

  const [contactSnap, tagSnap] = await Promise.all([
    contactRef.get(),
    tagRef.get(),
  ]);

  if (!contactSnap.exists) {
    throw new ContactTagWriteError("Contact not found", 404);
  }
  if (!tagSnap.exists) {
    throw new ContactTagWriteError("Tag not found", 404);
  }

  return { tagData: { id: tagSnap.id, ...tagSnap.data() } };
}

export async function addContactTagIfAbsent(
  _db: any,
  input: ContactTagWriteInput
): Promise<boolean> {
  const db = getAdminDb();
  const { tagData } = await assertContactAndTagOwnership(db, input);

  const contactRef = db.doc(`accounts/${input.accountId}/contacts/${input.contactId}`);
  const contactSnap = await contactRef.get();
  const existingTags = (contactSnap.data()?.tags as any[]) || [];

  const alreadyHasTag = existingTags.some((t: any) => t.id === input.tagId);
  if (alreadyHasTag) return false;

  await contactRef.update({
    tags: FieldValue.arrayUnion({
      id: tagData.id,
      name: tagData.name,
      color: tagData.color || "#3b82f6",
    }),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return true;
}

export async function removeContactTag(
  _db: any,
  input: ContactTagWriteInput
): Promise<void> {
  const db = getAdminDb();
  const { tagData } = await assertContactAndTagOwnership(db, input);

  const contactRef = db.doc(`accounts/${input.accountId}/contacts/${input.contactId}`);
  const contactSnap = await contactRef.get();
  const existingTags = (contactSnap.data()?.tags as any[]) || [];

  const updatedTags = existingTags.filter((t: any) => t.id !== input.tagId);

  await contactRef.update({
    tags: updatedTags,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
