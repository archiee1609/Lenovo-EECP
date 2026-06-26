/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, ArrowRight, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Question, QuestionResponse } from "../types";
import { Avatar, AvatarExpression, AvatarGesture } from "./Avatar";

interface AssessmentProps {
  questions: Question[];
  candidateName: string;
  employeeId: string;
  integrityScore: number;
  onAssessmentCompleted: (technicalScore: number, questionResponses: QuestionResponse[]) => void;
  onForceDisqualified: () => void;
  setAvatarState: (expression: AvatarExpression, gesture: AvatarGesture, speech: string) => void;
  avatarExpression: AvatarExpression;
  avatarGesture: AvatarGesture;
  avatarSpeech: string;
}

export const Assessment: React.FC<AssessmentProps> = ({
  questions,
  candidateName,
  employeeId,
  integrityScore,
  onAssessmentCompleted,
  onForceDisqualified,
  setAvatarState,
  avatarExpression,
  avatarGesture,
  avatarSpeech,
}) => {
  const [currentIdx, setCurrentIdx] = useState(-1); // -1 is Introduction script
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);

  const timerRef = useRef<number | null>(null);
  const questionStartRef = useRef<number>(0);

  // Intro trigger
  useEffect(() => {
    if (currentIdx === -1) {
      // Mandatory Intro Script exactly as requested
      const introScript = `Hello and welcome.
My name is Alex, and I will be your virtual interviewer today.
Before we begin, I'd like to briefly explain how this interview will be conducted.
This assessment is designed to evaluate your knowledge, experience, and problem-solving abilities through verbal responses.
To ensure a fair and consistent evaluation for all participants, the session is monitored for interview integrity.
During the interview, our system may observe indicators such as:
• Keyboard activity
• Window or tab switching
• Extended periods of looking away from the screen
• Mobile phone usage
• Multiple people appearing in the camera frame
• Extended absence from the camera view
Please note that these indicators do not automatically imply misconduct.
They are simply used to calculate an Interview Integrity Score.
Your Integrity Score begins at 100 points.
The following events may reduce the score:
• Keyboard activity during response: -10 points
• Repeated keyboard activity: -20 points
• Window or application switching: -25 points
• Looking away from the screen for more than 5 seconds: -10 points
• Mobile phone detected: -30 points
• Multiple faces detected: -30 points
• Camera view unavailable for more than 10 seconds: -20 points
At the end of the interview, two independent scores will be generated:
Technical Competency Score
Interview Integrity Score
Both scores will be reviewed together as part of the overall evaluation process.
To achieve the best experience, please ensure:
• Your camera remains on throughout the interview.
• Your face remains clearly visible.
• You answer all questions using mouse click.
Any other click rather than answers may decrease integrity points.
• Mobile phones and other reference materials are kept away.
• Browser searches, external assistance, and note-taking are avoided.
If you are ready, we can begin.
I wish you the very best for your interview today.`;

      setAvatarState("neutral", "listening", introScript);
    }
  }, [currentIdx]);

  // Question Timer
  useEffect(() => {
    if (currentIdx >= 0 && currentIdx < questions.length && !isAnswered) {
      questionStartRef.current = Date.now();
      setTimeTaken(0);
      
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setTimeTaken(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIdx, isAnswered]);

  // Read next question
  const startAssessment = () => {
    setCurrentIdx(0);
    loadQuestion(0);
  };

  const loadQuestion = (idx: number) => {
    const q = questions[idx];
    setSelectedOption(null);
    setIsAnswered(false);

    // Speak Question Text
    const speakText = `Question ${q.id}. ${q.text}`;
    setAvatarState("thinking", "none", speakText);
  };

  // Option Click Handler
  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const q = questions[currentIdx];
    const isCorrect = option.trim() === q.correctAnswer.trim();
    const duration = Math.round((Date.now() - questionStartRef.current) / 1000) || 1;

    // Record response
    const newResponse: QuestionResponse = {
      questionId: q.id,
      selectedOption: option,
      isCorrect,
      timeTakenSeconds: duration
    };

    setResponses(prev => [...prev, newResponse]);

    // Avatar Reaction based on Answer correctness
    if (isCorrect) {
      setAvatarState("smile", "thumbsUp", `Excellent! That is correct. ${q.explanation}`);
    } else {
      setAvatarState("neutral", "none", `Understood. The correct answer is option ${q.correctAnswer.charAt(0)}. Let's review why: ${q.explanation}`);
    }
  };

  const handleNextClick = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      loadQuestion(nextIdx);
    } else {
      // Calculate score and complete
      const correctAnswers = responses.filter(r => r.isCorrect).length;
      const techScore = Math.round((correctAnswers / questions.length) * 100);
      onAssessmentCompleted(techScore, responses);
    }
  };

  const currentQuestion = currentIdx >= 0 ? questions[currentIdx] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
      {/* Alex Avatar Panel on Left */}
      <div className="lg:col-span-5 space-y-4">
        <Avatar
          expression={avatarExpression}
          gesture={avatarGesture}
          speechText={avatarSpeech}
        />
        
        {/* Helper Card detailing Proctor status */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Assessment Auditing</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F7F7F7] p-3 rounded-lg border border-gray-200 text-center">
              <span className="text-gray-500 block font-black uppercase tracking-wider text-[9px] mb-1">TOTAL QUESTIONS</span>
              <span className="font-display font-black text-dark-charcoal text-sm">{questions.length} Questions</span>
            </div>
            <div className="bg-[#F7F7F7] p-3 rounded-lg border border-gray-200 text-center">
              <span className="text-gray-500 block font-black uppercase tracking-wider text-[9px] mb-1">CURRENT INDEX</span>
              <span className="font-display font-black text-dark-charcoal text-sm">
                {currentIdx === -1 ? "Introduction" : `Q. ${currentIdx + 1} / ${questions.length}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Assessment Conversational Interface */}
      <div className="lg:col-span-7 flex flex-col min-h-[460px] bg-white border-2 border-gray-200 rounded-xl shadow-xs p-6 md:p-8 justify-between">
        {currentIdx === -1 ? (
          /* Introduction Ready screen view */
          <div className="flex flex-col items-center justify-center text-center my-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border-2 border-brand-red/20">
              <MessageSquare className="w-8 h-8 text-brand-red" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-display font-black text-dark-charcoal uppercase italic tracking-tight">Mandatory Briefing Session</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Please listen carefully to virtual interviewer Alex as he details the integrity metrics and structural boundaries of the Lenovo certification exam.
              </p>
            </div>

            <button
              onClick={startAssessment}
              className="certification-btn inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-black px-6 py-3.5 rounded-lg text-xs uppercase tracking-widest border-b-4 border-red-800 transition-colors shadow-none"
            >
              Start Certification Assessment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Live Question Assessment Chat Interface */
          <div className="flex flex-col justify-between h-full space-y-6">
            {/* Balloon layout */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b-2 border-gray-100 pb-3">
                <span className="bg-brand-red text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest shadow-xs">
                  {currentQuestion?.category.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 font-bold tracking-wider uppercase">Question {currentIdx + 1} of {questions.length}</span>
              </div>

              {/* Chat Bubble Alex */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-dark-charcoal text-white font-black text-sm flex items-center justify-center shrink-0 border-2 border-white shadow-md font-display">
                  A
                </div>
                <div className="bg-gray-100 p-5 rounded-2xl rounded-tl-none border-2 border-gray-200 text-sm font-bold text-dark-charcoal leading-snug shadow-xs">
                  {currentQuestion?.text}
                </div>
              </div>

              {/* Timer metrics if not answered */}
              {!isAnswered && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pl-14 font-mono font-black uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                  Time spent on this question: {timeTaken} seconds
                </div>
              )}

              {/* Clickable Option Buttons */}
              <div className="pl-14 space-y-3 pt-4">
                {currentQuestion?.options.map((opt, oIdx) => {
                  const isSelected = selectedOption === opt;
                  const isCorrectAnswer = opt.trim() === currentQuestion.correctAnswer.trim();
                  const letterLabel = String.fromCharCode(65 + oIdx);
                  
                  let optStyle = "bg-white border-2 border-gray-200 hover:border-brand-red hover:bg-gray-50 text-dark-charcoal";
                  let badgeStyle = "bg-gray-100 text-dark-charcoal group-hover:bg-brand-red group-hover:text-white";

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      optStyle = "bg-emerald-50 border-2 border-emerald-500 text-emerald-900";
                      badgeStyle = "bg-emerald-500 text-white";
                    } else if (isSelected) {
                      optStyle = "bg-red-50 border-2 border-brand-red text-brand-red";
                      badgeStyle = "bg-brand-red text-white";
                    } else {
                      optStyle = "bg-gray-50 border border-gray-200 text-gray-400 opacity-60 cursor-not-allowed";
                      badgeStyle = "bg-gray-200 text-gray-400";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isAnswered}
                      onClick={() => handleOptionClick(opt)}
                      className={`certification-btn w-full text-left p-4 rounded-xl border-2 text-xs font-black transition-all flex items-center justify-between gap-3 group shadow-xs ${optStyle}`}
                    >
                      <div className="flex items-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-black shrink-0 transition-colors shadow-xs ${badgeStyle}`}>
                          {letterLabel}
                        </span>
                        <span className="font-bold">{opt}</span>
                      </div>
                      {isAnswered && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                      {isAnswered && isSelected && !isCorrectAnswer && <XCircle className="w-5 h-5 text-brand-red shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Answer Explanation & Next Action Button */}
            {isAnswered && (
              <div className="pl-14 pt-4 border-t-2 border-gray-100 mt-6 space-y-4 animate-fade-in">
                <div className="bg-[#F7F7F7] p-5 rounded-lg border-2 border-gray-200 text-xs text-gray-700 leading-relaxed shadow-xs">
                  <div className="font-display font-black text-dark-charcoal uppercase tracking-wider flex items-center gap-1.5 mb-2 text-xs">
                    <ShieldCheck className="w-4 h-4 text-brand-red" />
                    Technical Explanation
                  </div>
                  {currentQuestion?.explanation}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNextClick}
                    className="certification-btn inline-flex items-center gap-2 bg-dark-charcoal hover:bg-black text-white font-black px-6 py-3 rounded-lg text-xs uppercase tracking-widest border-b-4 border-gray-900 transition-colors shadow-none"
                  >
                    {currentIdx + 1 === questions.length ? "Submit and View Final Scores" : "Proceed to Next Question"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
