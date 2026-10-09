import React, { useState, useRef } from 'react';
import { Chapter, ClassLevel, Subject } from '../types';
import { detectLanguage } from '../utils/language';
import { getAIHeaders } from '../utils/aiClient';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Edit3,
  RotateCcw,
  Save,
  BookOpen,
  Zap,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChapterSaved: (newChapter: Chapter) => void;
  currentClass: ClassLevel;
  isHindi?: boolean;
}

export const UploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onChapterSaved,
  currentClass,
  isHindi = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chapter metadata fields
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterClass, setChapterClass] = useState<ClassLevel>(currentClass);
  const [chapterSubject, setChapterSubject] = useState<Subject>('Science');
  const [chapterLanguage, setChapterLanguage] = useState<'Hindi' | 'English' | 'Bilingual'>('Hindi');

  if (!isOpen) return null;

  const subjects: Subject[] = ['Science', 'Social Science', 'Mathematics', 'Hindi', 'English', 'Sanskrit'];

  const resetState = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProcessingStatus('');
    setExtractedText('');
    setIsEditing(false);
    setErrorMessage(null);
    setChapterTitle('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        isHindi
          ? 'अमान्य फ़ाइल प्रकार! कृपया केवल PDF, PNG, या JPG फ़ाइल अपलोड करें।'
          : 'Invalid file format. Please upload PDF, PNG, or JPG only.'
      );
      return;
    }

    // Size limit check (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage(
        isHindi
          ? 'फ़ाइल का आकार 25MB से अधिक है। कृपया छोटी फ़ाइल चुनें।'
          : 'File exceeds 25MB. Please choose a smaller file.'
      );
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    // Autofill title if empty
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!chapterTitle) {
      setChapterTitle(cleanName);
    }

    // Start extraction immediately
    processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setExtractedText('');

    try {
      const isPDF = file.type === 'application/pdf';

      if (isPDF) {
        setProcessingStatus(isHindi ? 'PDF की जाँच कर रहे हैं...' : 'Checking PDF selectable text...');

        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const dataUrl = await base64Promise;

        // Call backend PDF extractor
        setProcessingStatus(isHindi ? 'पेज 1 से 10 तक टेक्स्ट निकाला जा रहा है...' : 'Extracting text directly from PDF...');
        const response = await fetch('/api/pdf/extract', {
          method: 'POST',
          headers: getAIHeaders(),
          body: JSON.stringify({ base64: dataUrl }),
        });

        const data = await response.json();

        if (data.success && data.hasSelectableText && data.text) {
          setExtractedText(data.text);
          setChapterLanguage(detectLanguage(data.text));
          setProcessingStatus('');
          setIsProcessing(false);
          return;
        }

        // If no selectable text, it's a scanned PDF
        setProcessingStatus(
          isHindi
            ? 'स्कैन किया हुआ PDF मिला! उच्च परिशुद्धता OCR प्रारंभ किया जा रहा है...'
            : 'Scanned PDF detected. Running high-precision OCR...'
        );

        // Fallback OCR on the first page/image
        const ocrRes = await fetch('/api/ai/ocr', {
          method: 'POST',
          headers: getAIHeaders(),
          body: JSON.stringify({
            base64: dataUrl,
            mimeType: 'application/pdf',
          }),
        });

        const ocrData = await ocrRes.json();
        if (ocrData.success && ocrData.text) {
          setExtractedText(ocrData.text);
          setChapterLanguage(detectLanguage(ocrData.text));
        } else {
          throw new Error(ocrData.error || 'OCR processing failed');
        }
      } else {
        // Image OCR (PNG/JPG)
        setProcessingStatus(isHindi ? 'चित्र का OCR विश्लेषण हो रहा है (Processing page 1)...' : 'Processing page 1 of 1 via OCR...');

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const dataUrl = await base64Promise;

        const ocrRes = await fetch('/api/ai/ocr', {
          method: 'POST',
          headers: getAIHeaders(),
          body: JSON.stringify({
            base64: dataUrl,
            mimeType: file.type,
          }),
        });

        const ocrData = await ocrRes.json();
        if (ocrData.success && ocrData.text) {
          setExtractedText(ocrData.text);
          setChapterLanguage(detectLanguage(ocrData.text));
        } else {
          throw new Error(ocrData.error || 'OCR could not read the image clearly');
        }
      }
    } catch (err: any) {
      setErrorMessage(
        isHindi
          ? `टेक्स्ट निकालने में समस्या: ${err.message || 'कृपया फ़ाइल पुनः जाँचें या दूसरी अपलोड करें'}`
          : `Extraction error: ${err.message || 'Please check file and try again'}`
      );
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Full Automatic Processing State
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [autoProcessStage, setAutoProcessStage] = useState('');
  const [autoProcessProgress, setAutoProcessProgress] = useState(0);

  const handleSaveAndAutoProcess = async () => {
    if (!extractedText.trim()) {
      setErrorMessage(isHindi ? 'कृपया पहले अध्याय का टेक्स्ट निकालें।' : 'Please extract text first.');
      return;
    }

    const titleToUse = chapterTitle.trim() || `अध्याय ${Date.now().toString().slice(-4)}`;
    setIsAutoProcessing(true);
    setErrorMessage(null);
    setAutoProcessProgress(20);
    setAutoProcessStage(isHindi ? '1/3: भाषा अनुवाद तैयार हो रहा है...' : '1/3: Translating chapter...');

    try {
      const res = await fetch('/api/ai/auto-process', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          text: extractedText.trim(),
          language: chapterLanguage,
        }),
      });

      setAutoProcessProgress(65);
      setAutoProcessStage(isHindi ? '2/3: मुख्य नोट्स व सारांश बन रहे हैं...' : '2/3: Generating high-yield notes...');

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Auto process failed');
      }

      setAutoProcessProgress(90);
      setAutoProcessStage(isHindi ? '3/3: 25+ अभ्यास प्रश्न और क्विज़ तैयार हो रहे हैं...' : '3/3: Finalizing question bank...');

      const newChapter: Chapter = {
        id: `chapter-${Date.now()}`,
        title: titleToUse,
        classLevel: chapterClass,
        subject: chapterSubject,
        language: chapterLanguage,
        uploadedAt: new Date().toISOString(),
        originalText: extractedText.trim(),
        hindiTranslation: data.hindiTranslation || undefined,
        englishTranslation: data.englishTranslation || undefined,
        shortNotesHindi: data.shortNotesHindi || undefined,
        shortNotesEnglish: data.shortNotesEnglish || undefined,
        questions: (data.questions && data.questions.length > 0) ? data.questions : [],
      };

      setAutoProcessProgress(100);
      setAutoProcessStage(isHindi ? '✅ 100% स्वतः तैयार हो गया!' : '✅ 100% Ready!');

      setTimeout(() => {
        onChapterSaved(newChapter);
        onClose();
        resetState();
      }, 600);
    } catch (err: any) {
      // If auto-process encountered error, still save the chapter with text so work is not lost
      const fallbackChapter: Chapter = {
        id: `chapter-${Date.now()}`,
        title: titleToUse,
        classLevel: chapterClass,
        subject: chapterSubject,
        language: chapterLanguage,
        uploadedAt: new Date().toISOString(),
        originalText: extractedText.trim(),
      };
      onChapterSaved(fallbackChapter);
      onClose();
      resetState();
    } finally {
      setIsAutoProcessing(false);
    }
  };

  const handleSaveChapter = () => {
    if (!extractedText.trim()) {
      setErrorMessage(isHindi ? 'कृपया पहले अध्याय का टेक्स्ट निकालें।' : 'Please extract text first.');
      return;
    }

    const titleToUse = chapterTitle.trim() || `अध्याय ${Date.now().toString().slice(-4)}`;

    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: titleToUse,
      classLevel: chapterClass,
      subject: chapterSubject,
      language: chapterLanguage,
      uploadedAt: new Date().toISOString(),
      originalText: extractedText.trim(),
    };

    onChapterSaved(newChapter);
    onClose();
    resetState();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                {isHindi ? '📚 अध्याय अपलोड करें (Upload Chapter)' : '📚 Upload Chapter'}
              </h2>
              <p className="text-xs text-slate-500">
                PDF, PNG, JPG, JPEG (Selectable Text & OCR Support)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Manual Chapter Name Input Option */}
          <div className="rounded-2xl bg-indigo-50/70 p-4 border border-indigo-200 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>{isHindi ? '✍️ अध्याय का नाम (Manual Chapter Name - यहाँ लिखें):' : '✍️ Chapter Name (Enter Manually):'}</span>
              </label>
              <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                {isHindi ? 'मनचाहा नाम लिखें' : 'Editable Name'}
              </span>
            </div>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder={
                isHindi
                  ? 'उदा. अध्याय 1: भोजन के घटक / Chapter 1: Components of Food'
                  : 'e.g. Chapter 1: Components of Food'
              }
              className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>

          {/* Upload Area (If no file or wanting to change) */}
          {!extractedText && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
                  : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600 mb-4 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                {isHindi ? 'यहाँ क्लिक करें या फ़ाइल ड्रैग करें' : 'Click to select or drag & drop chapter file'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-3">
                {isHindi
                  ? 'अपनी NCERT किताब का PDF या पेज की फ़ोटो (PNG, JPG) चुनें'
                  : 'Upload your NCERT textbook PDF or chapter page photo'}
              </p>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">PDF</span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">PNG</span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">JPG / JPEG</span>
              </div>
            </div>
          )}

          {/* Processing Spinner & Status */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50/80 p-8 border border-indigo-100 text-center animate-pulse">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                {processingStatus || (isHindi ? 'अध्याय प्रोसेस हो रहा है...' : 'Processing chapter...')}
              </h4>
              <p className="text-xs text-indigo-600 mt-1 font-medium">
                {isHindi ? 'कृपया प्रतीक्षा करें, सामग्री निकाली जा रही है' : 'Extracting chapter content...'}
              </p>
            </div>
          )}

          {/* Full Automatic AI Pipeline Active Screen */}
          {isAutoProcessing && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-indigo-50/90 via-purple-50/80 to-white p-6 sm:p-8 border border-indigo-200 text-center shadow-lg">
              <div className="relative mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                  <Zap className="w-7 h-7 fill-white animate-bounce" />
                </div>
                <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-spin" />
              </div>

              <h4 className="font-extrabold text-slate-900 text-base sm:text-lg mb-1">
                {isHindi ? '⚡ पूर्ण स्वचालित AI निर्माण जारी है...' : '⚡ Full Automatic AI Pipeline Running...'}
              </h4>
              <p className="text-xs font-semibold text-indigo-700 mb-4">
                {autoProcessStage}
              </p>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner mb-3">
                <div
                  className="bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${autoProcessProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between w-full max-w-md text-[11px] font-bold text-slate-500 px-1">
                <span>{isHindi ? '1. अनुवाद' : '1. Translate'}</span>
                <span>{isHindi ? '2. परीक्षा नोट्स' : '2. Notes'}</span>
                <span>{isHindi ? '3. 25+ प्रश्न व क्विज़' : '3. Quiz Bank'}</span>
              </div>
            </div>
          )}

          {/* Extracted Text Section & Metadata */}
          {extractedText && !isProcessing && (
            <div className="space-y-4">
              {/* Chapter Metadata Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                    {isHindi ? 'अध्याय का नाम (Chapter Name)' : 'Chapter Title'}
                  </label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="उदा. भोजन के घटक"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                    {isHindi ? 'कक्षा (Class)' : 'Class'}
                  </label>
                  <select
                    value={chapterClass}
                    onChange={(e) => setChapterClass(e.target.value as ClassLevel)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Class 6">Class 6 (कक्षा 6)</option>
                    <option value="Class 7">Class 7 (कक्षा 7)</option>
                    <option value="Class 8">Class 8 (कक्षा 8)</option>
                    <option value="Class 9">Class 9 (कक्षा 9)</option>
                    <option value="Class 10">Class 10 (कक्षा 10)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                    {isHindi ? 'विषय (Subject)' : 'Subject'}
                  </label>
                  <select
                    value={chapterSubject}
                    onChange={(e) => setChapterSubject(e.target.value as Subject)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text Preview / Edit Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">
                    {isHindi ? 'निकाला गया टेक्स्ट (Extracted Text)' : 'Extracted Text'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({extractedText.length} chars)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition ${
                      isEditing
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? (isHindi ? 'संपादन पूरा करें' : 'Done Editing') : (isHindi ? 'टेक्स्ट संपादित करें' : 'Edit Text')}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (selectedFile) processFile(selectedFile);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'पुनः प्रोसेस करें' : 'Process Again'}</span>
                  </button>
                </div>
              </div>

              {/* Text Viewer / Editor */}
              {isEditing ? (
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={10}
                  className="w-full rounded-2xl border border-indigo-200 bg-indigo-50/20 p-4 font-mono text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs sm:text-sm text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {extractedText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 transition"
          >
            {isHindi ? 'रद्द करें (Cancel)' : 'Cancel'}
          </button>

          {extractedText ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveChapter}
                disabled={isAutoProcessing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>{isHindi ? 'केवल टेक्स्ट सहेजें' : 'Save Text Only'}</span>
              </button>

              <button
                onClick={handleSaveAndAutoProcess}
                disabled={isAutoProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25 hover:from-amber-600 hover:to-indigo-700 active:scale-95 transition disabled:opacity-50"
              >
                {isAutoProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isHindi ? 'स्वतः निर्माण जारी...' : 'Auto-Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>{isHindi ? '⚡ स्वतः सब कुछ बनाएं' : '⚡ Auto-Process Everything'}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              {isHindi ? 'कृपया फ़ाइल चुनें' : 'Please choose a file'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
