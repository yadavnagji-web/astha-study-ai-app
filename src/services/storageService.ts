import { Chapter, QuizResult, ClassLevel } from '../types';

const CHAPTERS_KEY = 'astha_study_chapters_v1';
const RESULTS_KEY = 'astha_study_results_v1';
const PREFS_KEY = 'astha_study_prefs_v1';

export interface UserPrefs {
  classLevel: ClassLevel;
  language: 'Hindi' | 'English';
}

export const storageService = {
  getChapters(): Chapter[] {
    try {
      const data = localStorage.getItem(CHAPTERS_KEY);
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  },

  saveChapter(chapter: Chapter): void {
    const list = this.getChapters();
    const existingIndex = list.findIndex((c) => c.id === chapter.id);
    if (existingIndex >= 0) {
      list[existingIndex] = chapter;
    } else {
      list.unshift(chapter);
    }
    localStorage.setItem(CHAPTERS_KEY, JSON.stringify(list));
  },

  getChapterById(id: string): Chapter | undefined {
    const list = this.getChapters();
    return list.find((c) => c.id === id);
  },

  deleteChapter(id: string): void {
    const list = this.getChapters().filter((c) => c.id !== id);
    localStorage.setItem(CHAPTERS_KEY, JSON.stringify(list));
  },

  updateChapterTitle(id: string, newTitle: string): void {
    const chapter = this.getChapterById(id);
    if (chapter) {
      chapter.title = newTitle;
      this.saveChapter(chapter);
    }
  },

  getResults(): QuizResult[] {
    try {
      const data = localStorage.getItem(RESULTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveResult(result: QuizResult): void {
    const results = this.getResults();
    results.unshift(result);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results.slice(0, 50)));
  },

  getPrefs(): UserPrefs {
    try {
      const data = localStorage.getItem(PREFS_KEY);
      return data ? JSON.parse(data) : { classLevel: 'Class 6', language: 'Hindi' };
    } catch {
      return { classLevel: 'Class 6', language: 'Hindi' };
    }
  },

  savePrefs(prefs: Partial<UserPrefs>): void {
    const current = this.getPrefs();
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
  },
};
