import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiProviderManager } from './server/aiService.js';
import { extractPDFText } from './server/pdfService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Nagji@012';

// Middleware for large payload (scanned books, PDFs, images)
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Client-Side API Keys Auto-Sync Middleware (guarantees Vercel serverless instances have all keys)
app.use((req, res, next) => {
  const customKeysHeader = req.headers['x-astha-keys'];
  if (customKeysHeader && typeof customKeysHeader === 'string') {
    try {
      const parsed = JSON.parse(customKeysHeader);
      if (Array.isArray(parsed) && parsed.length > 0) {
        aiProviderManager.syncClientKeys(parsed);
      }
    } catch {
      // Ignore malformed client key headers
    }
  }
  next();
});

// Global prompt templates (can be customized by admin, but Source Lock is always prepended)
let promptTemplates = {
  translation: `Translate the following chapter text accurately into {LANGUAGE}.
Preserve educational terminology, heading structures, bullet points, and exact scientific / historical definitions.
Do not add any external explanations.`,
  summary: `Create a concise but complete version of ONLY the supplied chapter text.
Do not use outside knowledge.
Do not omit any important concept, definition, fact, example, formula, name, date, or explanation that is necessary to understand the chapter.
Do not invent anything.
Use simple Class 6 level language that Indian school students can easily understand.
Organize with clear subheadings and bullet points.`,
  mcq: `Generate {QUANTITY} Multiple Choice Questions (MCQs) strictly from the provided chapter text.
Each MCQ must have 4 clear options (A, B, C, D) and exactly 1 correct answer.
Options must be plausible and derived only from the chapter facts.
Provide the correct answer and a brief explanation citing the chapter fact.`,
  true_false: `Generate {QUANTITY} True/False questions strictly from the chapter.
State clearly whether each statement is True or False based ONLY on the text.
Provide explanation with chapter reference.`,
  fill_blanks: `Generate {QUANTITY} Fill in the Blanks questions strictly based on the text.
Use '_____' for the blank.
Provide the exact missing word/phrase as the answer.`,
  one_word: `Generate {QUANTITY} One Word / Very Short questions strictly based on the text.
Answer must be a single word or short phrase from the text.`,
  short_answer: `Generate {QUANTITY} Short Answer questions (2-3 sentences each) strictly based on the chapter.
Provide model answer using only chapter content.`,
  long_answer: `Generate {QUANTITY} Long Answer / Conceptual questions (4-6 sentences or step-by-step points) strictly based on the chapter.
Provide model answer using only chapter content.`,
};

// --- API Endpoints ---

// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Astha Study AI',
    timestamp: new Date().toISOString(),
  });
});

// PDF Extraction (Selectable Text or Scanned detection)
app.post('/api/pdf/extract', async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'Missing base64 PDF data' });
    }

    const cleanBase64 = base64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const result = await extractPDFText(buffer);

    res.json({
      success: true,
      text: result.text,
      pageCount: result.pageCount,
      hasSelectableText: result.hasSelectableText,
      charCount: result.charCount,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to extract text from PDF',
    });
  }
});

// Image / Page OCR
app.post('/api/ai/ocr', async (req, res) => {
  try {
    const { base64, mimeType } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'Missing base64 image data' });
    }

    const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
    const text = await aiProviderManager.executeVisionOCR(cleanBase64, mimeType || 'image/jpeg');

    res.json({
      success: true,
      text,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'OCR processing failed. Check API key settings.',
    });
  }
});

// Chapter Translation (Hindi / English)
app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Chapter text is required' });
    }

    const lang = targetLanguage === 'Hindi' ? 'Hindi (सरल और स्पष्ट हिंदी)' : 'English';
    const systemPrompt = promptTemplates.translation.replace('{LANGUAGE}', lang);

    const userPrompt = `Translate the following chapter text into ${lang}.
Preserve all concepts, terms, definitions, and formatting accurately.

CHAPTER CONTENT:
${text}`;

    const translatedText = await aiProviderManager.executeChatPrompt(systemPrompt, userPrompt);

    res.json({
      success: true,
      translatedText,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Translation failed',
    });
  }
});

