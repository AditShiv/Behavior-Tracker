import { Router, type IRouter, type Request, type Response } from "express";
import { db, redemptionsTable, pointsTable, notificationsTable, pointsHistoryTable, appConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const POINTS_PER_ROBUX = 1000;

async function getCousinId(): Promise<string | null> {
  const rows = await db.select().from(appConfigTable).where(eq(appConfigTable.key, "cousin_id"));
  return rows[0]?.value ?? null;
}

async function getAdminId(): Promise<string> {
  const envId = process.env.ADMIN_USER_ID;
  if (envId) return envId;
  const rows = await db.select().from(appConfigTable).where(eq(appConfigTable.key, "admin_id"));
  return rows[0]?.value ?? "";
}

function formatRedemption(r: typeof redemptionsTable.$inferSelect) {
  return {
    id: r.id,
    userId: r.userId,
    robuxAmount: r.robuxAmount,
    pointsCost: r.pointsCost,
    status: r.status,
    note: r.note ?? null,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    donated: r.donated,
    donatedAt: r.donatedAt ? r.donatedAt.toISOString() : null,
  };
}

router.get("/redemptions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const adminId = await getAdminId();
  let redemptions;
  if (req.user.id === adminId) {
    redemptions = await db.select().from(redemptionsTable).orderBy(redemptionsTable.createdAt);
  } else {
    redemptions = await db.select().from(redemptionsTable).where(eq(redemptionsTable.userId, req.user.id)).orderBy(redemptionsTable.createdAt);
  }
  res.json({ redemptions: redemptions.map(formatRedemption) });
});

router.post("/redemptions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const cousinId = await getCousinId();
  if (req.user.id !== cousinId) {
    res.status(403).json({ error: "Only the cousin can redeem points" });
    return;
  }

  const { robuxAmount } = req.body as { robuxAmount: number };
  if (!robuxAmount || robuxAmount < 1) {
    res.status(400).json({ error: "robuxAmount must be at least 1" });
    return;
  }

  const pointsCost = robuxAmount * POINTS_PER_ROBUX;
  const currentPoints = await db.select().from(pointsTable).where(eq(pointsTable.userId, req.user.id));
  if (!currentPoints[0] || currentPoints[0].points < pointsCost) {
    res.status(400).json({ error: `Not enough points. Need ${pointsCost}, have ${currentPoints[0]?.points ?? 0}` });
    return;
  }

  const [redemption] = await db.insert(redemptionsTable).values({
    userId: req.user.id,
    robuxAmount,
    pointsCost,
    status: "pending",
  }).returning();

  const adminId = await getAdminId();
  if (adminId) {
    await db.insert(notificationsTable).values({
      userId: adminId,
      message: `Your cousin wants to redeem ${robuxAmount} Robux (${pointsCost} points). Check redemption requests!`,
    });
  }

  res.status(201).json(formatRedemption(redemption));
});

router.post("/redemptions/:id/review", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const adminId = await getAdminId();
  if (req.user.id !== adminId) {
    res.status(403).json({ error: "Only admin can review redemptions" });
    return;
  }

  const id = parseInt(req.params.id);
  const { action, note } = req.body as { action: "accept" | "deny"; note?: string | null };

  const existing = await db.select().from(redemptionsTable).where(eq(redemptionsTable.id, id));
  if (!existing[0]) {
    res.status(404).json({ error: "Redemption not found" });
    return;
  }
  if (existing[0].status !== "pending") {
    res.status(400).json({ error: "Redemption already reviewed" });
    return;
  }

  const status = action === "accept" ? "accepted" : "denied";
  const [updated] = await db.update(redemptionsTable)
    .set({ status, note: note ?? null, reviewedAt: new Date() })
    .where(eq(redemptionsTable.id, id))
    .returning();

  const cousinId = existing[0].userId;
  if (action === "accept") {
    const currentPoints = await db.select().from(pointsTable).where(eq(pointsTable.userId, cousinId));
    const newPoints = Math.max(0, (currentPoints[0]?.points ?? 0) - existing[0].pointsCost);
    await db.update(pointsTable).set({ points: newPoints }).where(eq(pointsTable.userId, cousinId));
    await db.insert(pointsHistoryTable).values({
      userId: cousinId,
      amount: -existing[0].pointsCost,
      reason: `Redeemed ${existing[0].robuxAmount} Robux`,
    });
    const msg = note
      ? `Your Robux redemption of ${existing[0].robuxAmount} Robux was accepted! Note: "${note}"`
      : `Your Robux redemption of ${existing[0].robuxAmount} Robux was accepted! The Robux will be sent to you soon.`;
    await db.insert(notificationsTable).values({ userId: cousinId, message: msg });
  } else {
    const msg = note
      ? `Your Robux redemption of ${existing[0].robuxAmount} Robux was denied. Reason: "${note}"`
      : `Your Robux redemption of ${existing[0].robuxAmount} Robux was denied.`;
    await db.insert(notificationsTable).values({ userId: cousinId, message: msg });
  }

  res.json(formatRedemption(updated));
});

router.post("/redemptions/:id/donate", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const adminId = await getAdminId();
  if (req.user.id !== adminId) {
    res.status(403).json({ error: "Only admin can mark as donated" });
    return;
  }

  const id = parseInt(req.params.id);
  const existing = await db.select().from(redemptionsTable).where(eq(redemptionsTable.id, id));
  if (!existing[0]) {
    res.status(404).json({ error: "Redemption not found" });
    return;
  }
  if (existing[0].status !== "accepted") {
    res.status(400).json({ error: "Only accepted redemptions can be marked as donated" });
    return;
  }
  if (existing[0].donated) {
    res.status(400).json({ error: "Already marked as donated" });
    return;
  }

  const [updated] = await db.update(redemptionsTable)
    .set({ donated: true, donatedAt: new Date() })
    .where(eq(redemptionsTable.id, id))
    .returning();

  await db.insert(notificationsTable).values({
    userId: existing[0].userId,
    message: `Your ${existing[0].robuxAmount} Robux has been sent to you! Check your Roblox account.`,
  });

  res.json(formatRedemption(updated));
});

export default router;
