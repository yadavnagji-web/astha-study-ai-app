import React from 'react';
import { Chapter, ClassLevel } from '../types';
import {
  UploadCloud,
  BookOpen,
  HelpCircle,
  Award,
  BarChart3,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface Props {
  onOpenUpload: () => void;
  onOpenChapters: () => void;
  onSelectChapter: (chapter: Chapter, initialTab?: string) => void;
  onOpenResults: () => void;
  chapters: Chapter[];
  currentClass: ClassLevel;
  isHindi?: boolean;
  onOpenShare?: () => void;
}

export const HomeView: React.FC<Props> = ({
  onOpenUpload,
  onOpenChapters,
  onSelectChapter,
  onOpenResults,
  chapters,
  currentClass,
  isHindi = true,
  onOpenShare,
}) => {
  const activeChapter = chapters[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 md:pb-12 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-6 sm:p-10 text-white shadow-xl shadow-indigo-500/20">
        {/* Decorative background shapes */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-amber-200 mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {isHindi ? `NCERT ${currentClass} विशेष अध्ययन साथी` : `NCERT ${currentClass} Smart Companion`}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            📚 ASTHA STUDY AI
          </h1>
          <p className="text-base sm:text-xl font-semibold text-indigo-100 mb-6">
            {isHindi
              ? 'अपना Chapter Upload करें और पढ़ाई आसान बनाएं'
              : 'Upload your chapter and make learning easy & enjoyable'}
          </p>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-base font-extrabold text-slate-900 shadow-lg shadow-amber-400/30 hover:from-amber-300 hover:to-amber-200 active:scale-95 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
              <span>{isHindi ? '⚡ अध्याय अपलोड करें (स्वतः तैयार करें)' : '⚡ Upload & Auto-Process'}</span>
            </button>

            <button
              onClick={onOpenChapters}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur-md px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-base font-bold text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-100" />
              <span>{isHindi ? '📖 मेरे अध्याय (' + chapters.length + ')' : '📖 My Chapters (' + chapters.length + ')'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Strict SOURCE LOCK Guarantee Banner */}
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950">
                {isHindi ? '🔒 सख्त "सोर्स लॉक" (Source Lock) सुरक्षा' : '🔒 Strict "Source Lock" System'}
              </h2>
              <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 uppercase">
                100% NCERT Pure
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-emerald-800 leading-relaxed">
              {isHindi
                ? 'AI केवल आपके अपलोड किए गए अध्याय के पृष्ठों से ही प्रश्न, सारांश और उत्तर तैयार करता है। बाहर से कोई अप्रासंगिक तथ्य या गलत जानकारी नहीं जोड़ी जाती।'
                : 'AI uses ONLY your uploaded chapter content. No outside or unverified information will ever be generated.'}
            </p>
          </div>
        </div>
      </div>

      {/* 9-Module Study Suite Line (100% Mobile Responsive - No Horizontal Scrollbar) */}
      <div className="rounded-3xl border border-indigo-200 bg-white p-4 sm:p-6 shadow-sm space-y-3.5 w-full max-w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-800">
              {isHindi ? '📖 स्मार्ट अध्याय अध्ययन सूट (9-Module Study Suite):' : '📖 9-Module Smart Chapter Study Suite:'}
            </h2>
          </div>
          <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            {activeChapter ? activeChapter.title : `${currentClass} Study`}
          </span>
        </div>

        {/* 100% Mobile Responsive Wrap Grid with Complete User-Specified Labels */}
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:flex xl:flex-wrap gap-2">
          {[
            { id: 'original', icon: '📖', label: '📖 Original (मूल पाठ)' },
            { id: 'hindi', icon: '🇮🇳', label: '🇮🇳 Hindi (हिंदी)' },
            { id: 'english', icon: '🇬🇧', label: '🇬🇧 English (अंग्रेजी)' },
            { id: 'short_notes', icon: '✂️', label: '✂️ Short Notes (संक्षिप्त)' },
            { id: 'questions', icon: '📝', label: '📝 Questions (प्रश्न)' },
            { id: 'exam_paper', icon: '📑', label: '📑 1-Page प्रश्न पत्र (PDF)' },
            { id: 'answers', icon: '✅', label: '✅ Answers (उत्तर कुंजी)' },
            { id: 'quiz', icon: '🎯', label: '🎯 Quiz (क्विज़)' },
            { id: 'result', icon: '📊', label: '📊 Result (परिणाम)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (activeChapter) {
                  onSelectChapter(activeChapter, tab.id);
                } else if (chapters.length > 0) {
                  onSelectChapter(chapters[0], tab.id);
                } else {
                  onOpenUpload();
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3 text-xs sm:text-xs md:text-sm font-bold text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-95 text-left flex items-center gap-1.5 shadow-2xs cursor-pointer min-w-0"
              title={tab.label}
            >
              <span className="text-base shrink-0">{tab.icon}</span>
              <span className="truncate font-extrabold">{tab.label.replace(/^[^\s]+\s*/, '')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5 Core Feature Cards */}
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <span>{isHindi ? 'मुख्य सुविधाएं (Quick Access)' : 'Core Learning Features'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Upload Chapter */}
          <div
            onClick={onOpenUpload}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                PDF / Image
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              {isHindi ? '📤 अध्याय अपलोड करें' : '📤 Upload Chapter'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHindi
                ? 'PDF, PNG, JPG अपलोड करें। स्वतः टेक्स्ट एक्सट्रैक्शन और उच्च गुणवत्ता OCR।'
                : 'Upload PDF or images with automatic selectable text detection & OCR.'}
            </p>
          </div>

          {/* Card 2: My Chapters */}
          <div
            onClick={onOpenChapters}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                {chapters.length} {isHindi ? 'उपलब्ध' : 'Saved'}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              {isHindi ? '📖 मेरे अध्याय (Library)' : '📖 My Chapters'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHindi
                ? 'मूल पाठ, हिंदी व अंग्रेजी अनुवाद और संक्षिप्त क्लास 6 नोट्स पढ़ें।'
                : 'Read original text, translations, and simplified Class 6 notes.'}
            </p>
          </div>

          {/* Card 3: Generate Questions */}
          <div
            onClick={() => {
              if (activeChapter) onSelectChapter(activeChapter, 'questions');
              else onOpenUpload();
            }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <HelpCircle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                6 {isHindi ? 'प्रकार' : 'Types'}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              {isHindi ? '📝 प्रश्न बनाएं (Question Bank)' : '📝 Generate Questions'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHindi
                ? 'MCQ, सही/गलत, खाली स्थान, एक शब्द, लघु व दीर्घ उत्तरीय प्रश्न।'
                : 'Generate MCQs, True/False, Blanks, One word, and Short/Long answers.'}
            </p>
          </div>

          {/* Card 4: Take Quiz */}
          <div
            onClick={() => {
              if (activeChapter) onSelectChapter(activeChapter, 'quiz');
              else onOpenUpload();
            }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                {isHindi ? 'इंटरैक्टिव' : 'Interactive'}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              {isHindi ? '🎯 प्रश्नोत्तरी शुरू करें (Quiz)' : '🎯 Take Quiz'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHindi
                ? 'एक-एक प्रश्न हल करें, तुरंत स्कोर और अपनी गलतियों की समीक्षा करें।'
                : '1-by-1 student quiz mode with instant score and wrong answer review.'}
            </p>
          </div>

          {/* Card 5: My Results */}
          <div
            onClick={onOpenResults}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-rose-300 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">
                {isHindi ? 'प्रगति' : 'Progress'}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              {isHindi ? '📊 मेरे परिणाम (My Results)' : '📊 My Results'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHindi
                ? 'अंक प्रतिशत, समय, सही व गलत उत्तरों का विस्तृत विश्लेषण।'
                : 'Track quiz scores, percentage, accuracy, and study badges.'}
            </p>
          </div>
        </div>
      </div>

      {/* 1-Click Sample NCERT Chapters for Instant Evaluation */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>{isHindi ? 'तुरंत टेस्ट करें (NCERT कक्षा 6 पाठ)' : 'Try Immediately (NCERT Class 6)'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'अपलोड किए बिना तुरंत अभ्यास के लिए तैयार अध्याय:'
                : 'Ready-to-use textbook chapters for immediate testing:'}
            </p>
          </div>
          <button
            onClick={onOpenChapters}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{isHindi ? 'सभी देखें' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {chapters.slice(0, 2).map((ch) => (
            <div
              key={ch.id}
              onClick={() => onSelectChapter(ch)}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-slate-50/80 p-4 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm">
                  {ch.subject === 'Science' ? '🔬' : '📜'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition">
                    {ch.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-slate-500">{ch.subject}</span>
                    <span className="text-[11px] text-slate-300">•</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {ch.questions?.length || 0} {isHindi ? 'प्रश्न तैयार' : 'Questions'}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
