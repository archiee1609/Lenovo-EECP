/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candidate, Question, AssessmentResult, AdminAnalytics } from "./types";

// Seed questions from the database stage
const SEED_QUESTIONS: Question[] = [
  {
    id: 1,
    category: "No Power",
    text: "A Lenovo ThinkPad shows no signs of power. The AC adapter LED remains ON. USB-C power meter shows 20V negotiation, but pressing the power button causes a brief 0.2A current spike before dropping to 0A. The power button LED never illuminates. What is the most likely fault?",
    options: [
      "A. Corrupt BIOS image",
      "B. Shorted system board power rail after DC-in stage",
      "C. Defective LCD panel",
      "D. Missing operating system"
    ],
    correctAnswer: "B. Shorted system board power rail after DC-in stage",
    explanation: "Voltage negotiation is successful, indicating adapter and charging IC communication are functioning. The immediate current collapse suggests a downstream short circuit on a power rail."
  },
  {
    id: 2,
    category: "No POST",
    text: "A system powers on, fan spins continuously, Caps Lock LED responds to key presses, but there is no Lenovo logo or video output. External display also shows no signal. Diagnostic logs indicate POST halts during memory training. What should be checked first?",
    options: [
      "A. LCD cable connection",
      "B. SSD firmware version",
      "C. Memory module compatibility and seating",
      "D. WLAN card"
    ],
    correctAnswer: "C. Memory module compatibility and seating",
    explanation: "POST stopping during memory training typically points to RAM-related issues before video initialization occurs."
  },
  {
    id: 3,
    category: "No Power",
    text: "A laptop previously experienced liquid damage. Upon adapter connection, the charging LED blinks 3 times and turns off. The power button is unresponsive. Which component is most likely preventing startup?",
    options: [
      "A. SSD controller",
      "B. Embedded Controller (EC) detecting fault condition",
      "C. LCD backlight fuse",
      "D. TPM module"
    ],
    correctAnswer: "B. Embedded Controller (EC) detecting fault condition",
    explanation: "Modern systems often rely on EC logic to block startup when critical faults or abnormal sensor readings are detected."
  },
  {
    id: 4,
    category: "Dim Display",
    text: "A notebook boots successfully. An image is visible under a flashlight, but the screen appears almost black. External monitor functions normally. Which component is MOST likely defective?",
    options: [
      "A. CPU",
      "B. GPU firmware",
      "C. LCD backlight circuit or panel backlight",
      "D. BIOS region"
    ],
    correctAnswer: "C. LCD backlight circuit or panel backlight",
    explanation: "Visible image under a flashlight confirms video signal exists; only illumination is missing."
  },
  {
    id: 5,
    category: "Crisis BIOS",
    text: "During a BIOS update, AC power is accidentally disconnected. The laptop now powers on with a black screen and maximum fan speed. Keyboard backlight turns on briefly. What is the BEST recovery action?",
    options: [
      "A. Replace LCD panel",
      "B. Reinstall operating system",
      "C. Perform Crisis BIOS Recovery using approved recovery media",
      "D. Replace SSD"
    ],
    correctAnswer: "C. Perform Crisis BIOS Recovery using approved recovery media",
    explanation: "Symptoms are classic BIOS corruption indicators. Crisis recovery is designed specifically for this scenario."
  },
  {
    id: 6,
    category: "BIOS Flash Failure",
    text: "A BIOS flash utility reports success. After reboot, the system powers on but repeatedly restarts every 15 seconds without displaying the Lenovo splash screen. What is the most probable cause?",
    options: [
      "A. Corrupted EC firmware accompanying BIOS update",
      "B. Damaged keyboard membrane",
      "C. Defective battery pack only",
      "D. Windows driver conflict"
    ],
    correctAnswer: "A. Corrupted EC firmware accompanying BIOS update",
    explanation: "Modern BIOS packages often update EC firmware. Incomplete EC programming can create endless reboot cycles."
  },
  {
    id: 7,
    category: "No POST vs No Power",
    text: "A technician observes: Power LED ON, Fan spinning, Keyboard backlight active, No Lenovo logo, No video output. How should the issue be categorized?",
    options: [
      "A. No Power",
      "B. No Boot",
      "C. No POST",
      "D. Dim Display"
    ],
    correctAnswer: "C. No POST",
    explanation: "The system is receiving power and partially initializing hardware but is failing before POST completion."
  },
  {
    id: 8,
    category: "Dim Display",
    text: "After a display replacement, the image is visible but extremely dim. Known-good LCD panel exhibits identical behavior. What should be investigated next?",
    options: [
      "A. SSD SMART status",
      "B. Backlight enable signal and LCD fuse on motherboard",
      "C. BIOS password settings",
      "D. Operating system display scaling"
    ],
    correctAnswer: "B. Backlight enable signal and LCD fuse on motherboard",
    explanation: "Since two panels exhibit the same symptom, the motherboard backlight circuit becomes the primary suspect."
  },
  {
    id: 9,
    category: "Crisis BIOS",
    text: "A technician initiates Crisis BIOS Recovery. The USB drive LED flashes continuously for 3 minutes before the system automatically shuts down. What does this MOST likely indicate?",
    options: [
      "A. Recovery process successfully read BIOS image and is reflashing firmware",
      "B. USB port failure",
      "C. LCD cable fault",
      "D. Battery authentication failure"
    ],
    correctAnswer: "A. Recovery process successfully read BIOS image and is reflashing firmware",
    explanation: "Continuous USB activity during recovery generally indicates successful reading and writing of firmware data."
  },
  {
    id: 10,
    category: "Advanced Board-Level",
    text: "A laptop presents as 'No Power.' Measurements reveal: 20V present at USB-C input, 3.3V always rail present, 5V always rail present, Power button signal reaches EC, EC does not issue S0 power-on sequence. What is the MOST likely root cause?",
    options: [
      "A. Defective LCD panel",
      "B. Corrupted EC firmware or EC hardware failure",
      "C. Missing bootloader in Windows",
      "D. Defective SSD"
    ],
    correctAnswer: "B. Corrupted EC firmware or EC hardware failure",
    explanation: "Since primary rails and power button communication are functioning, failure of the EC to initiate the power sequence indicates EC firmware or hardware issues."
  },
  {
    id: 11,
    category: "Expert Bonus Challenge",
    text: "A system exhibits the following: Power LED ON, Fan spins briefly then stops, USB recovery key not detected, SPI flash voltage normal, POST analyzer card remains at code 00. What is the MOST likely diagnosis?",
    options: [
      "A. Corrupt operating system",
      "B. LCD backlight failure",
      "C. CPU initialization failure or corrupted boot block region of BIOS",
      "D. SSD not detected"
    ],
    correctAnswer: "C. CPU initialization failure or corrupted boot block region of BIOS",
    explanation: "POST code 00 typically indicates the CPU never begins execution or the BIOS boot block is damaged before initialization can occur. This is among the most challenging board-level troubleshooting scenarios."
  }
];

