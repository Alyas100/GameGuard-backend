// backend/src/server.js
import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
// import { startScoringCronJob } from "./bg-process/score-report/score_reports.js";
// import { startScoreAggregationCronJob } from "./bg-process/score-report/update_game_scores.js";
import getUserProfile from "./routes/auth/getUserProfile.js";
import loginRouter from "./routes/auth/login.js";
import registerRouter from "./routes/auth/register.js";
import genreRouter from "./routes/browse_games_screen/genre.js";
import browseGamesRouter from "./routes/browse_games_screen/search_bar.js";
import gameAlternatives from "./routes/game_details_screen/alternative.js";
import gameDetails from "./routes/game_details_screen/specific_game_details.js";
import trendingAlertsRoutes from "./routes/home_screen/trending_alerts.js";
import onboardingRouter from "./routes/onboarding.js";
import saveCountry from "./routes/profile_screen/country_selection.js";
import childDailyTimeLimitRoutes from "./routes/quick_actions/log_gaming_time/children_daily_time_limit.js";
import screenTimeLogsByChildRoutes from "./routes/quick_actions/log_gaming_time/get_screen_time_logs_by_child.js";
import screenTimeRoutes from "./routes/quick_actions/log_gaming_time/log_screen_time.js";
import registerChildRoutes from "./routes/quick_actions/monitored-games/child_register.js";
import monitoredGamesRoutes from "./routes/quick_actions/monitored_games/monitored_games.js";
import childrenRoutes from "./routes/quick_actions/parent_linking/link_child.js";
import fetchReport from "./routes/report_screen/fetch_reports.js";
import gameRoutes from "./routes/report_screen/game_autocomplete_route.js";
import sendReport from "./routes/report_screen/send_report.js";

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");

// Allow all origins (for development)
app.use(cors());
app.use(express.json());

// This exposes the files inside the 'uploads' folder (where Multer saves them)
// to the public URL path /uploads.
app.use("/uploads", express.static(uploadsDir));

//--REGISTER ENDPOINT HERE---
// for autocomplete feature when user are searching for games in 'report section'
app.use("/api/games", gameRoutes);

// For sending whole report
app.use("/api/sendReport", sendReport);

// // fetch reports
// app.use("/api/getReports", gameDetailsRouter);

// fetch all genres of games
app.use("/api/genres", genreRouter);

// search games in 'browse game' screen
app.use("/api/browse", browseGamesRouter);

// auth (custom auth)
app.use("/api/auth/register", registerRouter);
app.use("/api/auth/login", loginRouter);

// for onboarding pages(save profile to db table)
app.use("/api/onboarding", onboardingRouter);

app.use("/api/details", gameDetails);
app.use("/api/alternatives", gameAlternatives);

// for save the country that selected by user
app.use("/api/country", saveCountry);

// for getting user profile by id
app.use("/api/user-profile", getUserProfile);

// functionality for parent to generate code, and for child to insert that code, (for parent-tracking purpose)
app.use("/api/children", childrenRoutes); // ✅ FIXED

// Add with other route registrations
app.use("/api/children", monitoredGamesRoutes);
app.use("/api/games", monitoredGamesRoutes);

// register child
app.use("/api/children", registerChildRoutes);

//get children to be displayed in dropdown
app.use("/api/children", childrenRoutes);

// log screen time
app.use("/api/screen-time", screenTimeRoutes);

// get view of logged screen times
app.use("/api/screen-time", screenTimeLogsByChildRoutes);

// set daily limit log screen time
app.use("/api", childDailyTimeLimitRoutes);

// fetch trending alerts to show in home screen
app.use("/api", trendingAlertsRoutes);

// fetch all reports submitted by a user
app.use("/api", fetchReport);

// --- START THE CRON JOBs ---

// // RUN EVERY 1 MIN
// startScoringCronJob(); // This is job for scoring each report based on each categories

// // RUN EVERY 5 MIN
// startScoreAggregationCronJob(); // this is for calculating overall risk score for a game based on the all teh reports's scores

// // -----

// bind to all interfaces
app.listen(PORT, "0.0.0.0", () => console.log("Server running on port 3001"));
