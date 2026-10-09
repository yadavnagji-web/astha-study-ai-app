import React from 'react';
import { QuizResult } from '../types';
import { BarChart3, X, Award, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  results: QuizResult[];
  isHindi?: boolean;
}

export const ResultsHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  results,
  isHindi = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                {isHindi ? '📊 मेरे प्रश्नोत्तरी परिणाम (Quiz Results)' : '📊 My Quiz Results'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHindi ? 'आपके द्वारा हल की गई क्विज़ का इतिहास' : 'History of all your quiz attempts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {results.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">
                {isHindi ? 'अभी तक कोई क्विज़ नहीं दिया गया है।' : 'No quiz results recorded yet.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHindi ? 'अध्याय खोलें और क्विज़ शुरू करें!' : 'Open a chapter and take a quiz!'}
              </p>
            </div>
          ) : (
            results.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-2.5 hover:border-indigo-200 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{r.chapterTitle}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.timestamp).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.timeTakenSeconds}s
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-lg font-extrabold font-mono ${
                        r.scorePercentage >= 75
                          ? 'text-emerald-600'
                          : r.scorePercentage >= 50
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {r.scorePercentage}%
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {r.correctCount}/{r.totalQuestions}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {r.correctCount} {isHindi ? 'सही' : 'Correct'}
                  </span>
                  <span className="flex items-center gap-1 text-rose-700 font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    {r.wrongCount} {isHindi ? 'गलत' : 'Wrong'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