// Helper to manage localStorage mock database
const LOCAL_DB_KEY = "lenovo_eecp_local_db";

interface LocalDBStructure {
  candidates: Candidate[];
  assessments: AssessmentResult[];
  questions: Question[];
}

function getLocalDB(): LocalDBStructure {
  const data = localStorage.getItem(LOCAL_DB_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return {
        candidates: parsed.candidates || [],
        assessments: parsed.assessments || [],
        questions: parsed.questions && parsed.questions.length > 0 ? parsed.questions : SEED_QUESTIONS
      };
    } catch (e) {
      console.error("Local storage DB corrupted, resetting");
    }
  }
  const defaultDB: LocalDBStructure = {
    candidates: [],
    assessments: [],
    questions: SEED_QUESTIONS
  };
  saveLocalDB(defaultDB);
  return defaultDB;
}

function saveLocalDB(db: LocalDBStructure): void {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

// Track if server is confirmed to be offline
let isOfflineMode = false;

// Probe server status quickly
async function checkApiAvailability(): Promise<boolean> {
  if (isOfflineMode) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 sec timeout
    const res = await fetch("/api/health", { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn("API Server /api/health returned non-ok status, activating offline mode.");
      isOfflineMode = true;
      return false;
    }
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("API Server /api/health returned non-JSON response, activating offline mode.");
      isOfflineMode = true;
      return false;
    }
    
    const data = await res.json();
    if (data && data.status === "ok") {
      return true;
    }
    
    console.warn("API Server /api/health status field not ok, activating offline mode.");
    isOfflineMode = true;
    return false;
  } catch (e) {
    console.warn("API Server unreachable, activating client-side offline mode.", e);
    isOfflineMode = true;
    return false;
  }
}

