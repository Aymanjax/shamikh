import { collections, Timestamp } from "./firestore";

export async function log(
  action: string,
  adminUid: string,
  details?: string,
  targetUid?: string
): Promise<void> {
  await collections.auditLogs.add({
    action,
    adminUid,
    targetUid,
    details,
    createdAt: Timestamp.now(),
  });
}
