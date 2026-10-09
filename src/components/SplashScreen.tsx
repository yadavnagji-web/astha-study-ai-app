import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  onFinish: () => void;
  isHindi?: boolean;
}

const LOADING_STEPS = [
  { hi: 'स्टडी इंजन प्रारंभ हो रहा है...', en: 'Initializing Study Engine...' },
  { hi: 'कक्षा 6-10 NCERT अध्याय लोड हो रहे हैं...', en: 'Loading Class 6-10 NCERT Chapters...' },
  { hi: 'AI नोट्स एवं क्विज मॉड्यूल सक्रिय...', en: 'Activating AI Notes & Quiz Modules...' },
  { hi: 'तैयार है! शुरू हो रहा है...', en: 'Ready! Launching...' },
];

export const SplashScreen: React.FC<Props> = ({ onFinish, isHindi = true }) => {
  const [progress, setProgress] = useState(20);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(50);
      setStepIndex(1);
    }, 350);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setStepIndex(2);
    }, 750);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStepIndex(3);
    }, 1100);

    const timer4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1400);

    const timer5 = setTimeout(() => {
      onFinishRef.current();
    }, 1700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []); // Run strictly once on mount, immune to parent re-renders

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-white px-6 transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/4 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 w-60 h-60 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* App Icon Image Card */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-400 via-indigo-500 to-blue-500 opacity-60 blur-lg group-hover:opacity-100 transition duration-500 animate-pulse" />
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/60 border-2 border-white/20 bg-indigo-950 flex items-center justify-center p-1">
            <img
              src="/icon.svg"
              alt="Astha Study AI App Logo"
              className="w-full h-full object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Sparkle badge */}
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 p-1.5 rounded-full shadow-lg border border-white/40">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Brand Headings */}
        <div className="space-y-1 mb-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-blue-200 bg-clip-text text-transparent">
            आस्था STUDY AI
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-amber-300 tracking-wider">
            ASTHA STUDY AI COMPANION
          </p>
        </div>

        <p className="text-xs text-slate-300 mb-8 max-w-xs">
          {isHindi
            ? 'कक्षा 6-10 स्मार्ट अध्याय अध्ययन • नोट्स • प्रश्नोत्तरी'
            : 'Class 6-10 Smart Chapter Learning • Notes • Quizzes'}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full space-y-2.5">
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden backdrop-blur-xs p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-indigo-400 to-blue-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="truncate pr-2">
              {isHindi ? LOADING_STEPS[stepIndex].hi : LOADING_STEPS[stepIndex].en}
            </span>
            <span className="font-mono font-bold text-amber-300 shrink-0">
              {progress}%
            </span>
          </div>
        </div>

        {/* Quick Skip Button */}
        <button
          onClick={onFinish}
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <span>{isHindi ? 'सीधे ऐप खोलें' : 'Skip to App'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
