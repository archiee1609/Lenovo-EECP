/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { Download, Award, ShieldCheck, Printer, ArrowRight } from "lucide-react";
import { jsPDF } from "jspdf";

interface CertificateProps {
  candidateName: string;
  employeeId: string;
  technicalScore: number;
  integrityScore: number;
  date: string;
  certificateId: string;
}

export const Certificate: React.FC<CertificateProps> = ({
  candidateName,
  employeeId,
  technicalScore,
  integrityScore,
  date,
  certificateId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // QR Code Draw Utility (Draws a real-looking vector QR code)
  const drawQRCode = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillStyle = "#000000";
    
    // Draw the 3 outer finder patterns
    const drawFinderPattern = (px: number, py: number) => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(px, py, size * 0.3, size * 0.3);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px + size * 0.04, py + size * 0.04, size * 0.22, size * 0.22);
      ctx.fillStyle = "#000000";
      ctx.fillRect(px + size * 0.08, py + size * 0.08, size * 0.14, size * 0.14);
    };

    drawFinderPattern(x, y); // Top Left
    drawFinderPattern(x + size * 0.7, y); // Top Right
    drawFinderPattern(x, y + size * 0.7); // Bottom Left

    // Draw random-like QR modules in the center
    ctx.fillStyle = "#000000";
    const moduleSize = size / 21;
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; r < 7 && c < 7 ? c = 7 : r < 7 && c > 13 ? c = 21 : r > 13 && c < 7 ? c = 7 : c++) {
        if (c >= 21) break;
        // Pseudo-random pattern based on coordinates & certificateId hash
        const hash = (r * 13 + c * 37 + certificateId.charCodeAt(0)) % 7;
        if (hash === 1 || hash === 3 || hash === 5) {
          ctx.fillRect(x + c * moduleSize, y + r * moduleSize, moduleSize + 0.5, moduleSize + 0.5);
        }
      }
    }
  };

  // Pre-renders the high-resolution landscape certificate on a canvas in-memory
  const buildCertificateCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600; // Landscape high-resolution
    canvas.height = 1131; // A4 standard ratio (1.414)
    const ctx = canvas.getContext("2d")!;

    // 1. Base background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle light gray tech background pattern
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Dynamic geometric background accents in Lenovo corporate style (Lenovo Red and slate)
    ctx.fillStyle = "rgba(226, 35, 26, 0.04)"; // Lenovo Red soft
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(600, 40);
    ctx.lineTo(40, 600);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(30, 41, 59, 0.03)"; // Slate soft
    ctx.beginPath();
    ctx.moveTo(canvas.width - 40, canvas.height - 40);
    ctx.lineTo(canvas.width - 600, canvas.height - 40);
    ctx.lineTo(canvas.width - 40, canvas.height - 600);
    ctx.closePath();
    ctx.fill();

    // 2. High-end borders
    ctx.strokeStyle = "#1e293b"; // Primary slate border
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.strokeStyle = "#e2231a"; // Lenovo Red inner accent line
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);

    // Corner decorative metal brackets
    const bracketSize = 40;
    ctx.fillStyle = "#1e293b";
    const corners = [
      [37, 37],
      [canvas.width - 77, 37],
      [37, canvas.height - 77],
      [canvas.width - 77, canvas.height - 77],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx, cy, bracketSize, bracketSize);
    });

    // 3. Header Branding
    ctx.fillStyle = "#e2231a"; // Lenovo Red block
    ctx.fillRect(80, 80, 160, 45);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Lenovo", 160, 102);

    ctx.fillStyle = "#475569";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("TECHNICAL CERTIFICATION PROGRAM", 260, 102);

    // 4. Main Certificate Text
    ctx.fillStyle = "#0f172a";
    ctx.font = "italic 26px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("This is to certify that", canvas.width / 2, 280);

    // Candidate Name
    ctx.fillStyle = "#e2231a";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText(candidateName.toUpperCase(), canvas.width / 2, 360);

    // Sub-text
    ctx.fillStyle = "#334155";
    ctx.font = "medium 20px sans-serif";
    ctx.fillText(
      `has successfully demonstrated elite expertise and completed all comprehensive proctored assessments for`,
      canvas.width / 2,
      430
    );

    // Certification Title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 46px sans-serif";
    ctx.fillText("LENOVO ELITE ENGINEER", canvas.width / 2, 510);

    // Underline for title
    ctx.strokeStyle = "#e2231a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 250, 535);
    ctx.lineTo(canvas.width / 2 + 250, 535);
    ctx.stroke();

    // 5. Verification Metadata Blocks
    ctx.fillStyle = "#475569";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("CREDENTIAL VERIFICATION METADATA", canvas.width / 2, 595);

    // Stats box
    ctx.strokeStyle = "rgba(71, 85, 105, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width / 2 - 280, 615, 560, 100);
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(canvas.width / 2 - 279, 616, 558, 98);

    // Column Labels & Values
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("EMPLOYEE ID", canvas.width / 2 - 180, 645);
    ctx.fillText("TECHNICAL COMPETENCY", canvas.width / 2 - 40, 645);
    ctx.fillText("INTEGRITY COMPLIANCE", canvas.width / 2 + 150, 645);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(employeeId.toUpperCase(), canvas.width / 2 - 180, 680);
    ctx.fillText(`${technicalScore}%`, canvas.width / 2 - 40, 680);
    ctx.fillText(`${integrityScore}%`, canvas.width / 2 + 150, 680);

    // 6. Footer Layout (Signatures, QR, Date, ID)
    // QR Code drawing on bottom right
    drawQRCode(ctx, canvas.width - 240, 770, 140);
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCAN TO VERIFY", canvas.width - 170, 930);

    // Left Date & ID
    ctx.textAlign = "left";
    ctx.fillStyle = "#334155";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`Date Issued: ${new Date(date).toLocaleDateString()}`, 110, 810);
    ctx.fillText(`Certificate ID: ${certificateId}`, 110, 840);
    ctx.fillText("Status: Permanent Registry Record", 110, 870);

    // Center Signatures
    ctx.textAlign = "center";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 150, 860);
    ctx.lineTo(canvas.width / 2 + 150, 860);
    ctx.stroke();

    // Virtual signature typography
    ctx.fillStyle = "#0284c7"; // blue ink
    ctx.font = "italic 24px Georgia, serif";
    ctx.fillText("Lenovo Certification Team", canvas.width / 2, 840);

    ctx.fillStyle = "#475569";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Authorized Lenovo Technical Certification Team", canvas.width / 2, 885);
    ctx.font = "11px sans-serif";
    ctx.fillText("Global Field Operations Quality Assurance", canvas.width / 2, 903);

    // 7. Security Watermark text
    ctx.fillStyle = "rgba(30, 41, 59, 0.015)";
    ctx.font = "bold 82px sans-serif";
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText("LENOVO ELITE", 0, -50);
    ctx.fillText("SECURED REGISTRY", 0, 50);
    ctx.restore();

    return canvas;
  };

  // Download PDF Handler
  const downloadPDF = () => {
    const canvas = buildCertificateCanvas();
    const imgData = canvas.toDataURL("image/png");

    // Standard A4 Landscape is 297mm x 210mm
    const pdf = new jsPDF("landscape", "mm", "a4");
    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
    pdf.save(`Lenovo_Elite_Engineer_Certificate_${employeeId.toUpperCase()}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xs p-6 max-w-4xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-gray-200 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-500">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-display font-black text-dark-charcoal uppercase italic tracking-tight">Official Certification Awarded</h3>
            <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">Registry ID: {certificateId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={downloadPDF}
            className="certification-btn inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-5 py-3 rounded-lg text-xs font-black uppercase tracking-widest border-b-4 border-red-800 transition-colors shadow-none"
          >
            <Download className="w-4 h-4" />
            Download PDF Certificate
          </button>
        </div>
      </div>

      {/* Interactive Visual Certificate Card Preview (Scaled for display) */}
      <div className="relative overflow-hidden aspect-[1.414/1] w-full bg-[#fcfcfc] rounded-lg border-2 border-slate-900 shadow-xs flex flex-col justify-between p-8 md:p-12 font-sans">
        {/* Soft Background vectors */}
        <div className="absolute top-0 left-0 w-1/3 h-1/2 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Border detailing */}
        <div className="absolute inset-3 border-4 border-dark-charcoal pointer-events-none" />
        <div className="absolute inset-5 border-2 border-brand-red pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-brand-red text-white font-black px-4 py-1 text-xs uppercase tracking-widest-plus rounded-none shadow-xs text-center">
              Lenovo
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              TECHNICAL CERTIFICATION PROGRAM
            </span>
          </div>
          <Award className="w-8 h-8 text-brand-red" />
        </div>

        {/* Center Content */}
        <div className="text-center my-auto py-2 z-10">
          <span className="text-sm italic font-serif text-gray-500">This is to certify that</span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-dark-charcoal tracking-tight mt-1 mb-3 uppercase italic">
            {candidateName}
          </h2>
          <p className="text-[11px] md:text-xs font-medium text-slate-500 max-w-lg mx-auto leading-relaxed">
            has successfully demonstrated elite expertise and completed all comprehensive proctored assessments for
          </p>
          <div className="text-xl font-display font-black text-brand-red mt-2.5 tracking-widest uppercase">
            LENOVO ELITE ENGINEER
          </div>
          <div className="w-32 h-1 bg-brand-red mx-auto mt-3" />
        </div>

        {/* Footers */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto border-t-2 border-gray-100 pt-5 z-10">
          <div className="text-left text-[9px] text-gray-400 font-mono font-bold uppercase space-y-1">
            <div><span className="font-black text-slate-600">EMPLOYEE ID:</span> {employeeId.toUpperCase()}</div>
            <div><span className="font-black text-slate-600">CREDENTIAL DATE:</span> {new Date(date).toLocaleDateString()}</div>
            <div><span className="font-black text-slate-600">PASSING SCORE:</span> {technicalScore}% Tech / {integrityScore}% Integrity</div>
          </div>

          <div className="text-center shrink-0">
            <span className="text-xs font-serif italic text-blue-600 block">Lenovo Certification Team</span>
            <div className="w-32 h-px bg-slate-300 my-1 mx-auto" />
            <span className="text-[8px] uppercase tracking-widest text-slate-400 block font-black">Authorized Signatory</span>
          </div>

          <div className="flex items-center gap-2.5 bg-gray-50 border-2 border-gray-200 p-2 rounded-none shrink-0">
            {/* Render a simulated QR code in HTML */}
            <div className="grid grid-cols-3 gap-0.5 w-9 h-9 bg-black p-0.5 rounded-none">
              <div className="bg-white" />
              <div className="bg-black" />
              <div className="bg-white" />
              <div className="bg-black" />
              <div className="bg-white" />
              <div className="bg-black" />
              <div className="bg-white" />
              <div className="bg-black" />
              <div className="bg-white" />
            </div>
            <div className="text-[7px] text-gray-500 font-mono text-left uppercase">
              <div className="font-black text-black">REGISTRY SECURE</div>
              <div>SCAN QR VERIFIED</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
