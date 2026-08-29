import { Router } from "express";
import { db } from "@workspace/db";
import { leaderboardTable, insertLeaderboardSchema } from "@workspace/db/schema";
import { desc, gt, sql } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(leaderboardTable)
      .orderBy(desc(leaderboardTable.score))
      .limit(10);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.post("/leaderboard", async (req, res) => {
  const parsed = insertLeaderboardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    return;
  }
  try {
    const [row] = await db
      .insert(leaderboardTable)
      .values(parsed.data)
      .returning();

    const [{ above }] = await db
      .select({ above: sql<number>`count(*)` })
      .from(leaderboardTable)
      .where(gt(leaderboardTable.score, row!.score));
    const rank = Number(above) + 1;

    res.status(201).json({ entry: row, rank });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit score" });
  }
});

export default router;
