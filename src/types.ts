/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candidate {
  employeeId: string;
  name: string;
  registeredAt: string;
  isCompleted: boolean;
  isDisqualified: boolean;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: string;
}

export interface QuestionResponse {
  questionId: number;
  selectedOption: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

export interface IntegrityEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  pointsDeducted: number;
  remainingPoints: number;
}

export interface AssessmentResult {
  employeeId: string;
  candidateName: string;
  technicalScore: number; // 0 - 100
  integrityScore: number; // 0 - 100
  pass: boolean;
  disqualified: boolean;
  certificateId: string | null;
  date: string;
  questionResponses: QuestionResponse[];
  integrityEvents: IntegrityEvent[];
  videoEvidenceMetadata?: {
    frameCount: number;
    phoneDetections: number;
    gazeViolations: number;
    multiFaceDetections: number;
  };
}

export interface AdminAnalytics {
  totalCandidates: number;
  totalPassed: number;
  totalFailed: number;
  totalDisqualified: number;
  passRate: number;
  averageTechnicalScore: number;
  averageIntegrityScore: number;
  recentAssessments: AssessmentResult[];
  topPerformers: AssessmentResult[];
}
