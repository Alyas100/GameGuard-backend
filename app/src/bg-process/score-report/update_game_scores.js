import cron from "node-cron";
import prisma from "../../../../prismaClient.js";

/**
 * This is your app's "secret sauce".
 * It calculates a single 1-10 safety score from a list of reports.
 */
function calculateSafetyScore(reports) {
  // If no reports, it's a "perfect" score.
  if (!reports || reports.length === 0) {
    return 10.0;
  }

  let totalRiskPoints = 0;
  let scoredReportCount = 0;

  for (const report of reports) {
    // We only count reports the AI has processed
    if (report.isScored && report.categories) {
      // Get all scores from the report, e.g., [90, 20, 0]
      const scores = Object.values(report.categories);

      if (scores.length > 0) {
        // A report's "risk" is its single highest category
        // e.g., Math.max(90, 20, 0) = 90
        const maxRiskInReport = Math.max(...scores);
        totalRiskPoints += maxRiskInReport;
        scoredReportCount++;
      }
    }
  } // If there are no *scored* reports yet, also return 10.0

  if (scoredReportCount === 0) {
    return 10.0;
  } // 1. Find the average risk (a 0-100 score) // e.g., (90 + 50 + 70) / 3 = 70

  const averageRiskPercent = totalRiskPoints / scoredReportCount; // 2. Convert 0-100 "Risk" to 1-10 "Safety" score // e.g., (100 - 70) / 10 = 3.0

  const safetyScore = (100 - averageRiskPercent) / 10; // 3. Return the score rounded to one decimal place // This will give you scores like 3.0, 4.2, 9.5, etc.

  return parseFloat(safetyScore.toFixed(1));
}

// This is the main job function
async function updateAllGameScores() {
  const startTime = Date.now();
  console.log("--- 📈 Aggregator: Waking up to update game scores... ---");

  try {
    // 1. Get ALL games and their scored reports
    const games = await prisma.game.findMany({
      include: {
        reports: {
          where: { isScored: true }, // Only include reports the AI has finished
        },
      },
    });

    console.log(
      `--- 📈 Aggregator: Found ${games.length} games to process ---`,
    );

    let updatedCount = 0;

    // 2. Loop through each game and calculate its new score
    for (const game of games) {
      const newScore = calculateSafetyScore(game.reports);

      // 3. Only update the database if the score has actually changed
      if (game.riskScore !== newScore) {
        await prisma.game.update({
          where: { id: game.id },
          data: { riskScore: newScore },
        });
        updatedCount++;
        console.log(
          `--- 📈 Aggregator: Updated ${game.name} score to ${newScore} ---`,
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `--- 📈 Aggregator: Finished run. Updated ${updatedCount}/${games.length} games in ${duration}ms ---`,
    );
  } catch (error) {
    console.error("--- 📈 Aggregator: Error during update ---", error);
    throw error;
  }
}

let isAggregatorRunning = false; // Lock to prevent overlapping runs

// Wrapper function to prevent overlapping executions
async function runAggregatorWithLock() {
  if (isAggregatorRunning) {
    console.log(
      "--- 📈 Aggregator: Skipping run, still processing previous job. ---",
    );
    return;
  }

  isAggregatorRunning = true;
  try {
    await updateAllGameScores();
  } catch (error) {
    console.error("--- 📈 Aggregator: Error occurred ---", error);
  } finally {
    isAggregatorRunning = false;
  }
}

// This is the function you'll import in server.js
export function startScoreAggregationCronJob() {
  console.log("⏰ Aggregator cron job started (runs every 5 minutes)."); // Schedule to run every 5 minutes
  cron.schedule("*/5 * * * *", runAggregatorWithLock);
}