export const apiService = {
  // Check if we are currently running in LocalStorage Offline Fallback Mode
  isOffline(): boolean {
    return isOfflineMode;
  },

  // Fetch Questions
  async getQuestions(): Promise<Question[]> {
    const serverAvailable = await checkApiAvailability();
    if (serverAvailable) {
      try {
        const res = await fetch("/api/questions");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          }
        }
      } catch (e) {
        console.error("Failed to fetch questions, using local database fallback", e);
      }
    }
    // Fallback
    const db = getLocalDB();
    return db.questions;
  },

  // Check Candidate ID
  async checkCandidate(id: string): Promise<{ exists: boolean; completed?: boolean; isDisqualified?: boolean; name?: string }> {
    const cleanId = id.trim().toUpperCase();
    const serverAvailable = await checkApiAvailability();
    if (serverAvailable) {
      try {
        const res = await fetch(`/api/candidates/check/${cleanId}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          }
        }
      } catch (e) {
        console.error("Failed to check candidate on server, using local storage fallback", e);
      }
    }

    // Fallback
    const db = getLocalDB();
    const candidate = db.candidates.find(c => c.employeeId === cleanId);
    if (candidate) {
      return {
        exists: true,
        completed: candidate.isCompleted,
        isDisqualified: candidate.isDisqualified,
        name: candidate.name
      };
    }
    return { exists: false };
  },

  // Register Candidate
  async registerCandidate(name: string, employeeId: string): Promise<Candidate> {
    const cleanId = employeeId.trim().toUpperCase();
    const cleanName = name.trim();
    const serverAvailable = await checkApiAvailability();
    if (serverAvailable) {
      try {
        const res = await fetch("/api/candidates/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cleanName, employeeId: cleanId })
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          } else {
            throw new Error("Server returned non-JSON response.");
          }
        } else {
          // Robustly read error message or fall back
          let errMsg = "Failed to register candidate on server.";
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              const errData = await res.json();
              errMsg = errData.error || errMsg;
            } catch (_) {}
          } else {
            try {
              const text = await res.text();
              if (text && text.length < 200) errMsg = text;
            } catch (_) {}
          }
          throw new Error(errMsg);
        }
      } catch (e: any) {
        console.warn("Server connection failed during registration, checking fallback.", e);
        // If the error is a known duplicate registration error (e.g., contains specific keywords), bubble it up.
        const isConflict = e.message && (e.message.includes("already registered") || e.message.includes("required"));
        if (isConflict) {
          throw e; // Bubble up validation/duplicate errors to the UI
        }
        
        // Otherwise, flag as offline and proceed to local storage fallback
        isOfflineMode = true;
      }
    }

    // Fallback
    const db = getLocalDB();
    const existing = db.candidates.find(c => c.employeeId === cleanId);
    if (existing) {
      throw new Error(`Employee ID ${employeeId} is already registered.`);
    }

    const newCandidate: Candidate = {
      employeeId: cleanId,
      name: cleanName,
      registeredAt: new Date().toISOString(),
      isCompleted: false,
      isDisqualified: false
    };

    db.candidates.push(newCandidate);
    saveLocalDB(db);
    return newCandidate;
  },

  // Submit Assessment Result
  async submitAssessment(result: AssessmentResult): Promise<{ status: string; message: string }> {
    const serverAvailable = await checkApiAvailability();
    if (serverAvailable) {
      try {
        const res = await fetch("/api/candidates/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result)
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          }
        }
      } catch (e) {
        console.error("Failed to submit assessment to server, saving locally.", e);
      }
    }

    // Fallback
    const db = getLocalDB();
    const cleanId = result.employeeId.trim().toUpperCase();

    // Add or update assessment
    const existingIndex = db.assessments.findIndex(a => a.employeeId === cleanId);
    if (existingIndex >= 0) {
      db.assessments[existingIndex] = result;
    } else {
      db.assessments.push(result);
    }

    // Update candidate status
    const candidateIndex = db.candidates.findIndex(c => c.employeeId === cleanId);
    if (candidateIndex >= 0) {
      db.candidates[candidateIndex].isCompleted = true;
      db.candidates[candidateIndex].isDisqualified = result.disqualified;
    } else {
      db.candidates.push({
        employeeId: cleanId,
        name: result.candidateName,
        registeredAt: new Date().toISOString(),
        isCompleted: true,
        isDisqualified: result.disqualified
      });
    }

    saveLocalDB(db);
    return { status: "success", message: "Saved locally inside browser." };
  },

  // Get Admin Assessments
  async getAssessments(q: string = ""): Promise<AssessmentResult[]> {
    const query = q.toUpperCase().trim();
    const serverAvailable = await checkApiAvailability();
    if (serverAvailable) {
      try {
        const res = await fetch(`/api/admin/assessments?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          }
        }
      } catch (e) {
        console.error("Failed to fetch assessments from server, using local fallback", e);
      }
    }

    // Fallback
    const db = getLocalDB();
    let assessments = db.assessments;
    if (query) {
      assessments = assessments.filter(
        a => a.employeeId.toUpperCase().includes(query) ||
             a.candidateName.toUpperCase().includes(query) ||
             (a.certificateId && a.certificateId.toUpperCase().includes(query))
      );
    }
    return assessments;
  },

  // Get Analytics
  async getAnalytics(): Promise<AdminAnalytics> {
    const serverAvailable = await checkApiAvailability();
    if (serverAvailable) {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          }
        }
      } catch (e) {
        console.error("Failed to fetch analytics from server, compiling from local db", e);
      }
    }

    // Fallback
    const db = getLocalDB();
    const totalCandidates = db.candidates.length;
    const assessments = db.assessments;

    const totalPassed = assessments.filter(a => a.pass && !a.disqualified).length;
    const totalFailed = assessments.filter(a => !a.pass && !a.disqualified).length;
    const totalDisqualified = assessments.filter(a => a.disqualified).length;

    const averageTechnicalScore = assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + a.technicalScore, 0) / assessments.length)
      : 0;

    const averageIntegrityScore = assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + a.integrityScore, 0) / assessments.length)
      : 0;

    const passRate = assessments.length > 0
      ? Math.round((totalPassed / assessments.length) * 100)
      : 0;

    const recentAssessments = [...assessments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const topPerformers = [...assessments]
      .filter(a => a.pass && !a.disqualified)
      .sort((a, b) => b.technicalScore - a.technicalScore || b.integrityScore - a.integrityScore)
      .slice(0, 5);

    return {
      totalCandidates,
      totalPassed,
      totalFailed,
      totalDisqualified,
      passRate,
      averageTechnicalScore,
      averageIntegrityScore,
      recentAssessments,
      topPerformers
    };
  },

  // Clear Database
  async clearDatabase(): Promise<{ status: string; message: string }> {
    const serverAvailable = await checkApiAvailability();
    if (serverAvailable) {
      try {
        const res = await fetch("/api/admin/clear", { method: "POST" });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          }
        }
      } catch (e) {
        console.error("Failed to clear database on server", e);
      }
    }

    // Fallback
    const defaultDB: LocalDBStructure = {
      candidates: [],
      assessments: [],
      questions: SEED_QUESTIONS
    };
    saveLocalDB(defaultDB);
    return { status: "success", message: "Local database cleared." };
  }
};
