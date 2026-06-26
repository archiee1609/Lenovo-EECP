import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DBService } from "./server/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get questions
  app.get("/api/questions", (req, res) => {
    try {
      const questions = DBService.getQuestions();
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check employee ID
  app.get("/api/candidates/check/:id", (req, res) => {
    try {
      const employeeId = req.params.id;
      const candidate = DBService.getCandidateByEmployeeId(employeeId);
      if (candidate) {
        res.json({
          exists: true,
          completed: candidate.isCompleted,
          isDisqualified: candidate.isDisqualified,
          name: candidate.name,
        });
      } else {
        res.json({ exists: false });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register candidate
  app.post("/api/candidates/register", (req, res) => {
    try {
      const { name, employeeId } = req.body;
      if (!name || !employeeId) {
        return res.status(400).json({ error: "Name and Employee ID are required." });
      }
      const candidate = DBService.registerCandidate(name, employeeId);
      res.status(201).json(candidate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Submit assessment result
  app.post("/api/candidates/submit", (req, res) => {
    try {
      const result = req.body;
      if (!result || !result.employeeId) {
        return res.status(400).json({ error: "Invalid result payload." });
      }
      DBService.saveAssessmentResult(result);
      res.status(200).json({ status: "success", message: "Assessment result stored permanently." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Analytics
  app.get("/api/admin/analytics", (req, res) => {
    try {
      const analytics = DBService.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Assessments with optional query search
  app.get("/api/admin/assessments", (req, res) => {
    try {
      const q = (req.query.q as string || "").toUpperCase();
      let assessments = DBService.getAssessments();
      
      if (q) {
        assessments = assessments.filter(
          a => a.employeeId.toUpperCase().includes(q) || 
               a.candidateName.toUpperCase().includes(q) ||
               (a.certificateId && a.certificateId.toUpperCase().includes(q))
        );
      }
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Clear DB (for testing/resetting)
  app.post("/api/admin/clear", (req, res) => {
    try {
      DBService.clearDatabase();
      res.json({ status: "success", message: "Database cleared successfully." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Express with Vite Development Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving Production Static Assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