// Concise Short Chapter Summary
app.post('/api/ai/summary', async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Chapter text is required' });
    }

    const langText = language === 'Hindi' ? 'Hindi (हिन्दी)' : 'English';
    const systemPrompt = promptTemplates.summary;

    const userPrompt = `Please write a comprehensive yet concise Short Notes version of this chapter in ${langText}.
Language level: Suitable for Class 6 student.
IMPORTANT SOURCE LOCK:
- Keep ALL main concepts, definitions, scientific laws/formulas, historical events, dates, and examples.
- Do NOT remove key facts.
- Do NOT add any outside facts.
- Use clear bullet points and bold keywords.

CHAPTER TEXT:
${text}`;

    const summaryText = await aiProviderManager.executeChatPrompt(systemPrompt, userPrompt);

    res.json({
      success: true,
      summaryText,
      originalLength: text.length,
      summaryLength: summaryText.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to generate chapter summary',
    });
  }
});

// Question Generator (Strict Source Lock + JSON output)
app.post('/api/ai/questions', async (req, res) => {
  try {
    const { text, quantities, language } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Chapter text is required' });
    }

    const q = quantities || {
      mcq: 10,
      true_false: 5,
      fill_blanks: 5,
      one_word: 5,
      short_answer: 5,
      long_answer: 3,
    };

    const rawLang = String(language || '').trim().toLowerCase();
    const isEnglishTarget = rawLang.includes('eng');
    const isHinglishTarget = rawLang.includes('hing');
    const targetLangName = isHinglishTarget ? 'Hinglish' : (isEnglishTarget ? 'English' : 'Hindi');

    const langInstruction = isEnglishTarget
      ? `CRITICAL MANDATORY INSTRUCTION: You MUST write 100% of the questions, all 4 options (A, B, C, D), correct answers, and explanations in ENGLISH LANGUAGE ONLY. Even if the source chapter is written in Hindi or Sanskrit, formulate all questions in fluent, simple English for Class 6 students. Absolutely ZERO Hindi/Devanagari characters are allowed in the JSON output.`
      : (isHinglishTarget
        ? `CRITICAL MANDATORY INSTRUCTION: Generate questions and options in accessible Hinglish (Roman script Hindi + English keywords) suitable for Indian students.`
        : `CRITICAL MANDATORY INSTRUCTION: You MUST write 100% of the questions, all 4 options (A, B, C, D), correct answers, and explanations in HINDI (हिन्दी) ONLY. Even if the source chapter is written in English, translate all questions and answers into pure Hindi.`);

    const systemPrompt = `You are an expert Indian school question creator for Class 6-10 NCERT/CBSE curriculum.
MANDATORY RULES:
1. ${langInstruction}
2. ABSOLUTE STRICT SOURCE LOCK: Every single question and answer MUST be 100% answerable directly and exclusively from the provided uploaded chapter/image text.
3. NEVER introduce outside knowledge, extra trivia, external facts, or assumed definitions.
4. If the uploaded text does not contain a fact, DO NOT generate a question about it.
5. Balanced coverage across the entire text without duplicating questions.
6. In "sourceReference", quote the exact verbatim line/sentence from the text that proves the answer.
7. Output MUST be valid JSON with key "questions" containing a list of question objects.
Each question object MUST follow this schema:
{
  "id": "q1",
  "type": "mcq" | "true_false" | "fill_blanks" | "one_word" | "short_answer" | "long_answer",
  "questionNumber": 1,
  "question": "question text strictly in ${targetLangName}",
  "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"], // only for mcq
  "correctAnswer": "exact correct answer strictly in ${targetLangName}",
  "explanation": "short explanation citing the chapter fact strictly in ${targetLangName}",
  "sourceReference": "exact quote or sentence from the chapter"
}`;

    const userPrompt = `[CHAPTER TEXT EXTRACT (ONLY SOURCE OF TRUTH)]:
${text}

============================================================
FINAL COMMAND:
TARGET LANGUAGE FOR ALL QUESTIONS & ANSWERS: >>> ${targetLangName.toUpperCase()} <<<
You MUST write all questions, options, and explanations in ${targetLangName}. Do NOT use any other language.

Questions to generate:
- MCQ: ${q.mcq} questions
- True / False: ${q.true_false} questions
- Fill in the Blanks: ${q.fill_blanks} questions
- One Word Answer: ${q.one_word} questions
- Short Answer: ${q.short_answer} questions
- Long Answer: ${q.long_answer} questions

Respond strictly with valid JSON conforming to the requested schema.`;

    const rawResponse = await aiProviderManager.executeChatPrompt(systemPrompt, userPrompt, {
      jsonMode: true,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      // In case wrapped in markdown code blocks
      const clean = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    }

    const questionsList = parsed.questions || parsed.data || (Array.isArray(parsed) ? parsed : []);

    res.json({
      success: true,
      questions: questionsList,
    });
  } catch (err: any) {
    const friendlyError = 'सर्वर पर अभी अधिक लोड है। कृपया कुछ क्षण बाद पुनः प्रयास करें या व्यवस्थापक पैनल में API Key की जाँच करें।';
    res.status(500).json({
      success: false,
      error: friendlyError,
      technicalError: err?.message,
    });
  }
});

