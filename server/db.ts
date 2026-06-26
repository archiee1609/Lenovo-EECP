import fs from "fs";
import path from "path";
import { Candidate, Question, AssessmentResult, AdminAnalytics } from "../src/types";

const DB_PATH = path.join(process.cwd(), "database.json");

interface DBStructure {
  candidates: Candidate[];
  assessments: AssessmentResult[];
  questions: Question[];
}

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

function initDB(): DBStructure {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(data);
      // Ensure all keys exist
      return {
        candidates: parsed.candidates || [],
        assessments: parsed.assessments || [],
        questions: parsed.questions && parsed.questions.length > 0 ? parsed.questions : SEED_QUESTIONS
      };
    } catch (e) {
      console.error("Error reading database file, resetting database", e);
    }
  }
  const db: DBStructure = {
    candidates: [],
    assessments: [],
    questions: SEED_QUESTIONS
  };
  saveDB(db);
  return db;
}

function saveDB(db: DBStructure): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing to database file", e);
  }
}

// Service APIs
export const DBService = {
  getCandidates(): Candidate[] {
    const db = initDB();
    return db.candidates;
  },

  getCandidateByEmployeeId(employeeId: string): Candidate | undefined {
    const db = initDB();
    return db.candidates.find(c => c.employeeId.toUpperCase() === employeeId.toUpperCase());
  },

  registerCandidate(name: string, employeeId: string): Candidate {
    const db = initDB();
    const cleanId = employeeId.trim().toUpperCase();
    const existing = db.candidates.find(c => c.employeeId === cleanId);
    if (existing) {
      throw new Error(`Employee ID ${employeeId} is already registered.`);
    }

    const newCandidate: Candidate = {
      employeeId: cleanId,
      name: name.trim(),
      registeredAt: new Date().toISOString(),
      isCompleted: false,
      isDisqualified: false
    };

    db.candidates.push(newCandidate);
    saveDB(db);
    return newCandidate;
  },

  getQuestions(): Question[] {
    const db = initDB();
    return db.questions;
  },

  saveAssessmentResult(result: AssessmentResult): void {
    const db = initDB();
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
      // Auto-register candidate if they completed somehow
      db.candidates.push({
        employeeId: cleanId,
        name: result.candidateName,
        registeredAt: new Date().toISOString(),
        isCompleted: true,
        isDisqualified: result.disqualified
      });
    }

    saveDB(db);
  },

  getAssessments(): AssessmentResult[] {
    const db = initDB();
    return db.assessments;
  },

  getAnalytics(): AdminAnalytics {
    const db = initDB();
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

    // Recent assessments (sorted descending by date)
    const recentAssessments = [...assessments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Top performers (pass, highest technical score, then highest integrity score)
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

  clearDatabase(): void {
    const db: DBStructure = {
      candidates: [],
      assessments: [],
      questions: SEED_QUESTIONS
    };
    saveDB(db);
  }
};
