// backend/src/server.js
import cors from "cors";
import express from "express";
import gameDetailsRouter from "./routes/game_details_screen/fetch_reports.js";
import gameRoutes from "./routes/report_screen/game_autocomplete_route.js";
import sendReport from "./routes/report_screen/send_report.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Allow all origins (for development)
app.use(cors());
app.use(express.json());

// This exposes the files inside the 'uploads' folder (where Multer saves them)
// to the public URL path /uploads.
app.use("/uploads", express.static("uploads"));

//--REGISTER ENDPOINT HERE---
// for autocomplete feature when user are searching for games in 'report section'
app.use("/api/games", gameRoutes);

// For sending whole report
app.use("/api/sendReport", sendReport);

// fetch reports
app.use("/api/getReports", gameDetailsRouter);

// bind to all interfaces
app.listen(PORT, "0.0.0.0", () => console.log("Server running on port 3001"));