// ⚡ All-in-One Automatic Chapter Processing Endpoint
app.post('/api/ai/auto-process', async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Chapter text is required' });
    }

    const sourceText = text.trim();
    const isHindi = language === 'Hindi';

    // 1. Translation
    let hindiTranslation = isHindi ? sourceText : '';
    let englishTranslation = !isHindi ? sourceText : '';
    try {
      const transPrompt = isHindi
        ? `Translate the following Hindi chapter text into clear educational English. Preserve educational terminology, headings, and structure. Do not add external facts:\n\n${sourceText}`
        : `Translate the following English chapter text into clear educational Hindi (हिन्दी). Preserve educational terminology, headings, and structure. Do not add external facts:\n\n${sourceText}`;
      const trans = await aiProviderManager.executeChatPrompt(promptTemplates.translation, transPrompt);
      if (isHindi) {
        englishTranslation = trans;
      } else {
        hindiTranslation = trans;
      }
    } catch (e: any) {
      console.warn('Auto-translate notice:', e.message);
    }

    // 2. Short Notes (Hindi)
    let shortNotesHindi = '';
    try {
      const promptH = `Please write comprehensive yet concise Short Notes of this chapter in Hindi (हिन्दी).
Class level: 6-10 Indian school. Bullet points with bold terms and clear definitions. Strict source lock.\n\nCHAPTER TEXT:\n${sourceText}`;
      shortNotesHindi = await aiProviderManager.executeChatPrompt(promptTemplates.summary, promptH);
    } catch (e: any) {
      console.warn('Auto-notes Hindi notice:', e.message);
    }

    // 3. Short Notes (English)
    let shortNotesEnglish = '';
    try {
      const promptE = `Please write comprehensive yet concise Short Notes of this chapter in English.
Class level: 6-10 Indian school. Bullet points with bold terms and clear definitions. Strict source lock.\n\nCHAPTER TEXT:\n${sourceText}`;
      shortNotesEnglish = await aiProviderManager.executeChatPrompt(promptTemplates.summary, promptE);
    } catch (e: any) {
      console.warn('Auto-notes English notice:', e.message);
    }

    // 4. Question Bank
    let questions: any[] = [];
    try {
      const workingLang = isHindi ? 'Hindi' : 'English';
      const qSystemPrompt = `You are an expert school question creator.
Generate 10 MCQs, 5 True/False, 5 Fill in the Blanks, 5 One-Word, and 5 Short Answer questions strictly from the chapter in ${workingLang}.
Output valid JSON only with schema:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "questionNumber": 1,
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "...",
      "explanation": "...",
      "sourceReference": "..."
    }
  ]
}`;
      const qResp = await aiProviderManager.executeChatPrompt(
        qSystemPrompt,
        `CHAPTER TEXT:\n${sourceText}\n\nGenerate all questions now strictly from this text.`,
        { jsonMode: true }
      );
      try {
        const parsed = JSON.parse(qResp.replace(/```json/g, '').replace(/```/g, '').trim());
        if (Array.isArray(parsed.questions)) {
          questions = parsed.questions;
        }
      } catch {}
    } catch (e: any) {
      console.warn('Auto-questions notice:', e.message);
    }

    res.json({
      success: true,
      hindiTranslation,
      englishTranslation,
      shortNotesHindi,
      shortNotesEnglish,
      questions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Auto process failed' });
  }
});

