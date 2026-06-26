/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";

export type AvatarExpression =
  | "neutral"
  | "smile"
  | "frown"
  | "thinking"
  | "celebration"
  | "approval"
  | "concern";

export type AvatarGesture =
  | "none"
  | "thumbsUp"
  | "nod"
  | "headShake"
  | "listening"
  | "idle";

interface AvatarProps {
  expression: AvatarExpression;
  gesture: AvatarGesture;
  speechText?: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  expression,
  gesture,
  speechText,
  onSpeechStart,
  onSpeechEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState("");
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Skeletal animation states (for smooth lerping)
  const animStates = useRef({
    headY: 0,
    headX: 0,
    headRot: 0,
    eyeBlink: 0, // 0 = open, 1 = closed
    eyeGazeX: 0, // -1 = left, 1 = right
    eyeGazeY: 0, // -1 = up, 1 = down
    browY: 0, // offset
    browTilt: 0, // rotation
    mouthOpen: 0, // 0 = closed, 1 = open
    mouthSmile: 0.2, // -1 = frown, 1 = smile
    handY: 200, // hand position from bottom (0 = fully visible, 200 = hidden)
    shoulderRot: 0,
  });

  // Target animation targets
  const targets = useRef({
    headY: 0,
    headX: 0,
    headRot: 0,
    eyeBlink: 0,
    eyeGazeX: 0,
    eyeGazeY: 0,
    browY: 0,
    browTilt: 0,
    mouthOpen: 0,
    mouthSmile: 0.2,
    handY: 200,
  });

