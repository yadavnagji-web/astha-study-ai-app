export type ClassLevel = 'Class 6' | 'Class 7' | 'Class 8' | 'Class 9' | 'Class 10';

export type Subject = 'Science' | 'Social Science' | 'Mathematics' | 'Hindi' | 'English' | 'Sanskrit';

export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'fill_blanks'
  | 'one_word'
  | 'short_answer'
  | 'long_answer';

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  questionNumber: number;
  question: string;
  options?: string[]; // For MCQ: 4 options
  correctAnswer: string;
  explanation: string;
  sourceReference?: string; // Chapter quote or reference
}

export interface QuestionQuantities {
  mcq: number;
  true_false: number;
  fill_blanks: number;
  one_word: number;
  short_answer: number;
  long_answer: number;
}

export interface Chapter {
  id: string;
  title: string;
  classLevel: ClassLevel;
  subject: Subject;
  language: 'Hindi' | 'English' | 'Bilingual';
  uploadedAt: string;
  originalText: string;
  hindiTranslation?: string;
  englishTranslation?: string;
  shortNotesHindi?: string;
  shortNotesEnglish?: string;
  questions?: GeneratedQuestion[];
  isSample?: boolean;
}

export interface QuizAnswer {
  questionId: string;
  questionNumber: number;
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
}

export interface QuizResult {
  id: string;
  chapterId: string;
  chapterTitle: string;
  timestamp: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  scorePercentage: number;
  timeTakenSeconds: number;
  performanceGrade: 'excellent' | 'very_good' | 'good' | 'keep_practicing' | 'study_again';
  answers: QuizAnswer[];
}

export type AIProviderId =
  | 'groq'
  | 'gemini'
  | 'openai'
  | 'deepseek'
  | 'mistral'
  | 'openrouter'
  | 'anthropic'
  | 'together'
  | 'perplexity'
  | 'xai'
  | 'cerebras';

export interface ProviderMeta {
  id: AIProviderId;
  name: string;
  defaultModel: string;
  website: string;
  keyUrl: string;
  description: string;
  priority: number;
  isActive: boolean;
  hasKey: boolean;
  maskedKey?: string;
}

export interface ProviderUsage {
  requests: number;
  success: number;
  errors: number;
  rateLimit429: number;
  estimatedTokens: number;
}

export interface KeyItem {
  id: string;
  provider: AIProviderId;
  maskedKey: string;
  isActive: boolean;
  addedAt: string;
  lastUsedAt?: string;
  failureCount: number;
}

export interface AdminStats {
  todayUsage: Record<string, ProviderUsage>;
  currentActiveProvider: string;
  lastUsedProvider: string;
  lastError: string | null;
  lastSuccessfulRequest: string | null;
  keys: KeyItem[];
  providersMeta: ProviderMeta[];
  familyShareToken?: string;
  geminiAccountStatus: {
    googleAccount: string;
    apiKeyStatus: 'Configured' | 'Missing';
    apiAccessStatus: 'Connected' | 'Error' | 'Pending Verification';
    lastSuccessfulRequest: string | null;
    quotaStatus: string;
  };
  providersConfig: Record<string, {
    isActive: boolean;
    priority: number;
    availableKeysCount: number;
  }>;
}

export interface PromptTemplates {
  translation: string;
  summary: string;
  mcq: string;
  true_false: string;
  fill_blanks: string;
  short_answer: string;
  long_answer: string;
}
