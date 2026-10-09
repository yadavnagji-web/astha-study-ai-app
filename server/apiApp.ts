import express from 'express';
import dotenv from 'dotenv';
import { aiProviderManager } from './aiService.ts';
import { extractPDFText } from './pdfService.ts';

dotenv.config();

const app = express();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Nagji@012';

// 1. Cross-Origin (CORS) & Security Headers for Vercel & Preview iFrames
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-astha-keys');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 2. Large Body Parsers (60MB for textbooks & scanned images)
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    return next();
  }
  express.json({ limit: '60mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    return next();
  }
  express.urlencoded({ extended: true, limit: '60mb' })(req, res, next);
});

// 3. Client-Side API Keys Auto-Sync Middleware (syncs localStorage keys to Vercel runtime)
app.use((req, res, next) => {
  const customKeysHeader = req.headers['x-astha-keys'];
  if (customKeysHeader && typeof customKeysHeader === 'string') {
    try {
      const parsed = JSON.parse(customKeysHeader);
      if (Array.isArray(parsed) && parsed.length > 0) {
        aiProviderManager.syncClientKeys(parsed);
      }
    } catch {
      // Ignore malformed key headers
    }
  }
  next();
});

// Prompt templates (Customizable by admin, with permanent Source Lock)
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

// Router containing all API business logic
const apiRouter = express.Router();

// --- Health Check ---
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Astha Study AI',
    timestamp: new Date().toISOString(),
  });
});

// --- PDF Extraction ---
apiRouter.post('/pdf/extract', async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: 'Missing base64 PDF data' });
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

// --- Image / Vision OCR ---
apiRouter.post('/ai/ocr', async (req, res) => {
  try {
    const { base64, mimeType } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: 'Missing base64 image data' });
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

// --- Chapter Translation ---
apiRouter.post('/ai/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Chapter text is required' });
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

// --- Short Chapter Summary ---
apiRouter.post('/ai/summary', async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Chapter text is required' });
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

// --- Question Generator ---
apiRouter.post('/ai/questions', async (req, res) => {
  try {
    const { text, quantities, language } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Chapter text is required' });
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
  "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"],
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

// --- Admin Authentication ---
apiRouter.post('/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-authorized-session' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid admin password' });
  }
});

// --- Admin Status ---
apiRouter.get('/admin/status', (req, res) => {
  const stats = aiProviderManager.getAdminStats();
  res.json({
    success: true,
    stats,
  });
});

// --- Admin Keys Management ---
apiRouter.post('/admin/keys', (req, res) => {
  const { action, provider, key, id } = req.body;

  if (action === 'add') {
    if (!provider || !key) {
      return res.status(400).json({ success: false, error: 'Provider and key are required' });
    }
    const result = aiProviderManager.addKey(provider, key);
    const stats = aiProviderManager.getAdminStats();
    return res.json({ success: true, result, stats });
  }

  if (action === 'toggle') {
    if (!id) return res.status(400).json({ success: false, error: 'Key id required' });
    const ok = aiProviderManager.toggleKey(id);
    const stats = aiProviderManager.getAdminStats();
    return res.json({ success: ok, stats });
  }

  if (action === 'delete') {
    if (!id) return res.status(400).json({ success: false, error: 'Key id required' });
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
    return res.status(400).json({ success: false, error: 'Entries array required' });
  }

  res.status(400).json({ success: false, error: 'Unknown action' });
});

// --- Admin Client Key Sync ---
apiRouter.post('/admin/sync-keys', (req, res) => {
  const { keys } = req.body;
  if (Array.isArray(keys) && keys.length > 0) {
    aiProviderManager.syncClientKeys(keys);
  }
  const stats = aiProviderManager.getAdminStats();
  res.json({ success: true, stats });
});

// --- Admin Test Provider ---
apiRouter.post('/admin/test-provider', async (req, res) => {
  const { provider, key } = req.body;
  const result = await aiProviderManager.testProvider(provider, key);
  res.json(result);
});

// --- Admin Family Bundle ---
apiRouter.post('/admin/family-bundle', (req, res) => {
  const { action, bundle } = req.body;
  if (action === 'export') {
    return res.json({ success: true, bundle: aiProviderManager.generateFamilyShareBundle() });
  }
  if (action === 'import') {
    if (!bundle) return res.status(400).json({ success: false, error: 'Bundle string required' });
    const result = aiProviderManager.importFamilyShareBundle(bundle);
    return res.json(result);
  }
  res.status(400).json({ success: false, error: 'Unknown action' });
});

// --- Admin Verify Gemini ---
apiRouter.post('/admin/verify-gemini', async (req, res) => {
  const result = await aiProviderManager.testProvider('gemini');
  res.json(result);
});

// --- Admin Prompts ---
apiRouter.get('/admin/prompts', (req, res) => {
  res.json({
    success: true,
    prompts: promptTemplates,
    sourceLockNotice: 'CRITICAL: "Use only uploaded chapter content" rule is permanently enforced by system kernel and cannot be bypassed.',
  });
});

apiRouter.post('/admin/prompts', (req, res) => {
  const { prompts } = req.body;
  if (prompts && typeof prompts === 'object') {
    promptTemplates = { ...promptTemplates, ...prompts };
    return res.json({ success: true, message: 'Prompts updated successfully' });
  }
  res.status(400).json({ success: false, error: 'Invalid prompts data' });
});

// Dual mounting: Both '/api' and '/' match regardless of Vercel rewrites!
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler guaranteeing JSON output
app.use((err: any, req: any, res: any, next: any) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Internal server error',
  });
});

export default app;
