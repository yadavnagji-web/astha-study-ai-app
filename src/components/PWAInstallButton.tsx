import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Check, Copy, X } from 'lucide-react';

interface Props {
  className?: string;
  isHindi?: boolean;
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', isHindi = true }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // If already running inside standalone PWA mode, don't show install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('https://astha-study-ai.vercel.app');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 px-2.5 sm:px-3 py-1.5 text-xs font-extrabold text-white shadow-sm shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all cursor-pointer shrink-0 ${className}`}
        title={isHindi ? 'फ़ोन में ऐप इंस्टॉल करें (PWA Install)' : 'Install app on device'}
      >
        <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
        <span className="whitespace-nowrap">{isHindi ? '📲 इंस्टॉल' : '📲 Install'}</span>
      </button>

      {/* Install Guide Modal (Shown when clicked or when browser requires manual Add to Home Screen) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                    {isHindi ? '📱 फ़ोन में इंस्टॉल करें' : 'Install App on Phone'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isHindi ? 'बिना इंटरनेट/ऑफ़लाइन भी चलेगा' : 'Works offline & opens like native app'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                  setShowGuide(false);
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-white text-xs sm:text-sm font-extrabold shadow-md hover:from-amber-600 hover:to-orange-600 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isHindi ? '🚀 तुरंत 1-क्लिक में इंस्टॉल करें' : 'Direct 1-Click Install'}</span>
              </button>
            )}

            <div className="space-y-3 text-xs text-slate-600">
              {/* Android Guide */}
              <div className="rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200/80 space-y-2">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>🤖 Android / Chrome फ़ोन:</span>
                </p>
                <div className="space-y-1.5 pl-1 text-[11px] leading-relaxed text-slate-700">
                  <p>1. Chrome ब्राउज़र में ऊपर दाईं ओर <strong>तीन डॉट्स (⋮)</strong> मेनू पर टैप करें।</p>
                  <p>2. मेनू में <strong>'Install app'</strong> या <strong>'Add to Home screen' (होम स्क्रीन में जोड़ें)</strong> चुनें।</p>
                  <p>3. ऐप आपके मोबाइल की होम स्क्रीन पर ऐप आइकन की तरह जुड़ जाएगा।</p>
                </div>
              </div>

              {/* iOS Guide */}
              <div className="rounded-2xl bg-indigo-50/70 p-3.5 border border-indigo-200/80 space-y-2">
                <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <span>🍏 iPhone / iPad (Safari):</span>
                </p>
                <div className="space-y-1.5 pl-1 text-[11px] leading-relaxed text-slate-700">
                  <p>1. Safari में नीचे <strong>Share (साझा करें ⎋)</strong> बटन दबाएं।</p>
                  <p>2. नीचे स्क्रॉल करके <strong>'Add to Home Screen'</strong> पर टैप करें।</p>
                </div>
              </div>
            </div>

            {/* Direct App Link */}
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
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              {isHindi ? 'बंद करें (Close)' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
