import { Router, type IRouter, type Request, type Response } from "express";
import * as bcrypt from "bcrypt";
import {
  GetCurrentAuthUserResponse,
} from "@workspace/api-zod";
import { db, usersTable, pointsTable } from "@workspace/db";
import {
  createSession,
  deleteSession,
  getSessionId,
  clearSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (users.length === 0) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: user.profileImageUrl || null,
      },
      access_token: "",
      refresh_token: "",
      expires_at: 0,
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);

    res.json({
      success: true,
      user: sessionData.user,
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/signup", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  if (username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (existing.length > 0) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(usersTable)
      .values({
        username,
        passwordHash,
      })
      .returning();

    await db.insert(pointsTable).values({
      userId: user.id,
      points: 500,
    });

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: user.profileImageUrl || null,
      },
      access_token: "",
      refresh_token: "",
      expires_at: 0,
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);

    res.status(201).json({
      success: true,
      user: sessionData.user,
    });
  } catch (err) {
    req.log.error({ err }, "Signup error");
    res.status(500).json({ error: "Signup failed" });
  }
});

router.get("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id));
    
    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    res.json(users[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user");
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

router.post("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json({ success: true });
});

export default router;
