import React, { useState } from 'react';
import { Chapter, GeneratedQuestion } from '../types';
import { Printer, Download, Sparkles, FileText, CheckCircle, ArrowLeft, Sliders, Check } from 'lucide-react';

interface Props {
  chapter: Chapter;
  onBack: () => void;
  isHindi?: boolean;
  language?: 'Hindi' | 'English' | 'Hinglish';
}

export const PrintableQuestionPaper: React.FC<Props> = ({
  chapter,
  onBack,
  isHindi = true,
  language,
}) => {
  const isEnglish = language === 'English' || (!isHindi && language !== 'Hindi');
  const [activeSheet, setActiveSheet] = useState<'paper' | 'answer_key'>('paper');
  const [instituteName, setInstituteName] = useState(
    isEnglish ? 'Astha Public School' : 'आस्था पब्लिक स्कूल / Astha Public School'
  );
  const [examTitle, setExamTitle] = useState(
    isEnglish ? 'Chapter Assessment Test (NCERT / CBSE Pattern)' : 'अध्याय मूल्यांकन परीक्षा (Chapter Test)'
  );
  const [isUltraCompact, setIsUltraCompact] = useState(true);

  // Group questions by type
  const allQuestions = chapter.questions || [];
  const mcqs = allQuestions.filter((q) => q.type === 'mcq');
  const trueFalse = allQuestions.filter((q) => q.type === 'true_false');
  const blanks = allQuestions.filter((q) => q.type === 'fill_blanks');
  const oneWord = allQuestions.filter((q) => q.type === 'one_word');
  const shortAnswers = allQuestions.filter((q) => q.type === 'short_answer');
  const longAnswers = allQuestions.filter((q) => q.type === 'long_answer');

  // For 1-page fit, pick balanced representative selection if too many questions exist
  const displayMcqs = isUltraCompact ? mcqs.slice(0, 5) : mcqs;
  const displayObjective = isUltraCompact
    ? [...blanks.slice(0, 3), ...trueFalse.slice(0, 2)]
    : [...blanks, ...trueFalse, ...oneWord];
  const displaySubjective = isUltraCompact
    ? [...shortAnswers.slice(0, 2), ...longAnswers.slice(0, 1)]
    : [...shortAnswers, ...longAnswers];

  // Calculate marks
  const totalQuestionsCount =
    displayMcqs.length + displayObjective.length + displaySubjective.length;
  const totalMarks =
    displayMcqs.length * 1 + displayObjective.length * 1 + displaySubjective.length * 2;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Toolbar (Hidden during print) */}
      <div className="print:hidden rounded-3xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>{isHindi ? 'प्रश्न पत्र एवं उत्तर कुंजी (1-Page PDF Generator)' : 'Question Paper & Answer Key PDF'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'एक ही पेज में प्रिंट/PDF के लिए अनुकूलित लेआउट (School Test Paper)'
                : 'Optimized 1-page printable layout for tests and assessments'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveSheet('paper')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeSheet === 'paper'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 {isHindi ? 'प्रश्न पत्र (Question Paper)' : 'Question Paper'}
            </button>
            <button
              onClick={() => setActiveSheet('answer_key')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeSheet === 'answer_key'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✅ {isHindi ? 'उत्तर कुंजी (Answer Key)' : 'Answer Key'}
            </button>
          </div>

          {/* 1-Page Compact Mode Toggle */}
          <button
            onClick={() => setIsUltraCompact(!isUltraCompact)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
              isUltraCompact
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
            title="Toggle 1-page fit optimization"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>{isUltraCompact ? (isHindi ? '1-पेज मोड सक्रिय' : '1-Page Fit: ON') : (isHindi ? 'सभी प्रश्न' : 'All Questions')}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-blue-700 active:scale-95 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {activeSheet === 'paper'
                ? isHindi
                  ? '🖨️ प्रश्न पत्र प्रिंट / PDF'
                  : '🖨️ Print Paper (PDF)'
                : isHindi
                ? '📄 उत्तर कुंजी प्रिंट / PDF'
                : '📄 Print Answer Key (PDF)'}
            </span>
          </button>
        </div>
      </div>

      {/* Editable Header inputs (Hidden during print) */}
      <div className="print:hidden rounded-2xl bg-slate-100/70 p-3.5 border border-slate-200 flex flex-col sm:flex-row gap-3 text-xs">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
            {isHindi ? 'विद्यालय / संस्थान का नाम (School Name)' : 'School / Institute Name'}
          </label>
          <input
            type="text"
            value={instituteName}
            onChange={(e) => setInstituteName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
            {isHindi ? 'परीक्षा का शीर्षक (Exam Title)' : 'Exam Title'}
          </label>
          <input
            type="text"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRINTABLE SHEET CONTAINER (A4 FORMAT) */}
      {/* ========================================================= */}
      <div className="mx-auto max-w-4xl bg-white shadow-lg print:shadow-none print:m-0 print:p-0 rounded-2xl print:rounded-none border border-slate-200 print:border-none p-6 sm:p-8 text-slate-900 font-serif">
        
        {/* VIEW 1: QUESTION PAPER */}
        {activeSheet === 'paper' && (
          <div className="space-y-3.5 text-xs leading-normal">
            {/* Exam Header */}
            <div className="border-b-2 border-slate-900 pb-2.5 text-center space-y-1">
              <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide">
                {instituteName}
              </h1>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                {examTitle}
              </h2>
              <div className="flex flex-wrap justify-between items-center text-[11px] font-semibold pt-1 border-t border-slate-300">
                <span><strong>कक्षा (Class):</strong> {chapter.classLevel}</span>
                <span><strong>विषय (Subject):</strong> {chapter.subject}</span>
                <span><strong>पूर्णांक (Max Marks):</strong> {totalMarks}</span>
                <span><strong>समय (Time):</strong> 45 मिनट</span>
              </div>
              <div className="text-[11px] font-bold text-slate-700 pt-0.5">
                अध्याय (Chapter): {chapter.title}
              </div>
            </div>

            {/* Student Details Fields */}
            <div className="flex flex-wrap justify-between items-center text-[11px] border-b border-dashed border-slate-400 pb-1.5 font-sans">
              <span>विद्यार्थी का नाम (Name): ________________________________</span>
              <span>अनुक्रमांक (Roll No.): _________</span>
              <span>दिनांक (Date): ____________</span>
            </div>

            {/* General Instructions */}
            <div className="text-[10px] text-slate-600 italic pb-1">
              * निर्देश: सभी प्रश्न अनिवार्य हैं। उत्तर केवल दिए गए अध्याय के आधार पर लिखें।
            </div>

            {/* SECTION A: MCQs */}
            {displayMcqs.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5 font-bold text-xs uppercase bg-slate-50 px-1 py-0.5">
                  <span>खंड 'क' (Section A) - बहुविकल्पीय प्रश्न (MCQ)</span>
                  <span>[{displayMcqs.length} × 1 = {displayMcqs.length} अंक]</span>
                </div>

                <div className="space-y-1.5 pl-1">
                  {displayMcqs.map((q, idx) => (
                    <div key={q.id || idx} className="text-[11px] break-inside-avoid">
                      <div className="font-semibold">
                        {idx + 1}. {q.question}
                      </div>
                      {/* Compact inline/2-column options */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pl-3 pt-0.5 text-[10.5px] font-sans text-slate-800">
                        {(q.options || []).map((opt, oIdx) => (
                          <div key={oIdx}>{opt}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION B: Fill in Blanks / True False */}
            {displayObjective.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5 font-bold text-xs uppercase bg-slate-50 px-1 py-0.5">
                  <span>खंड 'ख' (Section B) - रिक्त स्थान एवं सत्य / असत्य</span>
                  <span>[{displayObjective.length} × 1 = {displayObjective.length} अंक]</span>
                </div>

                <div className="space-y-1 pl-1">
                  {displayObjective.map((q, idx) => {
                    const qNum = displayMcqs.length + idx + 1;
                    return (
                      <div key={q.id || idx} className="text-[11px] flex justify-between gap-2 break-inside-avoid">
                        <div>
                          <span className="font-semibold">{qNum}. </span>
                          <span>{q.question}</span>
                        </div>
                        <span className="font-sans font-bold text-slate-400 shrink-0 text-[10px]">
                          (1 अंक)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION C: Subjective Questions */}
            {displaySubjective.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5 font-bold text-xs uppercase bg-slate-50 px-1 py-0.5">
                  <span>खंड 'ग' (Section C) - लघु एवं वर्णनात्मक प्रश्न</span>
                  <span>[{displaySubjective.length} × 2 = {displaySubjective.length * 2} अंक]</span>
                </div>

                <div className="space-y-1.5 pl-1">
                  {displaySubjective.map((q, idx) => {
                    const qNum = displayMcqs.length + displayObjective.length + idx + 1;
                    return (
                      <div key={q.id || idx} className="text-[11px] flex justify-between gap-2 break-inside-avoid">
                        <div>
                          <span className="font-semibold">{qNum}. </span>
                          <span>{q.question}</span>
                        </div>
                        <span className="font-sans font-bold text-slate-400 shrink-0 text-[10px]">
                          (2 अंक)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
              *** समाप्त / END OF QUESTION PAPER ***
            </div>
          </div>
        )}

        {/* VIEW 2: ANSWER KEY SHEET */}
        {activeSheet === 'answer_key' && (
          <div className="space-y-3.5 text-xs leading-normal">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-2 text-center space-y-1">
              <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide">
                {instituteName}
              </h1>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800">
                उत्तर कुंजी एवं मूल्यांकन योजना (OFFICIAL ANSWER KEY)
              </h2>
              <div className="flex justify-between items-center text-[11px] font-semibold pt-1 border-t border-slate-300">
                <span><strong>कक्षा:</strong> {chapter.classLevel}</span>
                <span><strong>विषय:</strong> {chapter.subject}</span>
                <span><strong>अध्याय:</strong> {chapter.title}</span>
              </div>
            </div>

            {/* Source Lock Notice */}
            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded text-[10px] text-emerald-900 font-sans">
              🔒 <strong>सोर्स लॉक पुष्टि:</strong> सभी उत्तर केवल दिए गए अध्याय के तथ्यों और पाठ्यपुस्तक पंक्तियों से प्रमाणित हैं।
            </div>

            {/* Answer Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-2 py-1 text-center w-12">क्र.</th>
                    <th className="border border-slate-300 px-2 py-1 text-left w-24">प्रकार</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">सही उत्तर (Correct Answer)</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">अध्याय से संदर्भ / प्रमाण (Source)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...displayMcqs, ...displayObjective, ...displaySubjective].map((q, idx) => (
                    <tr key={q.id || idx} className="hover:bg-slate-50 break-inside-avoid">
                      <td className="border border-slate-300 px-2 py-1 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 uppercase text-[10px] text-slate-600">
                        {q.type.replace('_', ' ')}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 font-bold text-emerald-900">
                        {q.correctAnswer}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-[10px] text-slate-600 italic">
                        {q.sourceReference || q.explanation || 'दिए गए अध्याय अनुसार प्रमाणित'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
              *** उत्तर कुंजी समाप्त / END OF ANSWER KEY ***
            </div>
          </div>
        )}
      </div>

      {/* Global Print Styles (enforces 1-page fit on standard A4 print) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          header, nav, .bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
