/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldAlert, Video, CircleCheck, CircleAlert, Monitor, ArrowRight, UserCheck, ShieldCheck } from "lucide-react";
import { CameraProctor } from "./CameraProctor";
import { apiService } from "../api";

interface ReadyScreenProps {
  onStartAssessment: (name: string, employeeId: string) => void;
  onOpenAdmin: () => void;
}

export const ReadyScreen: React.FC<ReadyScreenProps> = ({ onStartAssessment, onOpenAdmin }) => {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingId, setCheckingId] = useState(false);
  const [idErrorMsg, setIdErrorMsg] = useState<string | null>(null);

  // Ready system check statuses
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [micChecked, setMicChecked] = useState(false);
  const [browserChecked, setBrowserChecked] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  // Micro check simulations
  useEffect(() => {
    // Microphone permissions & compatibility check
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      setMicChecked(true);
    }
    // Browser features check (canvas, localStorage, speech synthesis)
    if (typeof window !== "undefined" && window.speechSynthesis && window.localStorage && HTMLCanvasElement) {
      setBrowserChecked(true);
    }
    // Simulate model optimize delay
    const timer = setTimeout(() => {
      setModelLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Registry validation check
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim()) return;

    setCheckingId(true);
    setIdErrorMsg(null);

    const cleanId = employeeId.trim().toUpperCase();

    try {
      const check = await apiService.checkCandidate(cleanId);
      if (check.exists && check.completed) {
        setIdErrorMsg("You have already completed this certification.");
        setCheckingId(false);
        return;
      }

      // If checks pass, register on database
      await apiService.registerCandidate(name.trim(), cleanId);
      setIsRegistered(true);
    } catch (err: any) {
      console.error("Verification error:", err);
      setIdErrorMsg(err.message || "Database network connection failure.");
    } finally {
      setCheckingId(false);
    }
  };

  const isSystemReady =
    name.trim().length > 0 &&
    employeeId.trim().length > 0 &&
    cameraActive &&
    faceDetected &&
    micChecked &&
    browserChecked;

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none font-sans">
      {/* Top Welcome Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-brand-red text-white px-4 py-1.5 font-black text-[10px] uppercase tracking-widest-plus shadow-xs">
          Official Lenovo Field Certification
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-dark-charcoal uppercase italic">
          Elite Engineer Certification
        </h2>
        <p className="text-xs text-gray-500 max-w-xl mx-auto leading-relaxed">
          Technical evaluation and visual proctor session leading to official credential award for Lenovo Hardware Engineers.
        </p>
      </div>

      {!isRegistered ? (
        /* Login / Registration Panel */
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl border-2 border-gray-200 shadow-xs space-y-6">
          <div className="border-b-2 border-gray-100 pb-4 flex justify-between items-center">
            <h3 className="font-display font-black text-dark-charcoal text-sm uppercase tracking-wider">Engineer Entry Registration</h3>
            <button
              onClick={onOpenAdmin}
              className="admin-trigger text-[10px] text-gray-400 hover:text-brand-red font-mono font-black tracking-widest"
            >
              ADMIN PORTAL
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1.5">
                Full Candidate Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-hidden focus:border-brand-red text-dark-charcoal"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1.5">
                Unique Employee ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. LEN9238"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-hidden focus:border-brand-red font-mono font-black text-dark-charcoal"
              />
            </div>

            {idErrorMsg && (
              <div className="bg-red-50 text-brand-red border-2 border-red-200 rounded-lg p-3.5 text-xs flex gap-2 items-start font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{idErrorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={checkingId || !name.trim() || !employeeId.trim()}
              className="certification-btn w-full bg-brand-red hover:bg-red-700 text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest-plus transition-colors border-b-4 border-red-800 disabled:bg-gray-200 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {checkingId ? "Verifying Credentials..." : "Validate and Lock Credentials"}
            </button>
          </form>
        </div>
      ) : (
        /* Hardware Ready & System Check Panel */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Proctor Monitoring Feed preview */}
          <CameraProctor
            onEventTriggered={() => {}} // no-op during ready system check phase
            isAssessmentActive={false}
            integrityScore={100}
            onCameraActiveChange={setCameraActive}
            onFaceDetectedChange={setFaceDetected}
          />

          {/* System Check checklist */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xs p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="border-b-2 border-gray-100 pb-4">
                <h3 className="font-display font-black text-dark-charcoal text-base uppercase tracking-tight">Verification Auditing</h3>
                <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-0.5">Please ensure all hardware systems align in green.</p>
              </div>

              {/* Checklist indicators */}
              <div className="space-y-3">
                {/* 1. Camera Active */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border-2 border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-gray-400" />
                    <span className="font-black text-dark-charcoal text-xs uppercase tracking-wider">Camera Permission & Feed</span>
                  </div>
                  {cameraActive ? (
                    <span className="text-emerald-600 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                      <CircleCheck className="w-4.5 h-4.5 fill-emerald-50" />
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-brand-red font-black text-xs uppercase tracking-wider flex items-center gap-1">
                      <CircleAlert className="w-4.5 h-4.5" />
                      REQUIRED
                    </span>
                  )}
                </div>

                {/* 2. Face Detected */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border-2 border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span className="font-black text-dark-charcoal text-xs uppercase tracking-wider">Biometric Alignment</span>
                  </div>
                  {faceDetected ? (
                    <span className="text-emerald-600 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                      <CircleCheck className="w-4.5 h-4.5 fill-emerald-50" />
                      CENTERED
                    </span>
                  ) : (
                    <span className="text-brand-red font-black text-xs uppercase tracking-wider flex items-center gap-1">
                      <CircleAlert className="w-4.5 h-4.5" />
                      NO FACE FOUND
                    </span>
                  )}
                </div>

                {/* 3. Audio hardware */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border-2 border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <span className="font-black text-dark-charcoal text-xs uppercase tracking-wider">Audio Synthesis</span>
                  </div>
                  {micChecked ? (
                    <span className="text-emerald-600 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                      <CircleCheck className="w-4.5 h-4.5 fill-emerald-50" />
                      COMPATIBLE
                    </span>
                  ) : (
                    <span className="text-amber-500 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                      <CircleAlert className="w-4.5 h-4.5" />
                      PENDING
                    </span>
                  )}
                </div>

                {/* 4. Integrity Model Load */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border-2 border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-gray-400" />
                    <span className="font-black text-dark-charcoal text-xs uppercase tracking-wider">Proctor Models</span>
                  </div>
                  {!modelLoading ? (
                    <span className="text-emerald-600 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                      <CircleCheck className="w-4.5 h-4.5 fill-emerald-50" />
                      OPTIMIZED
                    </span>
                  ) : (
                    <span className="text-amber-500 font-black text-xs uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      OPTIMIZING...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Metadata Locked Tag */}
            <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg space-y-1.5">
              <div className="text-[9px] font-black text-gray-400 tracking-widest uppercase">LOCKED CANDIDATE RECORD:</div>
              <div className="flex justify-between text-xs font-mono font-black">
                <span className="text-dark-charcoal">{name.toUpperCase()}</span>
                <span className="text-brand-red">ID: {employeeId.toUpperCase()}</span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => onStartAssessment(name, employeeId)}
              disabled={!isSystemReady}
              className="certification-btn w-full mt-6 bg-brand-red hover:bg-red-700 text-white font-black py-3.5 rounded-lg text-xs uppercase tracking-widest-plus transition-all flex items-center justify-center gap-2 border-b-4 border-red-800 disabled:bg-gray-200 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-none"
            >
              Lock Feed and Start Assessment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
