import React, { useState, useRef } from 'react';
import { Chapter, ClassLevel, Subject } from '../types';
import { detectLanguage } from '../utils/language';
import { getAIHeaders, safeFetchJSON } from '../utils/aiClient';
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
  const [pastedText, setPastedText] = useState<string>('');
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
    setPastedText('');
    setIsEditing(false);
    setErrorMessage(null);
    setChapterTitle('');
  };

  const handleUsePastedText = () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setErrorMessage(isHindi ? 'कृपया पहले कुछ टेक्स्ट दर्ज करें।' : 'Please enter some text first.');
      return;
    }
    setExtractedText(trimmed);
    setChapterLanguage(detectLanguage(trimmed));
    if (!chapterTitle) {
      setChapterTitle(isHindi ? 'पेस्ट किया गया अध्याय' : 'Pasted Chapter');
    }
    setErrorMessage(null);
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
    // Clear value so re-selecting the same file triggers onChange
    e.target.value = '';
  };

  const handleFileSelected = (file: File) => {
    // Validate file type (by both MIME type and file extension)
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
    if (!isPdf && !isImg) {
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
      const isPDF = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

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

        // Call backend PDF extractor safely
        setProcessingStatus(isHindi ? 'पेज 1 से 10 तक टेक्स्ट निकाला जा रहा है...' : 'Extracting text directly from PDF...');
        const data = await safeFetchJSON('/api/pdf/extract', {
          method: 'POST',
          headers: getAIHeaders(),
          body: JSON.stringify({ base64: dataUrl }),
        });

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

        // Fallback OCR
        const ocrData = await safeFetchJSON('/api/ai/ocr', {
          method: 'POST',
          headers: getAIHeaders(),
          body: JSON.stringify({
            base64: dataUrl,
            mimeType: 'application/pdf',
          }),
        });

        if (ocrData.success && ocrData.text) {
          setExtractedText(ocrData.text);
          setChapterLanguage(detectLanguage(ocrData.text));
        } else {
          throw new Error(ocrData.error || 'OCR processing failed');
        }
      } else {
        // Image OCR (PNG/JPG)
        setProcessingStatus(isHindi ? 'चित्र का OCR विश्लेषण हो रहा है...' : 'Processing image via OCR...');

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const dataUrl = await base64Promise;

        const ocrData = await safeFetchJSON('/api/ai/ocr', {
          method: 'POST',
          headers: getAIHeaders(),
          body: JSON.stringify({
            base64: dataUrl,
            mimeType: file.type || 'image/jpeg',
          }),
        });

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
          ? `टेक्स्ट निकालने में समस्या: ${err.message || 'कृपया फ़ाइल पुनः जाँचें या नीचे सीधा टेक्स्ट पेस्ट करें'}`
          : `Extraction error: ${err.message || 'Please check file or paste text directly below'}`
      );
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
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
              className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer overflow-hidden ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
                  : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/30'
              }`}
            >
              {/* Native Invisible Full-Area Input - 100% Guaranteed to open file picker on all phones & desktops */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                title={isHindi ? 'फ़ाइल चुनें (Choose File)' : 'Choose File'}
              />

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600 mb-4 shadow-sm pointer-events-none">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1 pointer-events-none">
                {isHindi ? 'यहाँ क्लिक करें या फ़ाइल ड्रैग करें' : 'Click to select or drag & drop chapter file'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-3 pointer-events-none">
                {isHindi
                  ? 'अपनी NCERT किताब का PDF या पेज की फ़ोटो (PNG, JPG) चुनें'
                  : 'Upload your NCERT textbook PDF or chapter page photo'}
              </p>

              <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-indigo-600/30 mb-3 pointer-events-none">
                <UploadCloud className="w-4 h-4" />
                <span>{isHindi ? '📁 अपने डिवाइस से फ़ाइल चुनें (Choose File)' : '📁 Choose File from Device'}</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 pointer-events-none">
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">PDF</span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">PNG</span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">JPG / JPEG</span>
              </div>
            </div>
          )}

          {/* Option 2: Direct Text Paste */}
          {!extractedText && !isProcessing && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isHindi ? '✍️ या सीधे अध्याय का टेक्स्ट यहाँ लिखें / पेस्ट करें:' : '✍️ Or Type / Paste Chapter Text Directly:'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isHindi ? 'वैकल्पिक' : 'Optional'}
                </span>
              </div>
              <textarea
                rows={3}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={
                  isHindi
                    ? 'यदि आपके पास PDF नहीं है, तो किताब का टेक्स्ट यहाँ कॉपी करके पेस्ट करें...'
                    : 'Paste raw chapter text directly here if you do not have a PDF file...'
                }
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              {pastedText.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleUsePastedText}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 px-3 text-xs font-extrabold text-white hover:bg-indigo-700 active:scale-98 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isHindi ? '✅ इस टेक्स्ट का उपयोग करें (Use This Text)' : '✅ Use This Text'}</span>
                </button>
              )}
            </div>
          )}

          {/* Processing Spinner & Status */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-indigo-50/90 to-white p-8 sm:p-10 border border-indigo-200 text-center shadow-sm">
              <div className="relative mb-3.5">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 rounded-full blur-md bg-indigo-400/25 animate-pulse pointer-events-none" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-base sm:text-lg">
                {processingStatus || (isHindi ? 'अध्याय प्रोसेस हो रहा है...' : 'Processing chapter...')}
              </h4>
              <p className="text-xs text-indigo-700 mt-1 font-medium max-w-sm">
                {isHindi ? 'सामग्री का सटीक विश्लेषण हो रहा है, कृपया कुछ सेकंड प्रतीक्षा करें...' : 'Analyzing content, please wait a moment...'}
              </p>
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
            <button
              onClick={handleSaveChapter}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isHindi ? 'अध्याय सहेजें (Save Chapter)' : 'Save Chapter'}</span>
            </button>
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