  // Web Speech API initialization
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Handle Speech Trigger
  useEffect(() => {
    if (!synthRef.current || !speechText || speechText === currentSpeechText) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    setIsSpeaking(false);
    targets.current.mouthOpen = 0;

    setCurrentSpeechText(speechText);

    // Speak delay to allow clean initialization
    const timer = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(speechText);
      utteranceRef.current = utterance;

      // Select Indian Male voice or best fallback
      const voices = synthRef.current?.getVoices() || [];
      let selectedVoice = voices.find(
        (v) => v.lang.includes("en-IN") && v.name.toLowerCase().includes("male")
      );
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.includes("en-IN"));
      }
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.includes("hi-IN"));
      }
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (v) => v.name.toLowerCase().includes("male") && v.lang.startsWith("en")
        );
      }
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.startsWith("en"));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Professional Indian Male style adjustments
      utterance.rate = 0.95; // professional, clear pacing
      utterance.pitch = 0.92; // slightly deeper corporate voice

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (onSpeechStart) onSpeechStart();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        targets.current.mouthOpen = 0;
        if (onSpeechEnd) onSpeechEnd();
      };

      utterance.onerror = (err) => {
        console.error("SpeechSynthesis error:", err);
        setIsSpeaking(false);
        targets.current.mouthOpen = 0;
        if (onSpeechEnd) onSpeechEnd();
      };

      synthRef.current?.speak(utterance);
    }, 150);

    return () => clearTimeout(timer);
  }, [speechText]);

  // Map Expression to Skeletal Targets
  useEffect(() => {
    const t = targets.current;
    
    // Reset defaults
    t.browY = 0;
    t.browTilt = 0;
    t.mouthSmile = 0.2;
    t.eyeGazeX = 0;
    t.eyeGazeY = 0;

    switch (expression) {
      case "smile":
        t.browY = -5;
        t.browTilt = 0.05;
        t.mouthSmile = 0.8;
        break;
      case "frown":
        t.browY = 6;
        t.browTilt = -0.15;
        t.mouthSmile = -0.6;
        break;
      case "thinking":
        t.browY = -3;
        t.browTilt = 0.1;
        t.mouthSmile = 0.1;
        t.eyeGazeX = -0.4;
        t.eyeGazeY = -0.4;
        break;
      case "celebration":
        t.browY = -8;
        t.browTilt = 0.15;
        t.mouthSmile = 1.0;
        break;
      case "approval":
        t.browY = -4;
        t.browTilt = 0.08;
        t.mouthSmile = 0.6;
        break;
      case "concern":
        t.browY = 4;
        t.browTilt = -0.1;
        t.mouthSmile = -0.3;
        break;
      case "neutral":
      default:
        t.browY = 0;
        t.browTilt = 0;
        t.mouthSmile = 0.2;
        break;
    }
  }, [expression]);

  // Map Gestures to Skeletal Targets
  useEffect(() => {
    const t = targets.current;
    
    if (gesture === "thumbsUp") {
      t.handY = 0; // Bring hand into view
    } else {
      t.handY = 200; // Hide hand
    }
  }, [gesture]);

  // Main Canvas Rendering and Lerp Loop
  useEffect(() => {
    let animId: number;
    let lastTime = 0;
    let blinkTimer = 0;
    let gestureTimer = 0;
    let idleTimer = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (timestamp: number) => {
      const dt = (timestamp - lastTime) / 1000 || 0.016;
      lastTime = timestamp;

      // Handle Blinking logic
      blinkTimer += dt;
      if (targets.current.eyeBlink > 0) {
        // Blinking phase
        targets.current.eyeBlink -= dt * 6;
        if (targets.current.eyeBlink < 0) targets.current.eyeBlink = 0;
      } else if (blinkTimer > 4) {
        // Trigger blink every 4-5 seconds
        targets.current.eyeBlink = 1.0;
        blinkTimer = Math.random() * 2; // Randomize next interval
      }

      // Handle Speaking mouth movement
      if (isSpeaking) {
        // Modulate open mouth based on sine wave with some noise
        targets.current.mouthOpen = 0.3 + Math.sin(timestamp * 0.015) * 0.4 + Math.random() * 0.2;
      } else {
        targets.current.mouthOpen = 0;
      }

      // Handle Gesture Animation Paths (Nod and Head Shake)
      gestureTimer += dt;
      if (gesture === "nod") {
        targets.current.headY = Math.sin(gestureTimer * 12) * 12;
        targets.current.headRot = 0;
        targets.current.headX = 0;
      } else if (gesture === "headShake") {
        targets.current.headX = Math.sin(gestureTimer * 12) * 15;
        targets.current.headRot = Math.sin(gestureTimer * 12) * 0.08;
        targets.current.headY = 0;
      } else if (gesture === "celebration") {
        targets.current.headY = Math.sin(gestureTimer * 15) * 8;
        targets.current.headX = Math.cos(gestureTimer * 8) * 10;
        targets.current.headRot = Math.sin(gestureTimer * 6) * 0.05;
      } else {
        // Reset gesture movements
        targets.current.headY = 0;
        targets.current.headX = 0;
        targets.current.headRot = 0;
      }

      // Idle Breathing & Micro-gaze adjustments
      idleTimer += dt;
      const breathing = Math.sin(idleTimer * 2.5) * 2.5; // slow breathing cycle
      
      // Lerp current values to targets
      const lerpSpeed = 10; // smooth factor
      const s = animStates.current;
      const tg = targets.current;

      s.headY += (tg.headY + breathing - s.headY) * dt * lerpSpeed;
      s.headX += (tg.headX - s.headX) * dt * lerpSpeed;
      s.headRot += (tg.headRot - s.headRot) * dt * lerpSpeed;
      s.eyeBlink += (tg.eyeBlink - s.eyeBlink) * dt * 15; // fast blink
      s.eyeGazeX += (tg.eyeGazeX - s.eyeGazeX) * dt * 5;
      s.eyeGazeY += (tg.eyeGazeY - s.eyeGazeY) * dt * 5;
      s.browY += (tg.browY - s.browY) * dt * lerpSpeed;
      s.browTilt += (tg.browTilt - s.browTilt) * dt * lerpSpeed;
      s.mouthOpen += (tg.mouthOpen - s.mouthOpen) * dt * 18; // fast mouth response
      s.mouthSmile += (tg.mouthSmile - s.mouthSmile) * dt * lerpSpeed;
      s.handY += (tg.handY - s.handY) * dt * 6; // slightly slower hand slide

      // RENDER SCENE
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Office Background
      // Soft modern gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, "#eceef2");
      bgGrad.addColorStop(1, "#d5dbe5");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Office whiteboard and elements in background (semi-transparent blur look)
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillRect(20, 40, 160, 110); // Whiteboard
      ctx.strokeStyle = "rgba(100, 110, 120, 0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 40, 160, 110);

      // whiteboard notes lines
      ctx.strokeStyle = "rgba(226, 35, 26, 0.3)"; // Lenovo Red soft
      ctx.beginPath();
      ctx.moveTo(35, 60); ctx.lineTo(100, 60);
      ctx.moveTo(35, 75); ctx.lineTo(130, 75);
      ctx.stroke();

      ctx.strokeStyle = "rgba(30, 40, 50, 0.2)";
      ctx.beginPath();
      ctx.moveTo(35, 95); ctx.lineTo(150, 95);
      ctx.moveTo(35, 110); ctx.lineTo(120, 110);
      ctx.stroke();

      // Office screen on right
      ctx.fillStyle = "rgba(40, 50, 65, 0.4)";
      ctx.fillRect(250, 60, 130, 110);
      ctx.fillStyle = "rgba(100, 110, 120, 0.4)";
      ctx.fillRect(300, 170, 30, 20); // stand
      ctx.fillRect(280, 190, 70, 5); // base

      // Code-like text on monitor
      ctx.fillStyle = "rgba(40, 255, 100, 0.2)";
      ctx.fillRect(260, 75, 80, 5);
      ctx.fillRect(260, 85, 100, 5);
      ctx.fillRect(260, 95, 60, 5);

      // 2. Draw Body & Lanyard
      ctx.save();
      // Body moves slightly with breathing and head rotation
      ctx.translate(canvas.width / 2 + s.headX * 0.15, canvas.height + 10 + s.headY * 0.1);

      // Shoulders
      ctx.fillStyle = "#1e3d2f"; // Dark green shirt/jacket (corporate)
      ctx.beginPath();
      ctx.moveTo(-120, -130);
      ctx.quadraticCurveTo(-110, -180, -50, -190);
      ctx.lineTo(50, -190);
      ctx.quadraticCurveTo(110, -180, 120, -130);
      ctx.lineTo(130, 0);
      ctx.lineTo(-130, 0);
      ctx.closePath();
      ctx.fill();

      // Inner T-Shirt (Green matching Alex's image)
      ctx.fillStyle = "#34664c"; // Medium green
      ctx.beginPath();
      ctx.moveTo(-45, -190);
      ctx.quadraticCurveTo(0, -140, 45, -190);
      ctx.closePath();
      ctx.fill();

      // Lanyard (Lenovo Red-Blue badge strap)
      ctx.strokeStyle = "#1b365d"; // Corporate navy blue lanyard
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-40, -180);
      ctx.quadraticCurveTo(0, -80, 40, -180);
      ctx.stroke();

      // Lanyard text stripes/markings
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(-35, -175);
      ctx.quadraticCurveTo(0, -85, 35, -175);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Lenovo ID Badge card
      ctx.fillStyle = "#e2231a"; // Lenovo Red badge holder
      ctx.fillRect(-18, -85, 36, 50);
      ctx.fillStyle = "#ffffff"; // Badge card
      ctx.fillRect(-15, -80, 30, 40);
      // Photo on card
      ctx.fillStyle = "#1e3d2f";
      ctx.fillRect(-10, -75, 10, 12);
      // Text on card
      ctx.fillStyle = "#333333";
      ctx.fillRect(3, -73, 8, 2);
      ctx.fillRect(3, -68, 8, 2);
      ctx.fillStyle = "#e2231a";
      ctx.font = "bold 5px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ELITE", 0, -45);

      ctx.restore();

      // 3. Draw Neck
      ctx.save();
      ctx.translate(canvas.width / 2 + s.headX * 0.5, canvas.height / 2 + 105 + s.headY * 0.7);
      ctx.rotate(s.headRot * 0.5);
      ctx.fillStyle = "#d0a080"; // Skin tone shadow
      ctx.fillRect(-22, -45, 44, 45);
      ctx.restore();

      // 4. Draw Head (Face, Beard, Eyes, Glasses, Hair)
      ctx.save();
      // Apply translations for breathing, nod, shake
      ctx.translate(canvas.width / 2 + s.headX, canvas.height / 2 + 35 + s.headY);
      ctx.rotate(s.headRot);

      // Face base
      ctx.fillStyle = "#e5b38f"; // Skin tone Indian brown
      ctx.beginPath();
      ctx.arc(0, -5, 62, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks (blush when smiling/celebrating)
      if (expression === "smile" || expression === "celebration") {
        ctx.fillStyle = "rgba(226, 35, 26, 0.15)";
        ctx.beginPath();
        ctx.arc(-40, 10, 12, 0, Math.PI * 2);
        ctx.arc(40, 10, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ears
      ctx.fillStyle = "#d0a080";
      ctx.beginPath();
      ctx.arc(-62, -5, 12, 0, Math.PI * 2); // Left ear
      ctx.arc(62, -5, 12, 0, Math.PI * 2);  // Right ear
      ctx.fill();

      // Groomed Beard & Sideburns (from Alex's visual profile)
      ctx.fillStyle = "#191919"; // Very dark charcoal/black
      // Main jaw beard
      ctx.beginPath();
      ctx.arc(0, 10, 63, 0, Math.PI); // Half-circle below face
      ctx.fill();
      
      // Beard cheek line details
      ctx.beginPath();
      ctx.moveTo(-62, -15);
      ctx.quadraticCurveTo(-55, 15, -15, 35);
      ctx.lineTo(15, 35);
      ctx.quadraticCurveTo(55, 15, 62, -15);
      ctx.lineTo(62, 35);
      ctx.quadraticCurveTo(0, 78, -62, 35);
      ctx.closePath();
      ctx.fill();

      // Eyes & Pupils
      const eyeSpacing = 24;
      const eyeY = -15;

      // Draw Eyes (Left & Right)
      [-1, 1].forEach((dir) => {
        const xPos = dir * eyeSpacing;
        
        ctx.save();
        ctx.translate(xPos, eyeY);

        if (s.eyeBlink > 0.8) {
          // Closed eye
          ctx.strokeStyle = "#191919";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.quadraticCurveTo(0, 4, 10, 0);
          ctx.stroke();
        } else {
          // White of the eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.ellipse(0, 0, 12, 8 * (1 - s.eyeBlink), 0, 0, Math.PI * 2);
          ctx.fill();

          // Pupil (brown)
          ctx.fillStyle = "#5c3317"; // Brown eyes
          ctx.beginPath();
          const pRadius = 5 * (1 - s.eyeBlink);
          ctx.arc(s.eyeGazeX * 4, s.eyeGazeY * 3, pRadius > 0 ? pRadius : 0, 0, Math.PI * 2);
          ctx.fill();

          // Gaze reflect/gleam
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(s.eyeGazeX * 4 - 2, s.eyeGazeY * 3 - 2, 1.8 * (1 - s.eyeBlink), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Eyebrows (animated tilt and vertical offset)
      ctx.strokeStyle = "#191919";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      [-1, 1].forEach((dir) => {
        const xPos = dir * eyeSpacing;
        ctx.save();
        ctx.translate(xPos, eyeY - 14 + s.browY);
        // Tilt eyebrows based on direction and state
        ctx.rotate(dir * s.browTilt);
        
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.quadraticCurveTo(0, -3, 12, 0);
        ctx.stroke();
        ctx.restore();
      });

      // Mustache (above mouth, below nose)
      ctx.fillStyle = "#191919";
      ctx.beginPath();
      ctx.moveTo(-35, 10);
      ctx.quadraticCurveTo(-15, 2, 0, 8);
      ctx.quadraticCurveTo(15, 2, 35, 10);
      ctx.quadraticCurveTo(20, 18, 0, 12);
      ctx.quadraticCurveTo(-20, 18, -35, 10);
      ctx.closePath();
      ctx.fill();

      // Nose
      ctx.strokeStyle = "#c68c63"; // skin shadow
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-3, -15);
      ctx.lineTo(0, 1);
      ctx.quadraticCurveTo(4, 3, 6, 1);
      ctx.stroke();

      // Mouth
      ctx.save();
      ctx.translate(0, 22);

      const smileMod = s.mouthSmile; // -1 to 1
      const openMod = s.mouthOpen;   // 0 to 1

      if (openMod > 0.1) {
        // Speaking/Open mouth
        ctx.fillStyle = "#5c0e0e"; // Dark inside mouth
        ctx.strokeStyle = "#191919";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 5 + openMod * 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // White teeth strip
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-10, -3 - openMod * 2, 20, 3);
      } else {
        // Static/Closed mouth based on expression (smile/frown)
        ctx.strokeStyle = "#191919";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        ctx.beginPath();
        if (smileMod > 0) {
          // Smile curve
          ctx.moveTo(-18, -2);
          ctx.quadraticCurveTo(0, smileMod * 12, 18, -2);
        } else {
          // Frown curve
          ctx.moveTo(-18, 4);
          ctx.quadraticCurveTo(0, smileMod * 8, 18, 4);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Glasses (Alex's key characteristic - bold black frames)
      ctx.strokeStyle = "#191919";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";

      [-1, 1].forEach((dir) => {
        const xPos = dir * eyeSpacing;
        ctx.save();
        ctx.translate(xPos, eyeY);

        // Frame glass container rectangle
        ctx.fillStyle = "rgba(220, 240, 255, 0.15)"; // subtle reflection
        ctx.beginPath();
        ctx.roundRect(-20, -13, 40, 26, 6);
        ctx.fill();
        ctx.stroke();

        // Lens glare detail
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, -10);
        ctx.lineTo(-8, 8);
        ctx.stroke();

        ctx.restore();
      });

      // Glasses Bridge connection
      ctx.strokeStyle = "#191919";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-5, eyeY);
      ctx.lineTo(5, eyeY);
      ctx.stroke();

      // Glasses Temples (connecting frames to ears)
      ctx.beginPath();
      ctx.moveTo(-44, eyeY - 2);
      ctx.lineTo(-60, eyeY - 8);
      ctx.moveTo(44, eyeY - 2);
      ctx.lineTo(60, eyeY - 8);
      ctx.stroke();

      // Hair (Black, stylized corporate coif from Alex's picture)
      ctx.fillStyle = "#191919";
      ctx.beginPath();
      // Main hair mass
      ctx.arc(0, -42, 62, Math.PI, 0); // Upper half
      ctx.fill();

      // Hair spikes & coif styling (matching the image)
      ctx.beginPath();
      ctx.moveTo(-62, -42);
      ctx.quadraticCurveTo(-45, -78, -15, -82); // main sweep up
      ctx.quadraticCurveTo(20, -85, 45, -70);
      ctx.quadraticCurveTo(62, -55, 62, -42);
      ctx.lineTo(45, -55);
      ctx.quadraticCurveTo(15, -70, -15, -60);
      ctx.quadraticCurveTo(-40, -50, -62, -42);
      ctx.closePath();
      ctx.fill();

      ctx.restore(); // Restore Head transform

      // 5. Thumbs Up Hand Slide-in (animated based on s.handY)
      if (s.handY < 180) {
        ctx.save();
        // Hand slides up from bottom-right
        ctx.translate(canvas.width - 90, canvas.height - 110 + s.handY);

        // Arm/Sleeve (matching dark green jacket)
        ctx.fillStyle = "#1e3d2f";
        ctx.beginPath();
        ctx.moveTo(40, 150);
        ctx.lineTo(-10, 50);
        ctx.lineTo(30, 20);
        ctx.lineTo(80, 110);
        ctx.closePath();
        ctx.fill();

        // White cuff
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-10, 25, 42, 10);

        // Hand (Skin tone)
        ctx.fillStyle = "#e5b38f";
        ctx.beginPath();
        ctx.arc(10, 10, 22, 0, Math.PI * 2); // palm
        ctx.fill();

        // Thumb (pointing UP!)
        ctx.beginPath();
        ctx.roundRect(-8, -25, 14, 25, 6);
        ctx.fill();
        // Thumb nail
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(-5, -21, 8, 8);

        // Folded fingers
        ctx.fillStyle = "#d0a080"; // shading skin tone
        ctx.beginPath();
        ctx.roundRect(10, -10, 20, 10, 4);
        ctx.roundRect(10, 0, 18, 10, 4);
        ctx.roundRect(10, 10, 16, 10, 4);
        ctx.roundRect(10, 20, 14, 10, 4);
        ctx.fill();

        ctx.restore();
      }

      // 6. "Listening" pulsing animation visual overlay
      if (gesture === "listening" && !isSpeaking) {
        ctx.strokeStyle = "rgba(226, 35, 26, 0.4)"; // Lenovo Red pulse
        ctx.lineWidth = 3;
        const waveScale = 1 + Math.sin(timestamp * 0.008) * 0.15;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + s.headX, canvas.height / 2 + 35 + s.headY, 78 * waveScale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(226, 35, 26, 0.1)";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ALEX: LISTENING", canvas.width / 2, canvas.height - 20);
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSpeaking, gesture]);

  return (
    <div className="relative w-full flex flex-col items-center bg-white p-3 rounded-xl border-2 border-gray-200 shadow-xs">
      <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-red"></span>
        </span>
        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-dark-charcoal bg-white/90 px-2.5 py-1 rounded-sm border border-gray-200 shadow-xs">
          VIRTUAL PROCTOR
        </span>
      </div>
      
      <canvas
        ref={canvasRef}
        width={420}
        height={380}
        className="w-full h-auto max-w-md rounded-lg overflow-hidden border-2 border-gray-200 shadow-xs bg-slate-100"
      />
      
      <div className="w-full max-w-md mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-red text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5 border-2 border-white shadow-xs">
            A
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ALEX INTERACTION:</div>
            <p className="text-xs font-bold text-dark-charcoal italic leading-relaxed mt-1 whitespace-pre-line">
              {speechText || "Connecting assessment feeds..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
