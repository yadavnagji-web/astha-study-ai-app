import React from 'react';
import { ClassLevel } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { Shield, Globe, GraduationCap, Share2, Home, BookOpen } from 'lucide-react';

interface Props {
  currentClass: ClassLevel;
  onClassChange: (c: ClassLevel) => void;
  language: 'Hindi' | 'English';
  onLanguageToggle: () => void;
  onNavigate: (view: 'home' | 'chapters' | 'workspace' | 'admin') => void;
  currentView: string;
  onOpenShare: () => void;
}

export const ActionToolbar: React.FC<Props> = ({
  currentClass,
  onClassChange,
  language,
  onLanguageToggle,
  onNavigate,
  currentView,
  onOpenShare,
}) => {
  const isHindi = language === 'Hindi';
  const classOptions: { id: ClassLevel; label: string }[] = [
    { id: 'Class 6', label: 'Class 6 (Primary)' },
    { id: 'Class 7', label: 'Class 7 (Middle)' },
    { id: 'Class 8', label: 'Class 8 (Middle)' },
    { id: 'Class 9', label: 'Class 9 (Secondary)' },
    { id: 'Class 10', label: 'Class 10 (Secondary)' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mb-3 sm:mb-4 bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-xs min-w-0">
      {/* 100% Mobile Responsive Toolbar - Fully visible on any screen width without horizontal overflow */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* Navigation & Selectors Row */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Nav links */}
          <button
            onClick={() => onNavigate('home')}
            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              currentView === 'home'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isHindi ? 'होम' : 'Home'}</span>
          </button>

          <button
            onClick={() => onNavigate('chapters')}
            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              currentView === 'chapters'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isHindi ? 'अध्याय' : 'Chapters'}</span>
          </button>

          {/* Class Selector Dropdown */}
          <div className="relative flex items-center shrink-0">
            <GraduationCap className="absolute left-2 w-3.5 h-3.5 text-indigo-600 pointer-events-none" />
            <select
              value={currentClass}
              onChange={(e) => onClassChange(e.target.value as ClassLevel)}
              className="appearance-none rounded-xl border border-indigo-200 bg-indigo-50/40 pl-6.5 pr-3 py-1.5 text-xs font-bold text-indigo-900 shadow-2xs hover:bg-indigo-50 transition cursor-pointer"
              title={isHindi ? 'कक्षा चुनें' : 'Select Class'}
            >
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Master Language Toggle */}
          <button
            onClick={onLanguageToggle}
            className="flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-indigo-900 hover:bg-indigo-50 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            title={isHindi ? 'मास्टर भाषा' : 'Master Language'}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isHindi ? '🇮🇳 हिन्दी' : '🇬🇧 EN'}</span>
          </button>
        </div>

        {/* Action Controls Row (Share, Install Button, Admin) - Always on screen, wraps cleanly */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Share Button (with Vercel Deploy Link) */}
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 sm:px-3 py-1.5 text-xs font-extrabold shadow-sm hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition cursor-pointer shrink-0"
            title={isHindi ? 'Vercel शेयर एवं डिप्लॉय लिंक' : 'Share & Vercel Deploy'}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isHindi ? '🔗 शेयर (Vercel)' : '🔗 Share'}</span>
          </button>

          {/* 📲 PWA Install Button (Always visible on mobile & desktop, never out of screen) */}
          <PWAInstallButton isHindi={isHindi} />

          {/* Admin Panel Button */}
          <button
            onClick={() => onNavigate('admin')}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
              currentView === 'admin'
                ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 shadow-2xs'
            }`}
            title={isHindi ? 'व्यवस्थापक पैनल (10+ AI कंपनियां)' : 'Admin Panel (10+ AI Providers)'}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isHindi ? '⚙️ एडमिन' : '⚙️ Admin'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
