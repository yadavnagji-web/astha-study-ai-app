import React, { useState, useEffect } from 'react';
import {
  Chapter,
  GeneratedQuestion,
  QuestionQuantities,
  QuestionType,
  QuizResult,
  QuizAnswer,
} from '../types';
import confetti from 'canvas-confetti';
import { PrintableQuestionPaper } from './PrintableQuestionPaper';
import { getAIHeaders } from '../utils/aiClient';
import {
  BookOpen,
  Languages,
  Scissors,
  HelpCircle,
  CheckCircle,
  Award,
  BarChart3,
  Copy,
  Download,
  Printer,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Edit,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Props {
  chapter: Chapter;
  onUpdateChapter: (updated: Chapter) => void;
  onBack: () => void;
  onSaveQuizResult: (res: QuizResult) => void;
  initialTab?: string;
  isHindi?: boolean;
  masterLanguage?: 'Hindi' | 'English';
  onUpdateMasterLanguage?: (lang: 'Hindi' | 'English') => void;
}

export const ChapterWorkspace: React.FC<Props> = ({
  chapter,
  onUpdateChapter,
  onBack,
  onSaveQuizResult,
  initialTab = 'original',
  isHindi = true,
  masterLanguage,
  onUpdateMasterLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Active working language for Questions, Answers, Short Notes, and Quiz
  const [workingLanguage, setWorkingLanguage] = useState<'Hindi' | 'English'>(
    masterLanguage || (chapter.language === 'English' ? 'English' : 'Hindi')
  );

  useEffect(() => {
    if (masterLanguage) {
      setWorkingLanguage(masterLanguage);
    }
  }, [masterLanguage]);

  const handleWorkingLanguageChange = (newLang: 'Hindi' | 'English') => {
    setWorkingLanguage(newLang);
    onUpdateMasterLanguage?.(newLang);
    onUpdateChapter({ ...chapter, language: newLang });
  };

  // Original text editing
  const [isEditingOriginal, setIsEditingOriginal] = useState(false);
  const [editedOriginalText, setEditedOriginalText] = useState(chapter.originalText);

  // Async processing states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Short Notes choice (Hindi or English)
  const [shortNotesLang, setShortNotesLang] = useState<'Hindi' | 'English'>('Hindi');

  // Question generator quantities
  const [quantities, setQuantities] = useState<QuestionQuantities>({
    mcq: 10,
    true_false: 5,
    fill_blanks: 5,
    one_word: 5,
    short_answer: 5,
    long_answer: 3,
  });
  const [questionFilter, setQuestionFilter] = useState<string>('all');

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);
  const [isReviewingWrong, setIsReviewingWrong] = useState(false);

  // Calculate total questions
  const totalQuestionsRequested =
    quantities.mcq +
    quantities.true_false +
    quantities.fill_blanks +
    quantities.one_word +
    quantities.short_answer +
    quantities.long_answer;

  // Sync when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load quiz questions (MCQ + True/False) when switching to Quiz
  useEffect(() => {
    if (activeTab === 'quiz') {
      const eligible = (chapter.questions || []).filter(
        (q) => q.type === 'mcq' || q.type === 'true_false'
      );
      setQuizQuestions(eligible);
      setCurrentQuizIndex(0);
      setSelectedAnswers({});
      setQuizStartTime(Date.now());
    }
  }, [activeTab, chapter.questions]);

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  // Download TXT helper
  const handleDownloadTxt = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print helper
  const handlePrint = (title: string, content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 2rem; color: #1e293b; }
              h1 { color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
              .meta { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
              pre { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="meta">Astha Study AI – Source Lock Notes | ${chapter.classLevel} ${chapter.subject}</div>
            <pre>${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Translation Action (Hindi or English)
  const handleTranslate = async (targetLang: 'Hindi' | 'English') => {
    setLoadingAction(`translate-${targetLang}`);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          text: chapter.originalText,
          targetLanguage: targetLang,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Translation failed');
      }

      const updated: Chapter = {
        ...chapter,
        ...(targetLang === 'Hindi'
          ? { hindiTranslation: data.translatedText }
          : { englishTranslation: data.translatedText }),
      };

      onUpdateChapter(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Translation failed. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Short Notes Generator Action
  const handleGenerateSummary = async (lang: 'Hindi' | 'English') => {
    setLoadingAction(`summary-${lang}`);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          text: chapter.originalText,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      const updated: Chapter = {
        ...chapter,
        ...(lang === 'Hindi'
          ? { shortNotesHindi: data.summaryText }
          : { shortNotesEnglish: data.summaryText }),
      };

      onUpdateChapter(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Summary generation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  // Question Generator Action
  const handleGenerateQuestions = async () => {
    setLoadingAction('questions');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/questions', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          text: chapter.originalText,
          quantities,
          language: workingLanguage,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      const generatedList: GeneratedQuestion[] = data.questions || [];
      const updated: Chapter = {
        ...chapter,
        questions: generatedList,
      };

      onUpdateChapter(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Question generation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  // ⚡ 1-Click Automatic Generation (Notes + Translation + Question Bank)
  const [autoProcessStage, setAutoProcessStage] = useState<string>('');
  const [autoProcessProgress, setAutoProcessProgress] = useState<number | null>(null);

  const handleAutoProcessAll = async () => {
    setLoadingAction('auto-process');
    setErrorMessage(null);
    setAutoProcessProgress(20);
    setAutoProcessStage(isHindi ? '1/3: भाषा अनुवाद तैयार हो रहा है...' : '1/3: Translating chapter...');

    try {
      const res = await fetch('/api/ai/auto-process', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          text: chapter.originalText,
          language: chapter.language,
        }),
      });

      setAutoProcessProgress(65);
      setAutoProcessStage(isHindi ? '2/3: मुख्य नोट्स व सारांश बन रहे हैं...' : '2/3: Generating high-yield notes...');

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Auto process failed');
      }

      setAutoProcessProgress(95);
      setAutoProcessStage(isHindi ? '3/3: 25+ अभ्यास प्रश्न और क्विज़ तैयार हो रहे हैं...' : '3/3: Finalizing questions...');

      const updated: Chapter = {
        ...chapter,
        hindiTranslation: data.hindiTranslation || chapter.hindiTranslation,
        englishTranslation: data.englishTranslation || chapter.englishTranslation,
        shortNotesHindi: data.shortNotesHindi || chapter.shortNotesHindi,
        shortNotesEnglish: data.shortNotesEnglish || chapter.shortNotesEnglish,
        questions: (data.questions && data.questions.length > 0) ? data.questions : chapter.questions,
      };

      setAutoProcessProgress(100);
      setAutoProcessStage(isHindi ? '✅ सब कुछ स्वतः तैयार हो गया!' : '✅ Complete Chapter Ready!');

      onUpdateChapter(updated);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Auto-process error');
    } finally {
      setTimeout(() => {
        setLoadingAction(null);
        setAutoProcessProgress(null);
        setAutoProcessStage('');
      }, 700);
    }
  };

  // Quiz Handling
  const handleOptionSelect = (qId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: option,
    }));
  };

  const handleSubmitQuiz = () => {
    const timeTaken = Math.max(1, Math.round((Date.now() - quizStartTime) / 1000));
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const answersRecord: QuizAnswer[] = quizQuestions.map((q) => {
      const chosen = selectedAnswers[q.id];
      if (!chosen) {
        skipped++;
        return {
          questionId: q.id,
          questionNumber: q.questionNumber,
          selectedAnswer: 'छोड़ा गया (Skipped)',
          isCorrect: false,
          correctAnswer: q.correctAnswer,
        };
      }

      // Check correctness (exact match or start with letter A/B/C/D)
      const isCorrect =
        chosen.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
        (q.correctAnswer.startsWith('A') && chosen.startsWith('A')) ||
        (q.correctAnswer.startsWith('B') && chosen.startsWith('B')) ||
        (q.correctAnswer.startsWith('C') && chosen.startsWith('C')) ||
        (q.correctAnswer.startsWith('D') && chosen.startsWith('D')) ||
        (q.correctAnswer.toLowerCase().includes('true') && chosen.toLowerCase().includes('true')) ||
        (q.correctAnswer.toLowerCase().includes('false') && chosen.toLowerCase().includes('false'));

      if (isCorrect) correct++;
      else wrong++;

      return {
        questionId: q.id,
        questionNumber: q.questionNumber,
        selectedAnswer: chosen,
        isCorrect,
        correctAnswer: q.correctAnswer,
      };
    });

    const total = quizQuestions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    let grade: QuizResult['performanceGrade'] = 'study_again';
    if (percentage >= 90) grade = 'excellent';
    else if (percentage >= 75) grade = 'very_good';
    else if (percentage >= 60) grade = 'good';
    else if (percentage >= 40) grade = 'keep_practicing';

    const resultObj: QuizResult = {
      id: `result-${Date.now()}`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      timestamp: new Date().toISOString(),
      totalQuestions: total,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      scorePercentage: percentage,
      timeTakenSeconds: timeTaken,
      performanceGrade: grade,
      answers: answersRecord,
    };

    setCurrentResult(resultObj);
    onSaveQuizResult(resultObj);
    setActiveTab('result');

    // Confetti on celebration
    if (percentage >= 75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const currentQuizQ = quizQuestions[currentQuizIndex];

  // Helper stats for short notes
  const activeSummaryText =
    shortNotesLang === 'Hindi' ? chapter.shortNotesHindi : chapter.shortNotesEnglish;
  const originalLength = chapter.originalText.length;
  const summaryLength = activeSummaryText ? activeSummaryText.length : 0;
  const reductionPercent =
    originalLength > 0 && summaryLength > 0
      ? Math.max(0, Math.round(((originalLength - summaryLength) / originalLength) * 100))
      : 0;

  // Tabs configuration with short mobile labels and full desktop labels
  const tabs = [
    { id: 'original', icon: '📖', shortLabel: 'मूल पाठ', fullLabel: '📖 Original (मूल पाठ)' },
    { id: 'hindi', icon: '🇮🇳', shortLabel: 'हिंदी अनुवाद', fullLabel: '🇮🇳 Hindi (हिंदी)' },
    { id: 'english', icon: '🇬🇧', shortLabel: 'English', fullLabel: '🇬🇧 English (अंग्रेजी)' },
    { id: 'short_notes', icon: '✂️', shortLabel: 'शॉर्ट नोट्स', fullLabel: '✂️ Short Notes (संक्षिप्त)' },
    { id: 'questions', icon: '📝', shortLabel: 'प्रश्न बैंक', fullLabel: '📝 Questions (प्रश्न)' },
    { id: 'exam_paper', icon: '📑', shortLabel: '1-Page PDF', fullLabel: '📑 1-Page प्रश्न पत्र (PDF)' },
    { id: 'answers', icon: '✅', shortLabel: 'उत्तर कुंजी', fullLabel: '✅ Answers (उत्तर कुंजी)' },
    { id: 'quiz', icon: '🎯', shortLabel: 'क्विज़', fullLabel: '🎯 Quiz (क्विज़)' },
    { id: 'result', icon: '📊', shortLabel: 'परिणाम', fullLabel: '📊 Result (परिणाम)' },
  ];

  return (
    <div className="space-y-6 pb-24 md:pb-12 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Chapter Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-extrabold text-slate-800">
                {chapter.title}
              </h1>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {chapter.classLevel}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {chapter.subject}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{chapter.originalText.length} characters</span>
              <span>•</span>
              <span>Source Lock Active</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* ⚡ Smart Auto-Pilot Banner (when notes or questions are not yet generated) */}
      {(!chapter.shortNotesHindi || !chapter.shortNotesEnglish || !chapter.questions || chapter.questions.length === 0) && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 p-0.5 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-[15px] bg-white p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>⚡ स्मार्ट ऑटो-पायलट (1-Click Auto Pilot)</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                    {isHindi ? 'स्वतः निर्माण' : 'Full Auto'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isHindi
                    ? 'एक क्लिक में नोट्स, भाषा अनुवाद और 25+ परीक्षा प्रश्न स्वतः तैयार करें।'
                    : 'Generate complete notes, translation, and 25+ exam questions in one single tap.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleAutoProcessAll}
              disabled={loadingAction === 'auto-process'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-indigo-600/25 hover:from-amber-600 hover:to-indigo-700 active:scale-95 transition disabled:opacity-50"
            >
              {loadingAction === 'auto-process' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{autoProcessStage || (isHindi ? 'स्वतः निर्माण जारी...' : 'Auto-generating...')}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white text-white" />
                  <span>{isHindi ? '⚡ सब कुछ स्वतः बनाएं' : '⚡ Auto-Generate All'}</span>
                </>
              )}
            </button>
          </div>
          {loadingAction === 'auto-process' && autoProcessProgress !== null && (
            <div className="w-full bg-slate-100 h-1.5 overflow-hidden rounded-b-[14px]">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${autoProcessProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 100% Mobile Responsive Navigation Workspace Tabs Bar (NO Horizontal Scrollbar) */}
      <div className="space-y-2 w-full max-w-full">
        {/* Full Responsive Tab Grid with Complete User-Specified Labels */}
        <div className="w-full max-w-full rounded-2xl bg-slate-200/80 border border-slate-200 p-1.5 sm:p-2">
          <div className="grid grid-cols-2 min-[540px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:flex xl:flex-wrap gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsReviewingWrong(false);
                  }}
                  className={`w-full rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-xs md:text-sm font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 justify-start text-left min-w-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold ring-2 ring-indigo-400'
                      : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border border-slate-100'
                  }`}
                  title={tab.fullLabel}
                >
                  <span className="shrink-0 text-sm sm:text-base">{tab.icon}</span>
                  <span className="truncate leading-tight font-bold">{tab.fullLabel.replace(/^[^\s]+\s*/, '')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB 1: 📖 Original */}
      {activeTab === 'original' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {isHindi ? '📖 अध्याय का मूल पाठ (Original Text)' : '📖 Original Chapter Text'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'यह सामग्री पुस्तक से सीधे निकाली गई है और AI के लिए आधार स्रोत है।'
                  : 'This content was directly extracted and serves as the locked source for all AI outputs.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isEditingOriginal) {
                    onUpdateChapter({
                      ...chapter,
                      originalText: editedOriginalText,
                    });
                    setIsEditingOriginal(false);
                  } else {
                    setIsEditingOriginal(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                {isEditingOriginal ? <Save className="w-4 h-4 text-emerald-600" /> : <Edit className="w-4 h-4 text-indigo-600" />}
                <span>{isEditingOriginal ? (isHindi ? 'सहेजें (Save)' : 'Save') : (isHindi ? 'संपादित करें (Edit)' : 'Edit')}</span>
              </button>

              <button
                onClick={() => handleCopy(chapter.originalText, 'original')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                {copySuccess === 'original' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copySuccess === 'original' ? (isHindi ? 'कॉपी हो गया' : 'Copied') : (isHindi ? 'कॉपी' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {isEditingOriginal ? (
            <textarea
              value={editedOriginalText}
              onChange={(e) => setEditedOriginalText(e.target.value)}
              rows={16}
              className="w-full rounded-2xl border border-indigo-200 bg-indigo-50/20 p-4 font-mono text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          ) : (
            <div className="rounded-2xl bg-slate-50/60 p-5 font-sans text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-indigo-200">
              {chapter.originalText}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 🇮🇳 Hindi Translation */}
      {activeTab === 'hindi' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {isHindi ? '🇮🇳 हिंदी अनुवाद (Hindi Translation)' : '🇮🇳 Hindi Translation'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'कक्षा 6 के स्तर के अनुसार सरल और सटीक हिंदी रूपांतरण।'
                  : 'Source-locked accurate Hindi translation.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTranslate('Hindi')}
                disabled={loadingAction === 'translate-Hindi'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loadingAction === 'translate-Hindi' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4" />
                )}
                <span>
                  {chapter.hindiTranslation
                    ? isHindi
                      ? 'पुनः अनुवाद करें (Re-Translate)'
                      : 'Re-Translate'
                    : isHindi
                    ? 'हिंदी में अनुवाद करें (Translate)'
                    : 'Translate to Hindi'}
                </span>
              </button>

              {chapter.hindiTranslation && (
                <>
                  <button
                    onClick={() => handleCopy(chapter.hindiTranslation || '', 'hindi-trans')}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {copySuccess === 'hindi-trans' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span>{copySuccess === 'hindi-trans' ? 'कॉपी' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadTxt(`${chapter.title}_Hindi`, chapter.hindiTranslation || '')}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>TXT</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {loadingAction === 'translate-Hindi' ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-indigo-600 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="font-bold text-sm">
                {isHindi ? 'अध्याय का हिंदी में अनुवाद हो रहा है...' : 'Translating chapter into Hindi...'}
              </p>
            </div>
          ) : chapter.hindiTranslation ? (
            <div className="rounded-2xl bg-indigo-50/20 p-5 font-sans text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
              {chapter.hindiTranslation}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              <Languages className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">
                {isHindi ? 'अभी तक हिंदी अनुवाद नहीं किया गया है।' : 'No Hindi translation generated yet.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHindi ? 'ऊपर दिए गए "हिंदी में अनुवाद करें" बटन पर क्लिक करें।' : 'Click the translate button above.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 🇬🇧 English Translation */}
      {activeTab === 'english' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {isHindi ? '🇬🇧 अंग्रेजी अनुवाद (English Translation)' : '🇬🇧 English Translation'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'कक्षा 6 स्तर के अनुसार सरल और प्रामाणिक अंग्रेजी रूपांतरण।'
                  : 'Source-locked accurate English translation.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTranslate('English')}
                disabled={loadingAction === 'translate-English'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loadingAction === 'translate-English' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4" />
                )}
                <span>
                  {chapter.englishTranslation
                    ? isHindi
                      ? 'पुनः अनुवाद करें (Re-Translate)'
                      : 'Re-Translate'
                    : isHindi
                    ? 'अंग्रेजी में अनुवाद करें'
                    : 'Translate to English'}
                </span>
              </button>

              {chapter.englishTranslation && (
                <>
                  <button
                    onClick={() => handleCopy(chapter.englishTranslation || '', 'eng-trans')}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {copySuccess === 'eng-trans' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span>{copySuccess === 'eng-trans' ? 'कॉपी' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadTxt(`${chapter.title}_English`, chapter.englishTranslation || '')}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>TXT</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {loadingAction === 'translate-English' ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-blue-600 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="font-bold text-sm">
                {isHindi ? 'अध्याय का अंग्रेजी में अनुवाद हो रहा है...' : 'Translating chapter into English...'}
              </p>
            </div>
          ) : chapter.englishTranslation ? (
            <div className="rounded-2xl bg-blue-50/20 p-5 font-sans text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
              {chapter.englishTranslation}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              <Languages className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">
                {isHindi ? 'अभी तक अंग्रेजी अनुवाद नहीं किया गया है।' : 'No English translation generated yet.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHindi ? 'ऊपर दिए गए बटन से अनुवाद करें।' : 'Click the translate button above.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ✂️ Short Notes */}
      {activeTab === 'short_notes' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
          {/* Header & Generator Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-500" />
                <span>{isHindi ? '✂️ संक्षिप्त संस्करण / शॉर्ट नोट्स (Short Notes)' : '✂️ Short Version / Summary'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'अध्याय के सभी मुख्य तथ्य, परिभाषाएं व उदाहरण सुरक्षित रखते हुए कक्षा 6 स्तर पर संक्षिप्त।'
                  : 'Concise Class 6 summary preserving all key facts, definitions, and concepts without outside info.'}
              </p>
            </div>

            {/* Language & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setShortNotesLang('Hindi')}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    shortNotesLang === 'Hindi'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => setShortNotesLang('English')}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    shortNotesLang === 'English'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>

              <button
                onClick={() => handleGenerateSummary('Hindi')}
                disabled={loadingAction === 'summary-Hindi'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
              >
                {loadingAction === 'summary-Hindi' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>[Short Hindi]</span>
              </button>

              <button
                onClick={() => handleGenerateSummary('English')}
                disabled={loadingAction === 'summary-English'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
              >
                {loadingAction === 'summary-English' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>[Short English]</span>
              </button>

              {activeSummaryText && (
                <>
                  <button
                    onClick={() => handleCopy(activeSummaryText, 'short-notes')}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {copySuccess === 'short-notes' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>[Copy]</span>
                  </button>

                  <button
                    onClick={() => handleDownloadTxt(`${chapter.title}_Short_Notes`, activeSummaryText)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>[Download TXT]</span>
                  </button>

                  <button
                    onClick={() => handlePrint(`${chapter.title} - Short Notes`, activeSummaryText)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>[Print]</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Length Comparison Stats Card */}
          {activeSummaryText && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200/70 text-amber-900 font-bold text-xs">
                  ORIG
                </div>
                <div>
                  <p className="text-[11px] font-bold text-amber-900 uppercase">Original Length</p>
                  <p className="text-sm font-extrabold text-amber-950 font-mono">
                    {originalLength} <span className="text-xs font-normal">chars</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-200/70 text-emerald-900 font-bold text-xs">
                  SHORT
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-900 uppercase">Short Version Length</p>
                  <p className="text-sm font-extrabold text-emerald-950 font-mono">
                    {summaryLength} <span className="text-xs font-normal">chars</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-200/70 text-indigo-900 font-bold text-xs">
                  EFF
                </div>
                <div>
                  <p className="text-[11px] font-bold text-indigo-900 uppercase">Efficiency</p>
                  <p className="text-sm font-extrabold text-indigo-950">
                    {reductionPercent}% <span className="text-xs font-normal text-slate-600">समय की बचत</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Display */}
          {loadingAction?.startsWith('summary') ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-amber-600 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="font-bold text-sm">
                {isHindi ? 'अध्याय का संक्षिप्त रूप तैयार हो रहा है...' : 'Generating Class 6 concise notes...'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi ? 'सोर्स लॉक के तहत सभी मुख्य तथ्यों को संरक्षित किया जा रहा है।' : 'Preserving all key facts and definitions.'}
              </p>
            </div>
          ) : activeSummaryText ? (
            <div className="rounded-2xl bg-amber-50/20 p-5 font-sans text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap border border-amber-100">
              {activeSummaryText}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              <Scissors className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">
                {isHindi ? 'अभी तक संक्षिप्त नोट्स नहीं बनाए गए हैं।' : 'No short notes generated yet.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHindi ? 'ऊपर दिए गए [Short Hindi] या [Short English] पर क्लिक करें।' : 'Click [Short Hindi] or [Short English] button.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: 📝 Questions (Question Generator) */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Question Generator Panel */}
          <div className="rounded-3xl border border-indigo-100 bg-white p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>{isHindi ? '📝 प्रश्न जेनरेटर (Question Generator Panel)' : '📝 Question Generator Panel'}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {isHindi
                    ? 'AI केवल अपलोड किए गए अध्याय से ही संतुलित और प्रमाणिक प्रश्न तैयार करेगा।'
                    : 'AI will generate questions strictly from the chapter with balanced coverage.'}
                </p>
              </div>

              {/* Total Questions Badge */}
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 text-xs font-bold text-indigo-800 flex items-center gap-2">
                <span>{isHindi ? 'कुल प्रश्न (Total Questions):' : 'Total Questions:'}</span>
                <span className="text-sm font-extrabold text-indigo-600 font-mono">
                  {totalQuestionsRequested}
                </span>
              </div>
            </div>

            {/* Dedicated Language Dropdown for Questions, Answers & Quiz */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 p-4 sm:p-5 shadow-md space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-extrabold text-xl shadow-md shrink-0">
                    🌐
                  </div>
                  <div>
                    <label
                      htmlFor="question-language-dropdown"
                      className="text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-2"
                    >
                      <span>{isHindi ? '🎯 प्रश्न, उत्तर व क्विज़ की भाषा चुनें (Select Language):' : '🎯 Select Question & Quiz Language:'}</span>
                      <span className="rounded-full bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 font-bold uppercase">
                        {workingLanguage}
                      </span>
                    </label>
                    <p className="text-[11px] text-indigo-800 mt-0.5 font-medium leading-relaxed">
                      {isHindi
                        ? 'इस ड्रॉपडाउन से भाषा चुनें—प्रश्न, 4 ऑप्शन्स, उत्तर कुंजी व क्विज़ शत-प्रतिशत उसी भाषा में तैयार होंगे।'
                        : 'Select language below—questions, options, answers, and quiz will be generated 100% in this language.'}
                    </p>
                  </div>
                </div>

                {/* THE DROPDOWN SELECT ELEMENT */}
                <div className="w-full sm:w-auto">
                  <select
                    id="question-language-dropdown"
                    value={workingLanguage}
                    onChange={(e) => handleWorkingLanguageChange(e.target.value as 'Hindi' | 'English')}
                    className="w-full sm:w-64 rounded-xl border-2 border-indigo-600 bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-indigo-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="English">🇬🇧 English (अंग्रेजी में प्रश्न बनाएं)</option>
                    <option value="Hindi">🇮🇳 हिन्दी (हिन्दी में प्रश्न बनाएं)</option>
                  </select>
                </div>
              </div>

              {/* Real-time Indicator Banner */}
              <div className="rounded-xl bg-white/80 border border-indigo-200 px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-indigo-950">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  {workingLanguage === 'English'
                    ? '✓ वर्तमान चयन: ENGLISH — सभी प्रश्न, विकल्प (A, B, C, D), उत्तर और क्विज़ शुद्ध अंग्रेजी में तैयार होंगे।'
                    : '✓ वर्तमान चयन: हिन्दी (HINDI) — सभी प्रश्न, विकल्प (A, B, C, D), उत्तर और क्विज़ शुद्ध हिन्दी में तैयार होंगे।'}
                </span>
              </div>
            </div>

            {/* Quantity Fields Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* MCQ */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ☑ MCQ
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={quantities.mcq}
                  onChange={(e) =>
                    setQuantities({ ...quantities, mcq: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* True / False */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ☑ True / False
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={quantities.true_false}
                  onChange={(e) =>
                    setQuantities({ ...quantities, true_false: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Fill in the Blanks */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ☑ Fill in Blanks
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={quantities.fill_blanks}
                  onChange={(e) =>
                    setQuantities({ ...quantities, fill_blanks: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* One Word Answer */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ☑ One Word
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={quantities.one_word}
                  onChange={(e) =>
                    setQuantities({ ...quantities, one_word: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Short Answer */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ☑ Short Answer
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={quantities.short_answer}
                  onChange={(e) =>
                    setQuantities({ ...quantities, short_answer: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Long Answer */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ☑ Long Answer
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={quantities.long_answer}
                  onChange={(e) =>
                    setQuantities({ ...quantities, long_answer: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Launch Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {isHindi
                    ? 'सोर्स लॉक गारंटी: कोई भी दोहराव नहीं, सम्पूर्ण अध्याय का कवरेज।'
                    : 'Source Lock Guarantee: 100% chapter derived.'}
                </span>
              </div>

              <button
                onClick={handleGenerateQuestions}
                disabled={loadingAction === 'questions' || totalQuestionsRequested === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-700 hover:to-blue-700 active:scale-95 disabled:opacity-50 transition cursor-pointer"
              >
                {loadingAction === 'questions' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>🚀</span>
                )}
                <span>
                  {loadingAction === 'questions'
                    ? isHindi
                      ? 'अध्याय का विश्लेषण व प्रश्न निर्माण...'
                      : 'Analyzing Chapter & Generating...'
                    : isHindi
                    ? '[🚀 Generate Questions / प्रश्न बनाएं]'
                    : '[🚀 Generate Questions]'}
                </span>
              </button>
            </div>
          </div>

          {/* Generated Questions List */}
          {chapter.questions && chapter.questions.length > 0 && (
            <div className="space-y-4">
              {/* Type Filter Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-extrabold text-slate-800">
                  {isHindi
                    ? `तैयार प्रश्न (${chapter.questions.length})`
                    : `Generated Questions (${chapter.questions.length})`}
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab('exam_paper')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm hover:from-amber-600 hover:to-amber-700 transition cursor-pointer"
                  >
                    <span>📑 1-Page प्रश्न पत्र (PDF)</span>
                  </button>

                  <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
                    {['all', 'mcq', 'true_false', 'fill_blanks', 'one_word', 'short_answer', 'long_answer'].map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => setQuestionFilter(filter)}
                          className={`rounded-xl px-2.5 py-1 transition ${
                            questionFilter === filter
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {filter.toUpperCase()}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Questions Grid */}
              <div className="space-y-3">
                {chapter.questions
                  .filter((q) => questionFilter === 'all' || q.type === questionFilter)
                  .map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-2.5 hover:border-indigo-200 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold font-mono">
                            {idx + 1}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 uppercase">
                            {q.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                        {q.question}
                      </p>

                      {/* Options for MCQ */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: 📑 Exam Paper (1-Page प्रश्न पत्र एवं उत्तर कुंजी PDF) */}
      {activeTab === 'exam_paper' && (
        <PrintableQuestionPaper
          chapter={chapter}
          onBack={() => setActiveTab('questions')}
          isHindi={isHindi}
          language={workingLanguage}
        />
      )}

      {/* TAB 6: ✅ Answers (Dedicated Answer Tab) */}
      {activeTab === 'answers' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{isHindi ? '✅ उत्तर कुंजी व संदर्भ (Dedicated Answers Guide)' : '✅ Dedicated Answers Guide'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'प्रत्येक प्रश्न का सही उत्तर और अध्याय के मूल पाठ से संदर्भ स्पष्टीकरण।'
                  : 'Correct answer and chapter-locked explanation for each question.'}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('exam_paper')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer self-start sm:self-auto"
            >
              <span>📄 उत्तर कुंजी PDF प्रिंट करें</span>
            </button>
          </div>

          {!chapter.questions || chapter.questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">
                {isHindi ? 'पहले "Questions" टैब में प्रश्न बनाएं।' : 'Please generate questions first.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chapter.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold font-mono">
                      Q{idx + 1}
                    </span>
                    <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                      {q.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">{q.question}</h4>
                  </div>

                  {/* Correct Answer */}
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm text-emerald-950 font-semibold flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-extrabold uppercase text-emerald-800 block">
                        {isHindi ? 'सही उत्तर (Correct Answer):' : 'Correct Answer:'}
                      </span>
                      <span>{q.correctAnswer}</span>
                    </div>
                  </div>

                  {/* Explanation with Source Lock */}
                  {q.explanation && (
                    <div className="rounded-xl bg-white border border-slate-200/90 p-3 text-xs text-slate-600 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        {isHindi ? 'अध्याय से संदर्भ एवं स्पष्टीकरण:' : 'Explanation from chapter:'}
                      </span>
                      <p className="leading-relaxed">{q.explanation}</p>
                      {q.sourceReference && (
                        <p className="text-[11px] text-indigo-700 italic border-l-2 border-indigo-400 pl-2 mt-1">
                          "{q.sourceReference}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: 🎯 Quiz Mode */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {quizQuestions.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 space-y-3">
              <Award className="w-12 h-12 mx-auto text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">
                {isHindi ? 'क्विज़ के लिए कोई MCQ प्रश्न नहीं मिला!' : 'No MCQ questions available for Quiz!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isHindi
                  ? 'कृपया पहले "Questions" टैब में जाएं और कम से कम कुछ MCQ या True/False प्रश्न बनाएं।'
                  : 'Please go to Questions tab and generate MCQs or True/False questions first.'}
              </p>
              <button
                onClick={() => setActiveTab('questions')}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                {isHindi ? 'प्रश्न जेनरेट करें' : 'Generate Questions'}
              </button>
            </div>
          ) : currentQuizQ ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm space-y-6">
              {/* Quiz Progress Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    {isHindi
                      ? `प्रश्न ${currentQuizIndex + 1} / ${quizQuestions.length}`
                      : `Question ${currentQuizIndex + 1} / ${quizQuestions.length}`}
                  </span>
                  <span className="text-indigo-600 font-mono">
                    {Math.round(((currentQuizIndex + 1) / quizQuestions.length) * 100)}%
                  </span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{
                      width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="space-y-4">
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 uppercase">
                  {currentQuizQ.type.replace('_', ' ')}
                </span>
                <h3 className="text-base sm:text-xl font-extrabold text-slate-800 leading-snug">
                  {currentQuizQ.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2.5 pt-2">
                  {(currentQuizQ.options || [
                    'A) True (सत्य)',
                    'B) False (असत्य)',
                  ]).map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQuizQ.id] === opt;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleOptionSelect(currentQuizQ.id, opt)}
                        className={`flex items-center gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all active:scale-[0.99] ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm'
                            : 'border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-xs sm:text-sm">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <button
                  onClick={() => setCurrentQuizIndex((p) => Math.max(0, p - 1))}
                  disabled={currentQuizIndex === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{isHindi ? 'पिछला (Previous)' : 'Previous'}</span>
                </button>

                {currentQuizIndex < quizQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuizIndex((p) => p + 1)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                  >
                    <span>{isHindi ? 'अगला (Next)' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-95 cursor-pointer"
                  >
                    <span>{isHindi ? 'क्विज़ सबमिट करें (Submit Quiz)' : 'Submit Quiz'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 8: 📊 Result System */}
      {activeTab === 'result' && (
        <div className="space-y-6">
          {!currentResult ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 space-y-3">
              <BarChart3 className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">
                {isHindi ? 'कोई सक्रिय परिणाम नहीं मिला।' : 'No active quiz result yet.'}
              </h3>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'कृपया पहले Quiz टैब में जाकर प्रश्नोत्तरी पूरी करें।'
                  : 'Please complete a quiz in the Quiz tab first.'}
              </p>
              <button
                onClick={() => setActiveTab('quiz')}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                {isHindi ? 'क्विज़ शुरू करें' : 'Start Quiz'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scorecard Hero */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                {/* Performance Badge Header */}
                <div className="text-center space-y-2">
                  <div className="text-3xl sm:text-4xl">
                    {currentResult.scorePercentage >= 90
                      ? '🏆'
                      : currentResult.scorePercentage >= 75
                      ? '🌟'
                      : currentResult.scorePercentage >= 60
                      ? '👍'
                      : currentResult.scorePercentage >= 40
                      ? '💪'
                      : '📚'}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                    {currentResult.scorePercentage >= 90
                      ? isHindi
                        ? 'अति उत्तम! (Excellent!)'
                        : 'Excellent!'
                      : currentResult.scorePercentage >= 75
                      ? isHindi
                        ? 'बहुत अच्छा! (Very Good!)'
                        : 'Very Good!'
                      : currentResult.scorePercentage >= 60
                      ? isHindi
                        ? 'अच्छा प्रयास! (Good!)'
                        : 'Good!'
                      : currentResult.scorePercentage >= 40
                      ? isHindi
                        ? 'और अभ्यास करें! (Keep Practicing!)'
                        : 'Keep Practicing!'
                      : isHindi
                      ? "फिर से पाठ पढ़ें! (Let's Study Again!)"
                      : "Let's Study Again!"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {chapter.title} • {new Date(currentResult.timestamp).toLocaleDateString()}
                  </p>
                </div>

                {/* Score Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Percentage */}
                  <div className="rounded-2xl bg-indigo-50/80 p-4 text-center border border-indigo-100">
                    <p className="text-[11px] font-bold text-indigo-700 uppercase">Score</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-indigo-900 font-mono mt-0.5">
                      {currentResult.scorePercentage}%
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-1">
                      {currentResult.correctCount} / {currentResult.totalQuestions}
                    </p>
                  </div>

                  {/* Correct */}
                  <div className="rounded-2xl bg-emerald-50/80 p-4 text-center border border-emerald-100">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase">Correct</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-mono mt-0.5">
                      {currentResult.correctCount}
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-1">सही उत्तर</p>
                  </div>

                  {/* Wrong */}
                  <div className="rounded-2xl bg-rose-50/80 p-4 text-center border border-rose-100">
                    <p className="text-[11px] font-bold text-rose-700 uppercase">Wrong</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-rose-900 font-mono mt-0.5">
                      {currentResult.wrongCount}
                    </p>
                    <p className="text-[10px] text-rose-600 mt-1">गलत उत्तर</p>
                  </div>

                  {/* Time */}
                  <div className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-600 uppercase">Time</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-mono mt-0.5">
                      {currentResult.timeTakenSeconds}s
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">समय लगा</p>
                  </div>
                </div>

                {/* Result Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsReviewingWrong(!isReviewingWrong)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                  >
                    <span>
                      {isReviewingWrong
                        ? isHindi
                          ? 'समीक्षा बंद करें'
                          : 'Close Review'
                        : isHindi
                        ? '🔍 गलत प्रश्नों की समीक्षा (Review Wrong Questions)'
                        : 'Review Wrong Questions'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('quiz');
                      setCurrentQuizIndex(0);
                      setSelectedAnswers({});
                      setQuizStartTime(Date.now());
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    <span>{isHindi ? 'पुनः प्रयास करें (Try Again)' : 'Try Again'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('original')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>{isHindi ? 'अध्याय पर वापस (Back to Chapter)' : 'Back to Chapter'}</span>
                  </button>
                </div>
              </div>

              {/* Review Wrong Questions Section */}
              {isReviewingWrong && (
                <div className="rounded-3xl border border-rose-100 bg-white p-5 sm:p-7 shadow-sm space-y-4">
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>{isHindi ? 'गलत प्रश्नों की समीक्षा' : 'Review Incorrect Answers'}</span>
                  </h3>

                  {currentResult.answers.filter((a) => !a.isCorrect).length === 0 ? (
                    <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800 font-bold text-sm">
                      🎉 {isHindi ? 'अद्भुत! आपने कोई गलत उत्तर नहीं दिया।' : 'Amazing! You answered all questions correctly!'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentResult.answers
                        .filter((a) => !a.isCorrect)
                        .map((ans, idx) => {
                          const originalQ = quizQuestions.find((q) => q.id === ans.questionId);
                          return (
                            <div
                              key={idx}
                              className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-600 text-white text-[10px] font-bold">
                                  {idx + 1}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                                  {originalQ?.question || `प्रश्न #${ans.questionNumber}`}
                                </h4>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="rounded-xl bg-white border border-rose-200 p-2.5 text-rose-700">
                                  <span className="font-extrabold text-[10px] uppercase block text-rose-400">
                                    {isHindi ? 'आपका उत्तर:' : 'Your Answer:'}
                                  </span>
                                  <span>{ans.selectedAnswer}</span>
                                </div>

                                <div className="rounded-xl bg-white border border-emerald-200 p-2.5 text-emerald-800">
                                  <span className="font-extrabold text-[10px] uppercase block text-emerald-500">
                                    {isHindi ? 'सही उत्तर:' : 'Correct Answer:'}
                                  </span>
                                  <span>{ans.correctAnswer}</span>
                                </div>
                              </div>

                              {originalQ?.explanation && (
                                <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-slate-100 leading-relaxed">
                                  💡 {originalQ.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
