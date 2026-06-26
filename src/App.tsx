/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, ShieldAlert, FileText, Settings, Award, ArrowLeft, RefreshCw, RefreshCw as RotateCcw } from "lucide-react";
import { Question, QuestionResponse, IntegrityEvent } from "./types";
import { Avatar, AvatarExpression, AvatarGesture } from "./components/Avatar";
import { ReadyScreen } from "./components/ReadyScreen";
import { Assessment } from "./components/Assessment";
import { CameraProctor } from "./components/CameraProctor";
import { Certificate } from "./components/Certificate";
import { AdminDashboard } from "./components/AdminDashboard";
import { apiService } from "./api";

export default function App() {
  const [page, setPage] = useState<"ready" | "assessment" | "disqualified" | "result" | "admin">("ready");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidate, setCandidate] = useState<{ name: string; employeeId: string } | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Proctor Scoring states
  const [integrityScore, setIntegrityScore] = useState(100);
  const [integrityEvents, setIntegrityEvents] = useState<IntegrityEvent[]>([]);
  
  // Test Competency states
  const [technicalScore, setTechnicalScore] = useState(0);
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>([]);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [examDate, setExamDate] = useState("");

  // Avatar Voice State
  const [avatarExpression, setAvatarExpression] = useState<AvatarExpression>("neutral");
  const [avatarGesture, setAvatarGesture] = useState<AvatarGesture>("none");
  const [avatarSpeech, setAvatarSpeech] = useState("Connecting registry...");

  // Refs for tracking active assessment state in listeners
  const activePageRef = useRef<string>("ready");
  const activeScoreRef = useRef<number>(100);

  useEffect(() => {
    activePageRef.current = page;
  }, [page]);

  useEffect(() => {
    activeScoreRef.current = integrityScore;
  }, [integrityScore]);

  // Fetch questions on load
  useEffect(() => {
    async function loadQuestions() {
      try {
        const data = await apiService.getQuestions();
        setQuestions(data);
      } catch (err) {
        console.error("Error loading questions from API:", err);
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, []);

  // Proctor Event Deduction Engine
  const handleProctorEvent = (type: string, description: string, points: number) => {
    if (activePageRef.current !== "assessment") return;

    // Deduct points safely
    const previousScore = activeScoreRef.current;
    const nextScore = Math.max(0, previousScore - points);
    
    // Add Event log
    const newEvent: IntegrityEvent = {
      id: "EVT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      timestamp: new Date().toISOString(),
      type,
      description,
      pointsDeducted: points,
      remainingPoints: nextScore
    };

    setIntegrityEvents(prev => [...prev, newEvent]);
    setIntegrityScore(nextScore);

    // Dynamic Avatar Reactions
    if (nextScore < 60) {
      // Disqualification transition
      setAvatarState("concern", "headShake", "Disqualified as integrity scores are less.");
      handleDisqualification(nextScore, [...integrityEvents, newEvent]);
    } else {
      // Temporary frown gesture
      setAvatarState("frown", "none", `Integrity Warning. ${type} registered.`);
      // Reset back to neutral expression after 3 seconds
      setTimeout(() => {
        if (activePageRef.current === "assessment") {
          setAvatarExpression("neutral");
        }
      }, 3000);
    }
  };

  const setAvatarState = (expr: AvatarExpression, gest: AvatarGesture, speech: string) => {
    setAvatarExpression(expr);
    setAvatarGesture(gest);
    setAvatarSpeech(speech);
  };

  // Immediate Disqualification submission
  const handleDisqualification = async (finalIntegrityScore: number, finalEvents: IntegrityEvent[]) => {
    if (!candidate) return;

    const resultPayload = {
      employeeId: candidate.employeeId,
      candidateName: candidate.name,
      technicalScore: 0,
      integrityScore: finalIntegrityScore,
      pass: false,
      disqualified: true,
      certificateId: null,
      date: new Date().toISOString(),
      questionResponses: [],
      integrityEvents: finalEvents,
    };

    try {
      await apiService.submitAssessment(resultPayload);
    } catch (e) {
      console.error("Disqualification submit error:", e);
    }

    setPage("disqualified");
  };

  // Start assessment handler
  const handleStartAssessment = (name: string, employeeId: string) => {
    setCandidate({ name, employeeId });
    setIntegrityScore(100);
    setIntegrityEvents([]);
    setPage("assessment");
  };

  // Submit final complete exam scores
  const handleAssessmentCompleted = async (techScore: number, responses: QuestionResponse[]) => {
    if (!candidate) return;

    setTechnicalScore(techScore);
    setQuestionResponses(responses);

    const isPass = techScore >= 90 && integrityScore >= 60;
    const certId = isPass
      ? `LEN-ELITE-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${new Date().getFullYear()}`
      : null;
    const dateStr = new Date().toISOString();
    setCertificateId(certId);
    setExamDate(dateStr);

    const resultPayload = {
      employeeId: candidate.employeeId,
      candidateName: candidate.name,
      technicalScore: techScore,
      integrityScore: integrityScore,
      pass: isPass,
      disqualified: false,
      certificateId: certId,
      date: dateStr,
      questionResponses: responses,
      integrityEvents,
    };

    try {
      await apiService.submitAssessment(resultPayload);
    } catch (e) {
      console.error("Submission error:", e);
    }

    setPage("result");
  };

  // Handle Retry
  const handleResetExam = () => {
    setIntegrityScore(100);
    setIntegrityEvents([]);
    setTechnicalScore(0);
    setQuestionResponses([]);
    setPage("ready");
    setCandidate(null);
  };

  return (
    <div className="bg-[#f4f5f6] min-h-screen text-dark-charcoal font-sans antialiased selection:bg-brand-red selection:text-white">
      {/* Upper Navigation Bar */}
      <nav id="nav-header" className="bg-white border-b-2 border-gray-200 py-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div id="lenovo-logo" className="bg-brand-red text-white font-black px-4 py-1.5 text-base uppercase tracking-widest-plus rounded-none shadow-xs">
              Lenovo
            </div>
            <div className="h-6 w-px bg-gray-300" />
            <div className="text-[10px] font-black text-dark-charcoal tracking-widest uppercase">
              ELITE ENGINEER REGISTRY
            </div>
          </div>

          <div className="flex items-center gap-2">
            {page === "ready" && (
              <button
                id="btn-admin-nav"
                onClick={() => setPage("admin")}
                className="admin-trigger inline-flex items-center gap-2 text-[10px] text-gray-400 hover:text-brand-red font-black tracking-widest uppercase transition-colors px-4 py-2 hover:bg-gray-50 border-2 border-transparent hover:border-gray-200"
              >
                <Settings className="w-4 h-4" />
                Admin Portal
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container Stage */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {loadingQuestions ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-brand-red animate-spin" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling registry modules...</span>
          </div>
        ) : (
          <div>
            {page === "ready" && (
              <ReadyScreen
                onStartAssessment={handleStartAssessment}
                onOpenAdmin={() => setPage("admin")}
              />
            )}

            {page === "assessment" && candidate && (
              <div className="space-y-6">
                {/* Active Assessment header displaying status and camera in secondary panel */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-5 rounded-xl border-2 border-gray-200 shadow-xs gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border-2 border-brand-red/20 shrink-0">
                      <ShieldCheck className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-dark-charcoal text-sm uppercase tracking-tight">Active Proctored Candidate Session</h3>
                      <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mt-0.5">
                        Engineer: {candidate.name.toUpperCase()} &bull; ID: {candidate.employeeId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Secure Sandbox Feed Active
                  </div>
                </div>

                {/* Sub-grid carrying active camera listener and questions chatbot */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Invisible Proctor tracking component that runs Keydown, contextmenu, resizing, and web-camera detections */}
                  <div className="hidden">
                    <CameraProctor
                      onEventTriggered={handleProctorEvent}
                      isAssessmentActive={true}
                      integrityScore={integrityScore}
                      onCameraActiveChange={() => {}}
                      onFaceDetectedChange={() => {}}
                    />
                  </div>

                  {/* Dual Visible Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Proctor Feed displayed alongside assessment */}
                    <div className="lg:col-span-4 lg:order-2 space-y-4">
                      <CameraProctor
                        onEventTriggered={handleProctorEvent}
                        isAssessmentActive={true}
                        integrityScore={integrityScore}
                        onCameraActiveChange={() => {}}
                        onFaceDetectedChange={() => {}}
                      />
                      
                      {/* Active Violations console */}
                      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xs p-5 space-y-4">
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Session Integrity Logs ({integrityEvents.length})
                        </h4>
                        
                        {integrityEvents.length === 0 ? (
                          <div className="text-[10px] text-gray-400 py-5 text-center bg-gray-50 rounded border-2 border-dashed border-gray-200 font-bold uppercase tracking-wider">
                            No violations registered. Safe.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                            {integrityEvents.map((evt, idx) => (
                              <div key={idx} className="bg-red-50/50 p-3 rounded text-[10px] border border-red-100 flex items-start justify-between gap-2 font-bold">
                                <div>
                                  <span className="font-black text-brand-red block uppercase tracking-wider">{evt.type}</span>
                                  <span className="text-gray-500 font-medium">{evt.description}</span>
                                </div>
                                <span className="text-brand-red font-black font-display text-xs">-{evt.pointsDeducted}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chatbot conversation interface */}
                    <div className="lg:col-span-8 lg:order-1">
                      <Assessment
                        questions={questions}
                        candidateName={candidate.name}
                        employeeId={candidate.employeeId}
                        integrityScore={integrityScore}
                        onAssessmentCompleted={handleAssessmentCompleted}
                        onForceDisqualified={() => handleDisqualification(integrityScore, integrityEvents)}
                        setAvatarState={setAvatarState}
                        avatarExpression={avatarExpression}
                        avatarGesture={avatarGesture}
                        avatarSpeech={avatarSpeech}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === "disqualified" && (
              /* Severe Violation Disqualification Screen */
              <div className="max-w-md mx-auto bg-white border-2 border-brand-red rounded-2xl shadow-xs p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border-2 border-brand-red mx-auto animate-bounce">
                  <ShieldAlert className="w-9 h-9 text-brand-red" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-black text-brand-red uppercase italic tracking-tight">Assessment Blocked</h3>
                  <p className="text-sm font-black text-dark-charcoal uppercase tracking-wider">
                    Disqualified - Insufficient Integrity
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    The virtual proctoring suite has terminated this session because your Integrity Score dropped below the mandatory 60 point credibility threshold.
                  </p>
                </div>

                {/* Audit details */}
                <div className="bg-gray-50 border-2 border-gray-200 p-5 rounded-xl text-left space-y-3 text-xs">
                  <span className="font-black text-gray-400 block uppercase tracking-widest text-[9px]">SESSION VIOLATION SUMMARY:</span>
                  <div className="divide-y-2 divide-gray-150 max-h-[140px] overflow-y-auto pr-1">
                    {integrityEvents.map((evt, idx) => (
                      <div key={idx} className="py-2 flex justify-between gap-4 text-[11px] font-bold">
                        <div>
                          <span className="font-black text-dark-charcoal uppercase tracking-wider">{evt.type}</span>
                          <p className="text-gray-500 mt-0.5 font-medium">{evt.description}</p>
                        </div>
                        <span className="text-brand-red font-black shrink-0">-{evt.pointsDeducted} PTS</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleResetExam}
                  className="certification-btn inline-flex items-center gap-2 bg-dark-charcoal hover:bg-black text-white font-black px-6 py-3 rounded-lg text-xs uppercase tracking-widest border-b-4 border-gray-950 transition-colors shadow-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Home
                </button>
              </div>
            )}

            {page === "result" && candidate && (
              /* Final Exam Results Summary */
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-xs p-8 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-red-50 border-2 border-brand-red">
                    <Award className="w-8 h-8 text-brand-red" />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-3xl font-display font-black text-dark-charcoal uppercase italic tracking-tight">Certification Evaluation Finalized</h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-xl mx-auto">
                      The official competency scorecard and security proctor indices have been calculated for candidate {candidate.name.toUpperCase()}.
                    </p>
                  </div>

                  {/* Scoreboard metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto pt-4">
                    <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 text-center shadow-xs">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Technical Competency</span>
                      <div className="text-4xl font-black font-display text-dark-charcoal mt-1.5">{technicalScore}%</div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block tracking-wider">(Minimum 90% required)</span>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 text-center shadow-xs">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Proctor Integrity Score</span>
                      <div className={`text-4xl font-black font-display mt-1.5 ${
                        integrityScore >= 60 ? "text-emerald-600" : "text-brand-red"
                      }`}>{integrityScore}%</div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block tracking-wider">(Minimum 60% required)</span>
                    </div>
                  </div>

                  {/* Outcome Alert */}
                  {technicalScore >= 90 && integrityScore >= 60 ? (
                    <div className="bg-emerald-50 text-emerald-900 border-2 border-emerald-500 p-5 rounded-xl max-w-xl mx-auto text-xs font-bold leading-relaxed shadow-xs">
                      Congratulations! You met the demanding technical requirement (≥90%) and maintained exemplary proctoring credibility (≥60%). You are hereby awarded the elite hardware engineer credential.
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-900 border-2 border-amber-500 p-5 rounded-xl max-w-xl mx-auto text-xs font-bold leading-relaxed text-left space-y-1.5 shadow-xs">
                      <div className="font-display font-black text-dark-charcoal uppercase tracking-wider">Registry Status: Certification Attempt Incomplete</div>
                      <p className="font-medium text-gray-600">
                        To claim the "Lenovo Elite Engineer" certificate, you must achieve a Technical Score of 90% or higher, and maintain an Integrity Score of 60% or higher.
                      </p>
                    </div>
                  )}

                  {/* Actions for failing or passing */}
                  {!(technicalScore >= 90 && integrityScore >= 60) && (
                    <div className="pt-4">
                      <button
                        onClick={handleResetExam}
                        className="certification-btn inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-black px-6 py-3.5 rounded-lg text-xs uppercase tracking-widest border-b-4 border-red-800 transition-colors shadow-none"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reattempt Certification Assessment
                      </button>
                    </div>
                  )}
                </div>

                {/* If passed, display the high-fidelity download certificate */}
                {technicalScore >= 90 && integrityScore >= 60 && certificateId && (
                  <Certificate
                    candidateName={candidate.name}
                    employeeId={candidate.employeeId}
                    technicalScore={technicalScore}
                    integrityScore={integrityScore}
                    date={examDate}
                    certificateId={certificateId}
                  />
                )}
              </div>
            )}

            {page === "admin" && (
              <AdminDashboard onClose={() => setPage("ready")} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
