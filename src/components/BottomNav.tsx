import React, { useState } from 'react';
import { Home, BookOpen, HelpCircle, Award, Settings, Smartphone, Download, Check, Copy, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  currentView: 'home' | 'chapters' | 'workspace' | 'admin';
  activeWorkspaceTab?: string;
  onNavigate: (view: 'home' | 'chapters' | 'workspace' | 'admin', tab?: string) => void;
  isHindi?: boolean;
}

export const BottomNav: React.FC<Props> = ({
  currentView,
  activeWorkspaceTab,
  onNavigate,
  isHindi = true,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) setShowInstallGuide(true);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('https://astha-study-ai.vercel.app');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-lg px-1.5 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-6 items-center">
          {/* 1: Home */}
          <button
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              currentView === 'home'
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] leading-tight truncate">{isHindi ? 'होम' : 'Home'}</span>
          </button>

          {/* 2: Chapters */}
          <button
            onClick={() => onNavigate('chapters')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              currentView === 'chapters'
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] leading-tight truncate">{isHindi ? 'अध्याय' : 'Chapters'}</span>
          </button>

          {/* 3: Questions */}
          <button
            onClick={() => onNavigate('workspace', 'questions')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              currentView === 'workspace' && activeWorkspaceTab === 'questions'
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] leading-tight truncate">{isHindi ? 'प्रश्न' : 'Questions'}</span>
          </button>

          {/* 4: Quiz */}
          <button
            onClick={() => onNavigate('workspace', 'quiz')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              currentView === 'workspace' && (activeWorkspaceTab === 'quiz' || activeWorkspaceTab === 'result')
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Award className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] leading-tight truncate">{isHindi ? 'क्विज़' : 'Quiz'}</span>
          </button>

          {/* 5: 📲 Install Button (Permanently on mobile screen, never out of screen) */}
          <button
            onClick={handleInstallClick}
            className="flex flex-col items-center justify-center py-1 transition text-amber-600 hover:text-amber-700 group"
            title={isHindi ? 'ऐप इंस्टॉल करें' : 'Install App'}
          >
            <div className="relative">
              <Smartphone className="w-4 h-4 mb-0.5 text-amber-600 group-hover:scale-110 transition-transform" />
              {!isInstalled && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold text-amber-700 leading-tight truncate">
              {isHindi ? 'इंस्टॉल' : 'Install'}
            </span>
          </button>

          {/* 6: Admin */}
          <button
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              currentView === 'admin'
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] leading-tight truncate">{isHindi ? 'एडमिन' : 'Admin'}</span>
          </button>
        </div>
      </div>

      {/* Install Guide Modal when clicked from BottomNav */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                    {isHindi ? '📱 मोबाइल में ऐप इंस्टॉल करें' : 'Install App on Phone'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isHindi ? 'ऑफ़लाइन एक्सेस और तेज़ अनुभव' : 'Offline access & native speed'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                  setShowInstallGuide(false);
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-white text-xs sm:text-sm font-extrabold shadow-md hover:from-amber-600 hover:to-orange-600 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isHindi ? '🚀 तुरंत 1-क्लिक में इंस्टॉल करें' : 'Direct 1-Click Install'}</span>
              </button>
            )}

            <div className="space-y-3 text-xs text-slate-600">
              <div className="rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200/80 space-y-2">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>🤖 Android / Chrome फ़ोन:</span>
                </p>
                <div className="space-y-1 pl-1 text-[11px] leading-relaxed text-slate-700">
                  <p>1. Chrome ब्राउज़र में ऊपर <strong>तीन डॉट्स (⋮)</strong> पर टैप करें।</p>
                  <p>2. <strong>'Install app'</strong> या <strong>'Add to Home screen'</strong> चुनें।</p>
                </div>
              </div>

              <div className="rounded-2xl bg-indigo-50/70 p-3.5 border border-indigo-200/80 space-y-2">
                <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <span>🍏 iPhone / iPad (Safari):</span>
                </p>
                <div className="space-y-1 pl-1 text-[11px] leading-relaxed text-slate-700">
                  <p>1. Safari में <strong>Share (⎋)</strong> बटन दबाएं।</p>
                  <p>2. नीचे स्क्रॉल करके <strong>'Add to Home Screen'</strong> चुनें।</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value="https://astha-study-ai.vercel.app"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-mono text-slate-700 truncate"
              />
              <button
                onClick={handleCopy}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'कॉपी हुआ' : 'Copy'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              {isHindi ? 'समझ गया (Close)' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
