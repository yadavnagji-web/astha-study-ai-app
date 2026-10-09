import React, { useState } from 'react';
import { Chapter, ClassLevel, Subject } from '../types';
import {
  BookOpen,
  Search,
  Trash2,
  Edit2,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  GraduationCap,
  X,
  Check,
} from 'lucide-react';

interface Props {
  chapters: Chapter[];
  onSelectChapter: (chapter: Chapter) => void;
  onDeleteChapter: (id: string) => void;
  onRenameChapter: (id: string, newTitle: string) => void;
  onOpenUpload: () => void;
  isHindi?: boolean;
}

export const ChapterLibrary: React.FC<Props> = ({
  chapters,
  onSelectChapter,
  onDeleteChapter,
  onRenameChapter,
  onOpenUpload,
  isHindi = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newTitleText, setNewTitleText] = useState('');

  const subjects = ['all', 'Science', 'Social Science', 'Mathematics', 'Hindi', 'English'];

  const filteredChapters = chapters.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || c.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const handleStartRename = (c: Chapter) => {
    setRenamingId(c.id);
    setNewTitleText(c.title);
  };

  const handleSaveRename = (id: string) => {
    if (newTitleText.trim()) {
      onRenameChapter(id, newTitleText.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>{isHindi ? '📚 मेरे अध्याय (Chapter Library)' : '📚 My Chapters Library'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHindi
              ? 'सहेजे गए सभी NCERT पाठ, अनुवाद एवं तैयार प्रश्न बैंक'
              : 'All your saved chapters, notes, and question banks'}
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition"
        >
          <span>{isHindi ? '+ नया अध्याय अपलोड करें' : '+ Upload New Chapter'}</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isHindi ? 'अध्याय या विषय खोजें...' : 'Search by title or subject...'}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap py-1">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSubjectFilter(sub)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                subjectFilter === sub
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sub === 'all' ? (isHindi ? 'सभी विषय' : 'All Subjects') : sub}
            </button>
          ))}
        </div>
      </div>

      {/* Chapters Cards Grid */}
      {filteredChapters.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-400 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-base font-bold text-slate-700">
            {isHindi ? 'कोई अध्याय नहीं मिला' : 'No chapters found'}
          </p>
          <p className="text-xs text-slate-400">
            {isHindi ? 'नया अध्याय अपलोड करें या सर्च फ़िल्टर बदलें।' : 'Upload a chapter or reset filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChapters.map((c) => (
            <div
              key={c.id}
              className="group relative rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 uppercase">
                      {c.classLevel}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {c.subject}
                    </span>
                  </div>

                  {c.isSample && (
                    <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>NCERT Sample</span>
                    </span>
                  )}
                </div>

                {/* Chapter Title / Rename Mode */}
                {renamingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTitleText}
                      onChange={(e) => setNewTitleText(e.target.value)}
                      className="w-full rounded-xl border border-indigo-300 px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleSaveRename(c.id)}
                      className="rounded-lg bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="rounded-lg bg-slate-200 p-1 text-slate-600 hover:bg-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h3
                    onClick={() => onSelectChapter(c)}
                    className="font-extrabold text-base text-slate-800 group-hover:text-indigo-600 transition cursor-pointer line-clamp-2"
                  >
                    {c.title}
                  </h3>
                )}

                {/* Meta details */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(c.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <span>•</span>
                  <span>{c.originalText.length} chars</span>
                </div>

                {/* Auto-Generation Badges */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {(c.shortNotesHindi || c.shortNotesEnglish) && (
                    <span className="rounded-md bg-purple-50 text-purple-700 px-1.5 py-0.5 text-[10px] font-bold border border-purple-100">
                      📝 नोट्स
                    </span>
                  )}
                  {(c.hindiTranslation || c.englishTranslation) && (
                    <span className="rounded-md bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[10px] font-bold border border-blue-100">
                      🌐 अनुवाद
                    </span>
                  )}
                  {c.questions && c.questions.length > 0 && (
                    <span className="rounded-md bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold border border-emerald-100">
                      🎯 {c.questions.length} प्रश्न
                    </span>
                  )}
                  {(c.shortNotesHindi || c.shortNotesEnglish) && c.questions && c.questions.length > 0 && (
                    <span className="rounded-md bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[10px] font-extrabold border border-amber-200">
                      ⚡ 100% तैयार
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartRename(c)}
                    className="rounded-xl p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title={isHindi ? 'नाम बदलें (Rename)' : 'Rename'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!c.isSample && (
                    <button
                      onClick={() => {
                        if (confirm(isHindi ? 'क्या आप इस अध्याय को हटाना चाहते हैं?' : 'Delete this chapter?')) {
                          onDeleteChapter(c.id);
                        }
                      }}
                      className="rounded-xl p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title={isHindi ? 'हटाएं (Delete)' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onSelectChapter(c)}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 group-hover:bg-indigo-600 px-3 py-1.5 text-xs font-bold text-slate-700 group-hover:text-white transition"
                >
                  <span>{isHindi ? 'खोलें (Open)' : 'Open'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
