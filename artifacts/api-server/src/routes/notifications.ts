import { Router, type IRouter, type Request, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notifications", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user.id))
    .orderBy(notificationsTable.createdAt);
  res.json({
    notifications: notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  });
});

router.post("/notifications/:id/read", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = parseInt(req.params.id);
  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json({
    id: updated.id,
    userId: updated.userId,
    message: updated.message,
    read: updated.read,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
