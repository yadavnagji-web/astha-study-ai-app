import React, { useState } from 'react';
import { Copy, Check, ExternalLink, X, Rocket, Globe } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isHindi?: boolean;
}

export const ShareModal: React.FC<Props> = ({ isOpen, onClose, isHindi = true }) => {
  const [copiedDeploy, setCopiedDeploy] = useState(false);
  const [copiedApp, setCopiedApp] = useState(false);

  if (!isOpen) return null;

  const vercelDeployUrl =
    'https://vercel.com/new/clone?repository-url=https://github.com/yadavnagji/astha-study-ai&project-name=astha-study-ai';
  const vercelAppUrl = 'https://astha-study-ai.vercel.app';

  const handleCopyDeploy = () => {
    navigator.clipboard.writeText(vercelDeployUrl);
    setCopiedDeploy(true);
    setTimeout(() => setCopiedDeploy(false), 2500);
  };

  const handleCopyApp = () => {
    navigator.clipboard.writeText(vercelAppUrl);
    setCopiedApp(true);
    setTimeout(() => setCopiedApp(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 sm:p-6 overflow-y-auto w-full max-w-full">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-4 max-h-[92vh] overflow-y-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white shadow-sm shrink-0">
              <Rocket className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base truncate">
                ▲ Vercel Links
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {isHindi ? 'Vercel 1-Click Deploy एवं लाइव ऐप लिंक' : 'Vercel Deploy & Live App Link'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: Vercel 1-Click Deploy Link */}
        <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>▲ Vercel 1-Click Deploy Link</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                Vercel पर अपनी निजी कॉपी 1 क्लिक में होस्ट करें
              </p>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              1-Click Clone
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={vercelDeployUrl}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono text-slate-800 select-all min-w-0"
            />
            <button
              onClick={handleCopyDeploy}
              className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-black transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              {copiedDeploy ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDeploy ? 'कॉपी हो गया' : 'Copy'}</span>
            </button>
          </div>

          <a
            href={vercelDeployUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 px-4 text-xs sm:text-sm font-extrabold text-white hover:bg-slate-800 active:scale-98 transition shadow-md"
          >
            <Rocket className="w-4 h-4 text-amber-300" />
            <span>🚀 Deploy with Vercel</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        {/* SECTION 2: VERCEL KA LINK (Live App) */}
        <div className="space-y-2.5 rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>VERCEL KA LINK</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-indigo-700 font-medium">
                {isHindi ? 'लाइव Vercel एप्लिकेशन लिंक' : 'Live Vercel Application URL'}
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Vercel
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={vercelAppUrl}
              className="flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-mono font-bold text-indigo-900 select-all min-w-0"
            />
            <button
              onClick={handleCopyApp}
              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              {copiedApp ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedApp ? 'कॉपी हो गया' : 'Copy'}</span>
            </button>
          </div>

          <a
            href={vercelAppUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 px-4 text-xs sm:text-sm font-extrabold text-white hover:from-indigo-700 hover:to-blue-700 active:scale-98 transition shadow-md"
          >
            <Globe className="w-4 h-4" />
            <span>🌐 Vercel ऐप खोलें (Open App)</span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
          </a>
        </div>
      </div>
    </div>
  );
};