// Admin Authentication
app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-authorized-session' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid admin password' });
  }
});

// Admin Status & Usage Dashboard
app.get('/api/admin/status', (req, res) => {
  const stats = aiProviderManager.getAdminStats();
  res.json({
    success: true,
    stats,
  });
});

// Admin Key Management
app.post('/api/admin/keys', (req, res) => {
  const { action, provider, key, id } = req.body;

  if (action === 'add') {
    if (!provider || !key) {
      return res.status(400).json({ error: 'Provider and key are required' });
    }
    const result = aiProviderManager.addKey(provider, key);
    const stats = aiProviderManager.getAdminStats();
    return res.json({ success: true, result, stats });
  }

  if (action === 'toggle') {
    if (!id) return res.status(400).json({ error: 'Key id required' });
    const ok = aiProviderManager.toggleKey(id);
    const stats = aiProviderManager.getAdminStats();
    return res.json({ success: ok, stats });
  }

  if (action === 'delete') {
    if (!id) return res.status(400).json({ error: 'Key id required' });
    const ok = aiProviderManager.deleteKey(id);
    const stats = aiProviderManager.getAdminStats();
    return res.json({ success: ok, stats });
  }

  if (action === 'bulk') {
    const { entries } = req.body;
    if (Array.isArray(entries)) {
      const count = aiProviderManager.addKeysBulk(entries);
      const stats = aiProviderManager.getAdminStats();
      return res.json({ success: true, count, stats });
    }
    return res.status(400).json({ error: 'Entries array required' });
  }

  res.status(400).json({ error: 'Unknown action' });
});

// Admin Client Key Synchronization (for Vercel serverless persistence)
app.post('/api/admin/sync-keys', (req, res) => {
  const { keys } = req.body;
  if (Array.isArray(keys) && keys.length > 0) {
    aiProviderManager.syncClientKeys(keys);
  }
  const stats = aiProviderManager.getAdminStats();
  res.json({ success: true, stats });
});

// Admin Test Provider Connection (for any of 10+ companies, with optional candidate key)
app.post('/api/admin/test-provider', async (req, res) => {
  const { provider, key } = req.body;
  const result = await aiProviderManager.testProvider(provider, key);
  res.json(result);
});

// Admin Family Bundle Export & Import (ensures API keys are never deleted when sharing)
app.post('/api/admin/family-bundle', (req, res) => {
  const { action, bundle } = req.body;
  if (action === 'export') {
    return res.json({ success: true, bundle: aiProviderManager.generateFamilyShareBundle() });
  }
  if (action === 'import') {
    if (!bundle) return res.status(400).json({ error: 'Bundle string required' });
    const result = aiProviderManager.importFamilyShareBundle(bundle);
    return res.json(result);
  }
  res.status(400).json({ error: 'Unknown action' });
});

// Admin Verify Gemini API Connection (legacy backwards compatibility)
app.post('/api/admin/verify-gemini', async (req, res) => {
  const result = await aiProviderManager.testProvider('gemini');
  res.json(result);
});

// Admin Prompts Management
app.get('/api/admin/prompts', (req, res) => {
  res.json({
    success: true,
    prompts: promptTemplates,
    sourceLockNotice: 'CRITICAL: "Use only uploaded chapter content" rule is permanently enforced by system kernel and cannot be bypassed.',
  });
});

app.post('/api/admin/prompts', (req, res) => {
  const { prompts } = req.body;
  if (prompts && typeof prompts === 'object') {
    promptTemplates = { ...promptTemplates, ...prompts };
    return res.json({ success: true, message: 'Prompts updated successfully' });
  }
  res.status(400).json({ error: 'Invalid prompts data' });
});

// --- Vite Integration & Production Serving ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Astha Study AI Server listening on port ${PORT} [Mode: ${isProduction ? 'prod' : 'dev'}]`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal Server error:', err);
  });
}

export default app;
