/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Award,
  Shield,
  Trash2,
  TrendingUp,
  Clock,
  ArrowUpDown,
  RefreshCw,
  FileSpreadsheet,
  Users,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Eye,
  LogOut
} from "lucide-react";
import { AssessmentResult, AdminAnalytics } from "../types";
import { apiService } from "../api";

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "candidates">("overview");

  // Fetch assessments and analytics from our Express backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dataAssessments, dataAnalytics] = await Promise.all([
        apiService.getAssessments(searchTerm),
        apiService.getAnalytics(),
      ]);

      setAssessments(dataAssessments);
      setAnalytics(dataAnalytics);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  // Handle Clear Database (for testing convenience)
  const handleResetDatabase = async () => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently clear all candidate results and records? This action cannot be undone.")) return;
    try {
      await apiService.clearDatabase();
      alert("Database cleared successfully.");
      fetchData();
      setSelectedResult(null);
    } catch (err) {
      console.error("Reset database failed:", err);
    }
  };

  // Export search results to CSV format
  const exportToCSV = () => {
    if (assessments.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Build headers
    const headers = [
      "Employee ID",
      "Candidate Name",
      "Date",
      "Technical Score (%)",
      "Integrity Score (%)",
      "Status",
      "Certificate ID",
      "Total Violations"
    ];

    const rows = assessments.map(a => [
      a.employeeId,
      `"${a.candidateName.replace(/"/g, '""')}"`,
      new Date(a.date).toLocaleDateString(),
      a.technicalScore,
      a.integrityScore,
      a.disqualified ? "DISQUALIFIED" : a.pass ? "PASSED" : "FAILED",
      a.certificateId || "N/A",
      a.integrityEvents.length
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lenovo_Elite_Engineer_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#f4f5f6] min-h-screen font-sans text-dark-charcoal selection:bg-brand-red selection:text-white">
      {/* Admin Header */}
      <header className="bg-dark-charcoal text-white border-b-2 border-dark-charcoal sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="bg-brand-red text-white font-black px-4 py-1.5 text-xs uppercase tracking-widest-plus rounded-none shadow-xs text-center">
              Lenovo
            </div>
            <div>
              <h1 className="text-sm font-display font-black uppercase tracking-tight italic">Elite Engineer Admin Portal</h1>
              <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">Registry Oversight & Analytics Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="admin-trigger p-2.5 bg-gray-800 hover:bg-gray-750 text-white rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="admin-trigger inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-b-4 border-red-800 transition-colors shadow-none"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-gray-200 gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`admin-trigger py-3 px-5 text-xs font-black uppercase tracking-wider border-b-4 transition-colors ${
              activeTab === "overview"
                ? "border-brand-red text-brand-red bg-white"
                : "border-transparent text-gray-500 hover:text-dark-charcoal hover:bg-gray-100"
            }`}
          >
            Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={`admin-trigger py-3 px-5 text-xs font-black uppercase tracking-wider border-b-4 transition-colors ${
              activeTab === "candidates"
                ? "border-brand-red text-brand-red bg-white"
                : "border-transparent text-gray-500 hover:text-dark-charcoal hover:bg-gray-100"
            }`}
          >
            Candidate Database & Reports ({assessments.length})
          </button>
        </div>

        {activeTab === "overview" && analytics && (
          <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Total Candidates</div>
                  <div className="text-4xl font-black font-display text-dark-charcoal mt-1.5">{analytics.totalCandidates}</div>
                </div>
                <div className="w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center border-2 border-gray-100 shrink-0">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Certification Pass Rate</div>
                  <div className="text-4xl font-black font-display text-emerald-600 mt-1.5">{analytics.passRate}%</div>
                </div>
                <div className="w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center border-2 border-gray-100 shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Average Technical</div>
                  <div className="text-4xl font-black font-display text-dark-charcoal mt-1.5">{analytics.averageTechnicalScore}%</div>
                </div>
                <div className="w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center border-2 border-gray-100 shrink-0">
                  <Award className="w-5 h-5 text-orange-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Average Integrity</div>
                  <div className="text-4xl font-black font-display text-dark-charcoal mt-1.5">{analytics.averageIntegrityScore}%</div>
                </div>
                <div className="w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center border-2 border-gray-100 shrink-0">
                  <Shield className="w-5 h-5 text-cyan-600" />
                </div>
              </div>
            </div>

            {/* Quick Summary Counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 p-4 rounded-lg border-2 border-emerald-200 flex items-center gap-3 shadow-xs">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">PASSED CERTIFICATIONS</div>
                  <div className="text-2xl font-black font-display text-emerald-900">{analytics.totalPassed}</div>
                </div>
              </div>

              <div className="bg-red-50/50 p-4 rounded-lg border-2 border-brand-red/35 flex items-center gap-3 shadow-xs animate-pulse">
                <AlertOctagon className="w-5 h-5 text-brand-red shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">INTEGRITY DISQUALIFICATIONS</div>
                  <div className="text-2xl font-black font-display text-brand-red">{analytics.totalDisqualified}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 flex items-center gap-3 shadow-xs">
                <XCircle className="w-5 h-5 text-gray-500 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">TECHNICAL RETRY / FAIL</div>
                  <div className="text-2xl font-black font-display text-dark-charcoal">{analytics.totalFailed}</div>
                </div>
              </div>
            </div>

            {/* Bottom Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leaderboard Panel */}
              <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b-2 border-gray-250 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-display font-black text-dark-charcoal text-sm uppercase tracking-tight flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top Certified Performers
                  </h3>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Technical Score Priority</span>
                </div>
                
                <div className="p-4 space-y-3">
                  {analytics.topPerformers.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-8 uppercase font-bold tracking-wider">
                      No passing certified engineers registered yet.
                    </div>
                  ) : (
                    analytics.topPerformers.map((tp, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-xs font-bold text-slate-400 font-mono">#{idx+1}</span>
                          <div>
                            <div className="text-xs font-black text-dark-charcoal uppercase tracking-wider">{tp.candidateName}</div>
                            <div className="text-[9px] font-mono font-bold text-gray-400 uppercase">ID: {tp.employeeId}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-xs font-black text-brand-red">Tech: {tp.technicalScore}%</div>
                            <div className="text-[9px] font-mono font-bold text-gray-400 uppercase">Integrity: {tp.integrityScore}%</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reset Utilities Panel */}
              <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xs p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-black text-dark-charcoal text-sm uppercase tracking-tight flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-red" />
                    Technical Registry Controls
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mt-2 font-medium">
                    Oversight tools to facilitate test administration, candidate resetting, or database purge in compliance with organizational field training operations.
                  </p>
                </div>

                <div className="mt-8 space-y-3 pt-6 border-t border-gray-100">
                  <button
                    onClick={handleResetDatabase}
                    className="certification-btn w-full bg-white hover:bg-red-50 text-slate-700 hover:text-brand-red border-2 border-gray-200 hover:border-brand-red px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge All Certified Records (Factory Reset)
                  </button>
                  <p className="text-[9px] text-gray-400 text-center font-mono uppercase font-bold tracking-wider">
                    Warning: Purging database will wipe all registry ID entries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Candidate List and Deep-dives Tab */}
        {(activeTab === "candidates" || !analytics) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Search and Table Column */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Employee ID, Name, or Credential ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border-2 border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:border-brand-red font-medium"
                  />
                </div>

                <button
                  onClick={exportToCSV}
                  className="certification-btn inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-b-4 border-emerald-800 transition-colors shrink-0 shadow-none"
                >
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                  Export to CSV
                </button>
              </div>

              {/* Assessment Records Table */}
              <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest font-mono">
                        <th className="px-5 py-3">Employee</th>
                        <th className="px-5 py-3">Technical</th>
                        <th className="px-5 py-3">Integrity</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-xs">
                      {assessments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-gray-400 py-12 uppercase font-bold tracking-wider">
                            {loading ? "Searching registry..." : "No assessment records found matching criteria."}
                          </td>
                        </tr>
                      ) : (
                        assessments.map((a, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedResult(a)}
                            className={`hover:bg-gray-50/70 cursor-pointer transition-colors ${
                              selectedResult?.employeeId === a.employeeId ? "bg-red-50/20 font-semibold border-l-4 border-brand-red" : ""
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="font-black text-dark-charcoal uppercase tracking-wider">{a.candidateName}</div>
                              <div className="text-[10px] font-mono font-bold text-gray-400 uppercase">ID: {a.employeeId}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-black font-mono text-dark-charcoal">{a.technicalScore}%</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-black font-mono text-dark-charcoal">{a.integrityScore}%</div>
                            </td>
                            <td className="px-5 py-3.5">
                              {a.disqualified ? (
                                <span className="bg-brand-red text-white border border-red-700 px-2.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider">
                                  DISQUALIFIED
                                </span>
                              ) : a.pass ? (
                                <span className="bg-emerald-500 text-white border border-emerald-600 px-2.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider">
                                  PASSED
                                </span>
                              ) : (
                                <span className="bg-gray-200 text-gray-700 border border-gray-300 px-2.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider">
                                  FAILED
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-gray-400 uppercase">
                              {new Date(a.date).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedResult(a);
                                }}
                                className="admin-trigger text-brand-red hover:text-red-700 font-black uppercase tracking-wider text-[10px] border-b-2 border-transparent hover:border-brand-red transition-all"
                              >
                                View Logs
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Audit Log / Detail Panel Column */}
            <div className="lg:col-span-4">
              {selectedResult ? (
                <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xs p-5 space-y-5 sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto">
                  <div className="flex items-start justify-between border-b border-gray-150 pb-3">
                    <div>
                      <h4 className="font-display font-black text-dark-charcoal text-sm uppercase tracking-tight">{selectedResult.candidateName}</h4>
                      <p className="text-[10px] font-mono font-bold text-gray-400 uppercase">ID: {selectedResult.employeeId.toUpperCase()}</p>
                    </div>
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="text-xs text-gray-400 hover:text-brand-red font-black uppercase tracking-widest"
                    >
                      Close
                    </button>
                  </div>

                  {/* Summary Metric Stats inside details */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border-2 border-gray-200 shadow-inner">
                    <div>
                      <span className="text-[9px] text-gray-400 font-black block uppercase tracking-wider">Technical Score</span>
                      <span className="text-xl font-black text-dark-charcoal font-display">{selectedResult.technicalScore}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-black block uppercase tracking-wider">Integrity Score</span>
                      <span className={`text-xl font-black font-display ${
                        selectedResult.integrityScore >= 60 ? "text-emerald-600" : "text-brand-red"
                      }`}>{selectedResult.integrityScore}%</span>
                    </div>
                  </div>

                  {/* Credential verification ID */}
                  {selectedResult.certificateId && (
                    <div className="p-3.5 bg-amber-50/50 rounded-lg border-2 border-amber-200 text-[11px] shadow-xs">
                      <span className="font-black text-amber-800 block uppercase tracking-wider">LENOVO REGISTRY ENTRY:</span>
                      <span className="font-mono font-bold text-amber-950 block mt-1">{selectedResult.certificateId}</span>
                    </div>
                  )}

                  {/* Integrity Audit Events Section */}
                  <div className="space-y-3">
                    <h5 className="font-display font-black text-dark-charcoal text-xs uppercase tracking-wider">
                      Integrity Audit Log ({selectedResult.integrityEvents.length})
                    </h5>

                    {selectedResult.integrityEvents.length === 0 ? (
                      <div className="text-[10px] text-gray-400 text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-gray-200 uppercase font-bold tracking-wide">
                        No integrity violations detected during this assessment session. Flawless proctor performance.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {selectedResult.integrityEvents.map((evt, eIdx) => (
                          <div key={eIdx} className="bg-gray-50 p-3 rounded-lg border-2 border-gray-200 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-white uppercase font-mono text-[9px] bg-brand-red px-1.5 py-0.5 rounded-sm">
                                -{evt.pointsDeducted} PTS
                              </span>
                              <span className="text-[9px] text-gray-400 font-mono font-bold">
                                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <div className="font-black text-dark-charcoal uppercase tracking-wider text-[11px]">{evt.type}</div>
                            <div className="text-gray-500 font-medium leading-normal">{evt.description}</div>
                            <div className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wide">Balance Credibility: {evt.remainingPoints} pts</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Candidate Question Answers Summary */}
                  <div className="space-y-3 border-t-2 border-gray-100 pt-4">
                    <h5 className="font-display font-black text-dark-charcoal text-xs uppercase tracking-wider">
                      Competency Responses
                    </h5>
                    
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-[11px]">
                      {selectedResult.questionResponses.map((qr, qIdx) => (
                        <div key={qIdx} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border-2 border-gray-200">
                          <div>
                            <span className="font-black text-dark-charcoal uppercase tracking-wider">Question {qIdx + 1}</span>
                            <span className="text-[9px] font-mono font-bold text-gray-400 block mt-0.5">TIME: {qr.timeTakenSeconds}S</span>
                          </div>
                          {qr.isCorrect ? (
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-sm border border-emerald-600 uppercase tracking-wider">
                              CORRECT
                            </span>
                          ) : (
                            <span className="bg-brand-red text-white text-[9px] font-black px-2 py-0.5 rounded-sm border border-red-700 uppercase tracking-wider">
                              INCORRECT
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 sticky top-24 shadow-inner">
                  <Shield className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-sans font-bold uppercase tracking-wide leading-relaxed">
                    Select a candidate record from the database to view deep-dive integrity logs, technical competencies, and full proctoring logs.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
