import { PrismaClient } from "@prisma/client";
import express from "express";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/trendingAlerts
router.get("/trendingAlerts", async (req, res) => {
  try {
    const alerts = [];

    // 1) Most Reported Games This Week
    const mostReported = await prisma.report.groupBy({
      by: ["gameId"],
      _count: { id: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    });

    for (const item of mostReported) {
      if (!item.gameId) continue;

      const game = await prisma.game.findUnique({ where: { id: item.gameId } });
      if (game) {
        alerts.push({
          id: `most-reported-${game.id}`,
          type: "most_reported",
          game: game.name,
          description: `${item._count.id} reports this week`,
          reportCount: item._count.id,
          severity: item._count.id > 20 ? "high" : "medium",
        });
      }
    }

    // 2) Report Spikes (this week vs last week)
    const thisWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekReports = await prisma.report.groupBy({
      by: ["gameId"],
      _count: { id: true },
      where: { createdAt: { gte: thisWeekStart } },
    });

    const lastWeekReports = await prisma.report.groupBy({
      by: ["gameId"],
      _count: { id: true },
      where: { createdAt: { gte: lastWeekStart, lt: thisWeekStart } },
    });

    for (const current of thisWeekReports) {
      if (!current.gameId) continue;

      const previous = lastWeekReports.find(
        (lw) => lw.gameId === current.gameId,
      );
      const prevCount = previous?._count.id || 0;

      const percentChange =
        prevCount > 0
          ? Math.round(((current._count.id - prevCount) / prevCount) * 100)
          : 100;

      if (percentChange > 40) {
        const game = await prisma.game.findUnique({
          where: { id: current.gameId },
        });
        if (game) {
          alerts.push({
            id: `spike-${game.id}`,
            type: "spike",
            game: game.name,
            description: `Reports up ${percentChange}% this week`,
            change: `↑ ${percentChange}%`,
            severity: percentChange > 100 ? "high" : "medium",
          });
        }
      }
    }

    // 3) High-Risk Content Alerts
    const recentReports = await prisma.report.findMany({
      where: { createdAt: { gte: thisWeekStart } },
      select: { categories: true },
    });

    const categoryCount = {};
    for (const r of recentReports) {
      const cats = Array.isArray(r.categories) ? r.categories : [];
      for (const c of cats) {
        const key = String(c || "Unknown");
        categoryCount[key] = (categoryCount[key] || 0) + 1;
      }
    }

    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    for (const [categoryName, count] of topCategories) {
      alerts.push({
        id: `risk-${categoryName}`,
        type: "high_risk_content",
        game: categoryName,
        description: `${count} new reports`,
        reportCount: count,
        severity: count > 10 ? "high" : "medium",
      });
    }

    // 4) Community Trend
    const totalReports = await prisma.report.count({
      where: { createdAt: { gte: thisWeekStart } },
    });

    const highRiskGames = await prisma.game.count({
      where: { riskScore: { gte: 70 } },
    });

    alerts.push({
      id: "community-trend",
      type: "community_trend",
      game: "Community Safety",
      description: `${highRiskGames} games in high-risk list`,
      change: `${totalReports} reports`,
      severity: highRiskGames > 8 ? "high" : "low",
    });

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching trending alerts:", error);
    res.status(500).json({ error: "Failed to fetch trending alerts" });
  }
});

export default router;
