import { Router, type IRouter, type Request, type Response } from "express";
import { db, pointsTable, pointsHistoryTable, appConfigTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getConfig(key: string): Promise<string | null> {
  const rows = await db.select().from(appConfigTable).where(eq(appConfigTable.key, key));
  return rows[0]?.value ?? null;
}

async function setConfig(key: string, value: string): Promise<void> {
  await db
    .insert(appConfigTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: appConfigTable.key, set: { value } });
}

export async function getAdminId(): Promise<string | null> {
  const envId = process.env.ADMIN_USER_ID;
  if (envId) return envId;
  return getConfig("admin_id");
}

export async function getCousinId(): Promise<string | null> {
  return getConfig("cousin_id");
}

async function ensurePoints(userId: string, initialPoints = 0) {
  await db.insert(pointsTable).values({ userId, points: initialPoints }).onConflictDoNothing();
  const [row] = await db.select().from(pointsTable).where(eq(pointsTable.userId, userId));
  return row;
}

router.get("/points/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const cousinId = await getCousinId();
  const initialPoints = req.user.id === cousinId ? 500 : 0;
  const row = await ensurePoints(req.user.id, initialPoints);
  res.json({ userId: req.user.id, points: row?.points ?? initialPoints });
});

router.get("/points/history", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const adminId = await getAdminId();
  let userId = req.user.id;
  if (req.user.id === adminId) {
    const cousinId = await getCousinId();
    if (cousinId) userId = cousinId;
  }
  const entries = await db
    .select()
    .from(pointsHistoryTable)
    .where(eq(pointsHistoryTable.userId, userId))
    .orderBy(pointsHistoryTable.createdAt);
  res.json({ entries: entries.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })) });
});

router.post("/points/adjust", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const adminId = await getAdminId();
  if (req.user.id !== adminId) {
    res.status(403).json({ error: "Only admin can adjust points" });
    return;
  }
  const cousinId = await getCousinId();
  if (!cousinId) {
    res.status(400).json({ error: "Cousin not configured yet" });
    return;
  }

  const { amount, reason } = req.body as { amount: number; reason: string };
  if (typeof amount !== "number" || !reason) {
    res.status(400).json({ error: "amount and reason required" });
    return;
  }

  const current = await ensurePoints(cousinId, 500);
  const newPoints = Math.max(0, (current?.points ?? 500) + amount);
  await db.update(pointsTable).set({ points: newPoints }).where(eq(pointsTable.userId, cousinId));

  await db.insert(pointsHistoryTable).values({
    userId: cousinId,
    amount,
    reason,
  });

  const sign = amount >= 0 ? "+" : "";
  await db.insert(notificationsTable).values({
    userId: cousinId,
    message: `Your points were updated: ${sign}${amount}. Reason: "${reason}". New balance: ${newPoints} points.`,
  });

  res.json({ userId: cousinId, points: newPoints });
});

router.get("/admin/cousin-id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const cousinId = await getCousinId();
  const adminId = await getAdminId();
  res.json({ cousinId: cousinId ?? null, adminId: adminId ?? null });
});

router.post("/admin/set-cousin", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const adminId = await getAdminId();
  if (req.user.id !== adminId) {
    res.status(403).json({ error: "Only admin can set cousin" });
    return;
  }
  const { cousinId } = req.body as { cousinId: string };
  if (!cousinId) {
    res.status(400).json({ error: "cousinId required" });
    return;
  }
  await setConfig("cousin_id", cousinId);

  await db
    .insert(pointsTable)
    .values({ userId: cousinId, points: 500 })
    .onConflictDoNothing();

  res.json({ cousinId });
});

router.post("/admin/claim", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const existingAdmin = await getAdminId();
  if (existingAdmin) {
    res.status(400).json({ error: "Admin already set" });
    return;
  }
  await setConfig("admin_id", req.user.id);
  res.json({ adminId: req.user.id });
});

export default router;
