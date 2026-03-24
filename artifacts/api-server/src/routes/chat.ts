import { Router, type IRouter, type Request, type Response } from "express";
import { db, messagesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/chat/send", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { content } = req.body as { content?: string };

  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  try {
    const message = await db.insert(messagesTable).values({
      senderId: req.user.id,
      content: content.trim(),
    }).returning();

    res.json(message[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.get("/chat/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const messages = await db
      .select({
        id: messagesTable.id,
        senderId: messagesTable.senderId,
        senderUsername: usersTable.username,
        content: messagesTable.content,
        createdAt: messagesTable.createdAt,
      })
      .from(messagesTable)
      .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(100);

    res.json({ messages: messages.reverse() });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch messages");
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
