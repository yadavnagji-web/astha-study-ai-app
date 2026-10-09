import React, { useState, useEffect } from 'react';
import { Chapter, ClassLevel, QuizResult } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { ActionToolbar } from './components/ActionToolbar';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HomeView } from './components/HomeView';
import { ChapterLibrary } from './components/ChapterLibrary';
import { ChapterWorkspace } from './components/ChapterWorkspace';
import { UploadModal } from './components/UploadModal';
import { AdminPanel } from './components/AdminPanel';
import { ResultsHistoryModal } from './components/ResultsHistoryModal';
import { ShareModal } from './components/ShareModal';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentClass, setCurrentClass] = useState<ClassLevel>('Class 6');
  const [language, setLanguage] = useState<'Hindi' | 'English'>('Hindi');
  const [currentView, setCurrentView] = useState<'home' | 'chapters' | 'workspace' | 'admin'>('home');
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<string>('original');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isResultsHistoryOpen, setIsResultsHistoryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  // Load initial data from local storage
  useEffect(() => {
    const loadedChapters = storageService.getChapters();
    setChapters(loadedChapters);

    const prefs = storageService.getPrefs();
    setCurrentClass(prefs.classLevel);
    setLanguage(prefs.language);

    const loadedResults = storageService.getResults();
    setQuizResults(loadedResults);
  }, []);

  // Update preferences
  const handleClassChange = (c: ClassLevel) => {
    setCurrentClass(c);
    storageService.savePrefs({ classLevel: c });
  };

  const handleLanguageToggle = () => {
    const nextLang = language === 'Hindi' ? 'English' : 'Hindi';
    setLanguage(nextLang);
    storageService.savePrefs({ language: nextLang });
  };

  // Chapter operations
  const handleChapterSaved = (newChapter: Chapter) => {
    storageService.saveChapter(newChapter);
    const updatedList = storageService.getChapters();
    setChapters(updatedList);
    setSelectedChapter(newChapter);
    if (newChapter.language) {
      setLanguage(newChapter.language === 'English' ? 'English' : 'Hindi');
      storageService.savePrefs({ language: newChapter.language === 'English' ? 'English' : 'Hindi' });
    }
    setWorkspaceInitialTab('original');
    setCurrentView('workspace');
  };

  const handleUpdateChapter = (updated: Chapter) => {
    storageService.saveChapter(updated);
    const updatedList = storageService.getChapters();
    setChapters(updatedList);
    setSelectedChapter(updated);
  };

  const handleDeleteChapter = (id: string) => {
    storageService.deleteChapter(id);
    const updatedList = storageService.getChapters();
    setChapters(updatedList);
    if (selectedChapter?.id === id) {
      setSelectedChapter(null);
      setCurrentView('home');
    }
  };

  const handleRenameChapter = (id: string, newTitle: string) => {
    storageService.updateChapterTitle(id, newTitle);
    const updatedList = storageService.getChapters();
    setChapters(updatedList);
    if (selectedChapter?.id === id) {
      setSelectedChapter({ ...selectedChapter, title: newTitle });
    }
  };

  const handleSelectChapter = (chapter: Chapter, initialTab = 'original') => {
    setSelectedChapter(chapter);
    if (chapter.language) {
      setLanguage(chapter.language === 'English' ? 'English' : 'Hindi');
      storageService.savePrefs({ language: chapter.language === 'English' ? 'English' : 'Hindi' });
    }
    setWorkspaceInitialTab(initialTab);
    setCurrentView('workspace');
  };

  const handleSaveQuizResult = (result: QuizResult) => {
    storageService.saveResult(result);
    setQuizResults(storageService.getResults());
  };

  const isHindi = language === 'Hindi';

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Initial App Loading Screen / Splash Page */}
      {isLoadingInitial && (
        <SplashScreen
          onFinish={() => setIsLoadingInitial(false)}
          isHindi={isHindi}
        />
      )}

      {/* Offline Toast Banner */}
      <OfflineIndicator isHindi={isHindi} />

      {/* Main Top Header: Strictly ASTHA STUDY AI / Class 6 / Smart Chapter Study Companion ONLY */}
      <Navbar
        currentClass={currentClass}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view !== 'workspace') setSelectedChapter(null);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-3 sm:pt-5 pb-24 sm:pb-8 overflow-x-hidden min-w-0">
        {/* Controls Toolbar: All actions, selectors, language, share, admin moved here (BAKI SAB NICHE) */}
        <ActionToolbar
          currentClass={currentClass}
          onClassChange={handleClassChange}
          language={language}
          onLanguageToggle={handleLanguageToggle}
          onNavigate={(view) => {
            setCurrentView(view);
            if (view !== 'workspace') setSelectedChapter(null);
          }}
          currentView={currentView}
          onOpenShare={() => setIsShareOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
        {/* VIEW 1: Home */}
        {currentView === 'home' && (
          <HomeView
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenChapters={() => setCurrentView('chapters')}
            onSelectChapter={handleSelectChapter}
            onOpenResults={() => setIsResultsHistoryOpen(true)}
            chapters={chapters}
            currentClass={currentClass}
            isHindi={isHindi}
            onOpenShare={() => setIsShareOpen(true)}
          />
        )}

        {/* VIEW 2: Chapter Library */}
        {currentView === 'chapters' && (
          <ChapterLibrary
            chapters={chapters}
            onSelectChapter={handleSelectChapter}
            onDeleteChapter={handleDeleteChapter}
            onRenameChapter={handleRenameChapter}
            onOpenUpload={() => setIsUploadOpen(true)}
            isHindi={isHindi}
          />
        )}

        {/* VIEW 3: Chapter Workspace */}
        {currentView === 'workspace' && selectedChapter && (
          <ChapterWorkspace
            chapter={selectedChapter}
            onUpdateChapter={handleUpdateChapter}
            onBack={() => {
              setCurrentView('home');
              setSelectedChapter(null);
            }}
            onSaveQuizResult={handleSaveQuizResult}
            initialTab={workspaceInitialTab}
            isHindi={isHindi}
            masterLanguage={language}
            onUpdateMasterLanguage={(newLang) => {
              setLanguage(newLang);
              storageService.savePrefs({ language: newLang });
            }}
          />
        )}

        {/* VIEW 4: Admin Portal */}
        {currentView === 'admin' && (
          <AdminPanel
            onClose={() => setCurrentView('home')}
            isHindi={isHindi}
            onOpenShare={() => setIsShareOpen(true)}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        activeWorkspaceTab={workspaceInitialTab}
        onNavigate={(view, tab) => {
          if (view === 'workspace') {
            if (selectedChapter) {
              setWorkspaceInitialTab(tab || 'original');
              setCurrentView('workspace');
            } else if (chapters.length > 0) {
              setSelectedChapter(chapters[0]);
              setWorkspaceInitialTab(tab || 'original');
              setCurrentView('workspace');
            } else {
              setIsUploadOpen(true);
            }
          } else {
            setCurrentView(view);
          }
        }}
        isHindi={isHindi}
      />

      {/* Share Modal (with Vercel Deploy Link & Family Code) */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        isHindi={isHindi}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onChapterSaved={handleChapterSaved}
        currentClass={currentClass}
        isHindi={isHindi}
      />

      {/* Results History Modal */}
      <ResultsHistoryModal
        isOpen={isResultsHistoryOpen}
        onClose={() => setIsResultsHistoryOpen(false)}
        results={quizResults}
        isHindi={isHindi}
      />
    </div>
  );
}
