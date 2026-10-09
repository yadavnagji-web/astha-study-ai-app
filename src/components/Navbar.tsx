import React from 'react';
import { ClassLevel } from '../types';
import { BookOpen, Sparkles } from 'lucide-react';

interface Props {
  currentClass: ClassLevel;
  onNavigate: (view: 'home' | 'chapters' | 'workspace' | 'admin') => void;
}

export const Navbar: React.FC<Props> = ({ currentClass, onNavigate }) => {
  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden bg-white/95 backdrop-blur-md border-b border-indigo-100 shadow-xs px-3.5 sm:px-6 py-2.5 sm:py-3">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
        >
          <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl overflow-hidden shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform shrink-0 border border-indigo-200">
            <img
              src="/icon.svg"
              alt="Astha Study AI App Icon"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-600 bg-clip-text text-transparent truncate">
                ASTHA STUDY AI
              </span>
              <span className="rounded-md bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] sm:text-xs font-extrabold text-amber-900 tracking-wide shrink-0">
                {currentClass}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight truncate">
              Smart Chapter Study Companion
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
