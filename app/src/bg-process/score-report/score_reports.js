// backend/src/cron/score_reports.js
import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

// --THIS FILE PURPOSE IS TO START THE 'ai_worker.js' FILE IN A SEPARATE THREAD EVERY MINUTE TO ENSURE MAIN SERVER NEVER GETS BLOCKED

// Helper to get the correct path to the worker file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerScriptPath = path.resolve(__dirname, "ai_worker.js");

let isJobRunning = false; // The lock to prevent overlapping runs

// This is the function that gets called every minute
function runAiWorker() {
  console.log(`[${new Date().toISOString()}] --- Cron Job: PING! ---`);

  // Check if the job from the last minute is still running
  if (isJobRunning) {
    console.log("--- Cron Job: Skipping run, worker is still busy. ---");
    return;
  }

  isJobRunning = true;
  console.log("--- Cron Job: Starting AI worker thread... ---");

  // Create the new worker thread
  const worker = new Worker(workerScriptPath);

  // Listen for messages from the worker
  worker.on("message", (msg) => {
    if (msg === "done") {
      console.log("--- Cron Job: AI worker finished. Releasing lock. ---");
      isJobRunning = false;
    }
  });

  // Listen for errors
  worker.on("error", (err) => {
    console.error("--- Cron Job: AI worker crashed! ---", err);
    isJobRunning = false; // Release lock on crash
  });

  // Listen for when the worker exits
  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(
        `--- Cron Job: AI worker stopped with exit code ${code} ---`
      );
    }
    isJobRunning = false; // Always release lock on exit
  });
}

// This is the function you import and call from server.js
export function startScoringCronJob() {
  console.log(
    "⏰ Cron job for scoring has been started (runs every 1 minute)."
  );
  // Tells the scheduler to run 'runAiWorker' every minute
  cron.schedule("* * * * *", runAiWorker);
}
