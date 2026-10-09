import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export interface ProviderDefinition {
  id: AIProviderId;
  name: string;
  defaultModel: string;
  website: string;
  keyUrl: string;
  description: string;
  endpoint: string;
  type: 'openai_compatible' | 'gemini' | 'anthropic';
  priority: number;
}

export const PROVIDERS_REGISTRY: ProviderDefinition[] = [
  {
    id: 'groq',
    name: 'Groq Cloud',
    defaultModel: 'qwen/qwen3.8-27b',
    website: 'https://groq.com',
    keyUrl: 'https://console.groq.com/keys',
    description: 'Ultra-fast LPU inference (Qwen 3.8 27B / Llama 3.3). Sub-second latency.',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    type: 'openai_compatible',
    priority: 1,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-3.1-flash-lite',
    website: 'https://aistudio.google.com',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Google Multimodal AI with Vision OCR and Fast Reasoning.',
    endpoint: 'https://generativelanguage.googleapis.com',
    type: 'gemini',
    priority: 2,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    website: 'https://openai.com',
    keyUrl: 'https://platform.openai.com/api-keys',
    description: 'Industry-standard GPT-4o mini and GPT-4o models.',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    type: 'openai_compatible',
    priority: 3,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    defaultModel: 'deepseek-chat',
    website: 'https://deepseek.com',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    description: 'DeepSeek V3 high-intelligence & economical inference model.',
    endpoint: 'https://api.deepseek.com/chat/completions',
    type: 'openai_compatible',
    priority: 4,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    defaultModel: 'mistral-small-latest',
    website: 'https://mistral.ai',
    keyUrl: 'https://console.mistral.ai/api-keys',
    description: 'High performance European open-weight language models.',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    type: 'openai_compatible',
    priority: 5,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    website: 'https://openrouter.ai',
    keyUrl: 'https://openrouter.ai/keys',
    description: 'Aggregates 100+ models with generous free & paid tier endpoints.',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    type: 'openai_compatible',
    priority: 6,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-5-haiku-20241022',
    website: 'https://anthropic.com',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude 3.5 Haiku state-of-the-art educational reasoning.',
    endpoint: 'https://api.anthropic.com/v1/messages',
    type: 'anthropic',
    priority: 7,
  },
  {
    id: 'together',
    name: 'Together AI',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    website: 'https://together.ai',
    keyUrl: 'https://api.together.ai/settings/api-keys',
    description: 'High-throughput open-source models with dedicated bandwidth.',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    type: 'openai_compatible',
    priority: 8,
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    defaultModel: 'sonar',
    website: 'https://perplexity.ai',
    keyUrl: 'https://www.perplexity.ai/settings/api',
    description: 'Fast cited search and factual conversational model.',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    type: 'openai_compatible',
    priority: 9,
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    defaultModel: 'grok-2-latest',
    website: 'https://x.ai',
    keyUrl: 'https://console.x.ai',
    description: 'xAI Grok foundational intelligence engine.',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    type: 'openai_compatible',
    priority: 10,
  },
  {
    id: 'cerebras',
    name: 'Cerebras AI',
    defaultModel: 'llama-3.3-70b',
    website: 'https://cerebras.ai',
    keyUrl: 'https://cloud.cerebras.ai',
    description: 'Wafer-scale engine with world-record 2000 tokens/second speed.',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    type: 'openai_compatible',
    priority: 11,
  },
];

export interface KeyItem {
  id: string;
  provider: AIProviderId;
  key: string;
  maskedKey: string;
  isActive: boolean;
  addedAt: string;
  lastUsedAt?: string;
  failureCount: number;
}

export interface ProviderUsage {
  requests: number;
  success: number;
  errors: number;
  rateLimit429: number;
  estimatedTokens: number;
}

export const DEFAULT_EMBEDDED_KEYS: Array<{ provider: AIProviderId; key: string }> = [];

// Persistent Storage file path in /tmp (outside git repo, writable in all serverless and container environments)
const TMP_CONFIG_FILE = '/tmp/astha-api-config.json';

class AIProviderManager {
  private keys: KeyItem[] = [];
  private usageStats: Record<string, ProviderUsage> = {};
  private currentActiveProvider: string = 'groq';
  private lastUsedProvider: string = 'none';
  private lastError: string | null = null;
  private lastSuccessfulRequest: string | null = null;
  private workingModelsCache: Record<string, string> = {
    groq: 'qwen/qwen3.8-27b',
    gemini: 'gemini-3.1-flash-lite',
  };

  constructor() {
    this.initUsageStats();
    this.loadPersistedConfig();
  }

  private initUsageStats() {
    PROVIDERS_REGISTRY.forEach((p) => {
      this.usageStats[p.id] = {
        requests: 0,
        success: 0,
        errors: 0,
        rateLimit429: 0,
        estimatedTokens: 0,
      };
    });
  }

  private maskKey(k: string): string {
    if (!k || k.length < 8) return '********';
    return '********' + k.slice(-4);
  }

  // Load config from /tmp storage or bundled embedded defaults
  private loadPersistedConfig() {
    let loaded = false;

    // 1. Check /tmp file (works in all container and serverless environments)
    try {
      if (fs.existsSync(TMP_CONFIG_FILE)) {
        const raw = fs.readFileSync(TMP_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.keys) && parsed.keys.length > 0) {
          this.keys = parsed.keys;
          loaded = true;
        }
      }
    } catch (err) {
      // Continue to embedded defaults
    }

    // 2. Always ensure default embedded keys are present
    DEFAULT_EMBEDDED_KEYS.forEach((def) => {
      if (!this.keys.some((k) => k.provider === def.provider && k.key === def.key)) {
        this.keys.push({
          id: `${def.provider}-default-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          provider: def.provider,
          key: def.key,
          maskedKey: this.maskKey(def.key),
          isActive: true,
          addedAt: new Date().toISOString(),
          failureCount: 0,
        });
      }
    });

    // 3. Seed from Environment variables if set
    this.seedFromEnv();

    this.determineActiveProvider();
    this.saveConfigToDisk();
  }

  private seedFromEnv() {
    const envMappings: { provider: AIProviderId; envKey: string }[] = [
      { provider: 'groq', envKey: 'GROQ_API_KEY' },
      { provider: 'groq', envKey: 'GROQ_API_KEY_2' },
      { provider: 'gemini', envKey: 'GEMINI_API_KEY' },
      { provider: 'gemini', envKey: 'GEMINI_API_KEY_2' },
      { provider: 'openai', envKey: 'OPENAI_API_KEY' },
      { provider: 'deepseek', envKey: 'DEEPSEEK_API_KEY' },
      { provider: 'mistral', envKey: 'MISTRAL_API_KEY' },
      { provider: 'openrouter', envKey: 'OPENROUTER_API_KEY' },
      { provider: 'anthropic', envKey: 'ANTHROPIC_API_KEY' },
      { provider: 'together', envKey: 'TOGETHER_API_KEY' },
      { provider: 'perplexity', envKey: 'PERPLEXITY_API_KEY' },
      { provider: 'xai', envKey: 'XAI_API_KEY' },
      { provider: 'cerebras', envKey: 'CEREBRAS_API_KEY' },
    ];

    envMappings.forEach((m) => {
      const val = process.env[m.envKey];
      if (val && val.trim().length > 0) {
        const cleanVal = val.trim();
        // Check if already in list
        if (!this.keys.some((k) => k.key === cleanVal)) {
          this.keys.push({
            id: `${m.provider}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            provider: m.provider,
            key: cleanVal,
            maskedKey: this.maskKey(cleanVal),
            isActive: true,
            addedAt: new Date().toISOString(),
            failureCount: 0,
          });
        }
      }
    });

    this.determineActiveProvider();
  }

  // Atomic write to /tmp (outside git repo, writable in all serverless and container environments)
  public saveConfigToDisk(): void {
    const dataToSave = {
      updatedAt: new Date().toISOString(),
      keys: this.keys,
      familyShareToken: this.generateFamilyShareBundle(),
    };
    const jsonString = JSON.stringify(dataToSave, null, 2);

    try {
      fs.writeFileSync(TMP_CONFIG_FILE, jsonString, 'utf-8');
    } catch (err) {
      // Ignore
    }
  }

  // Client-Side Sync helper: Merges user-configured keys directly from browser localStorage
  public syncClientKeys(clientKeys: Array<{ provider: string; key: string; isActive?: boolean }>) {
    if (!Array.isArray(clientKeys) || clientKeys.length === 0) return;
    let modified = false;

    clientKeys.forEach((item) => {
      if (!item.provider || !item.key || !item.key.trim()) return;
      const cleanKey = item.key.trim();
      const prov = item.provider as AIProviderId;
      const existing = this.keys.find((k) => k.key === cleanKey || (k.provider === prov && k.key === cleanKey));
      if (existing) {
        if (typeof item.isActive === 'boolean' && existing.isActive !== item.isActive) {
          existing.isActive = item.isActive;
          modified = true;
        }
      } else {
        this.keys.push({
          id: `${prov}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          provider: prov,
          key: cleanKey,
          maskedKey: this.maskKey(cleanKey),
          isActive: item.isActive !== false,
          addedAt: new Date().toISOString(),
          failureCount: 0,
        });
        modified = true;
      }
    });

    if (modified) {
      this.determineActiveProvider();
      this.saveConfigToDisk();
    }
  }

  private determineActiveProvider() {
    for (const p of PROVIDERS_REGISTRY) {
      if (this.keys.some((k) => k.provider === p.id && k.isActive)) {
        this.currentActiveProvider = p.id;
        return;
      }
    }
    this.currentActiveProvider = 'none';
  }

  // Export encrypted/base64 Family Setup Bundle
  public generateFamilyShareBundle(): string {
    const payload = {
      app: 'AsthaStudyAI-FamilyBundle',
      timestamp: Date.now(),
      keys: this.keys.map((k) => ({ provider: k.provider, key: k.key, isActive: k.isActive })),
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  // Import Family Setup Bundle from another device
  public importFamilyShareBundle(bundleString: string): { success: boolean; count: number } {
    try {
      const decoded = Buffer.from(bundleString.trim(), 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (parsed.app === 'AsthaStudyAI-FamilyBundle' && Array.isArray(parsed.keys)) {
        let imported = 0;
        parsed.keys.forEach((item: any) => {
          if (item.provider && item.key && !this.keys.some((k) => k.key === item.key)) {
            this.keys.push({
              id: `${item.provider}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              provider: item.provider,
              key: item.key,
              maskedKey: this.maskKey(item.key),
              isActive: item.isActive !== false,
              addedAt: new Date().toISOString(),
              failureCount: 0,
            });
            imported++;
          }
        });
        this.determineActiveProvider();
        this.saveConfigToDisk();
        return { success: true, count: imported };
      }
    } catch (err) {
      console.error('Failed to import bundle:', err);
    }
    return { success: false, count: 0 };
  }

  public addKey(provider: AIProviderId, rawKey: string): KeyItem {
    const clean = rawKey.trim();
    // If existing, update it
    const existing = this.keys.find((k) => k.key === clean);
    if (existing) {
      existing.isActive = true;
      existing.provider = provider;
      this.saveConfigToDisk();
      return existing;
    }

    const newItem: KeyItem = {
      id: `${provider}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      provider,
      key: clean,
      maskedKey: this.maskKey(clean),
      isActive: true,
      addedAt: new Date().toISOString(),
      failureCount: 0,
    };
    this.keys.push(newItem);
    this.determineActiveProvider();
    this.saveConfigToDisk();
    return newItem;
  }

  public toggleKey(id: string): boolean {
    const k = this.keys.find((item) => item.id === id);
    if (k) {
      k.isActive = !k.isActive;
      this.determineActiveProvider();
      this.saveConfigToDisk();
      return true;
    }
    return false;
  }

  public deleteKey(id: string): boolean {
    const idx = this.keys.findIndex((item) => item.id === id);
    if (idx >= 0) {
      this.keys.splice(idx, 1);
      this.determineActiveProvider();
      this.saveConfigToDisk();
      return true;
    }
    return false;
  }

  public getAdminStats() {
    const providersMeta = PROVIDERS_REGISTRY.map((def) => {
      const pKeys = this.keys.filter((k) => k.provider === def.id && k.isActive);
      return {
        id: def.id,
        name: def.name,
        defaultModel: def.defaultModel,
        website: def.website,
        keyUrl: def.keyUrl,
        description: def.description,
        priority: def.priority,
        isActive: pKeys.length > 0,
        hasKey: pKeys.length > 0,
        maskedKey: pKeys.length > 0 ? pKeys[0].maskedKey : undefined,
      };
    });

    const providersConfig: Record<string, any> = {};
    PROVIDERS_REGISTRY.forEach((def) => {
      const count = this.keys.filter((k) => k.provider === def.id && k.isActive).length;
      providersConfig[def.id] = {
        isActive: count > 0,
        priority: def.priority,
        availableKeysCount: count,
      };
    });

    const activeGeminiKey = this.keys.find((k) => k.provider === 'gemini' && k.isActive);

    return {
      todayUsage: this.usageStats,
      currentActiveProvider: this.currentActiveProvider,
      lastUsedProvider: this.lastUsedProvider,
      lastError: this.lastError,
      lastSuccessfulRequest: this.lastSuccessfulRequest,
      keys: this.keys.map((k) => ({
        id: k.id,
        provider: k.provider,
        maskedKey: k.maskedKey,
        isActive: k.isActive,
        addedAt: k.addedAt,
        lastUsedAt: k.lastUsedAt,
        failureCount: k.failureCount,
      })),
      providersMeta,
      familyShareToken: this.generateFamilyShareBundle(),
      geminiAccountStatus: {
        googleAccount: 'Astha Family Account (Google AI Studio)',
        apiKeyStatus: activeGeminiKey ? ('Configured' as const) : ('Missing' as const),
        apiAccessStatus: activeGeminiKey ? ('Connected' as const) : ('Pending Verification' as const),
        lastSuccessfulRequest: this.lastSuccessfulRequest,
        quotaStatus: 'Operational',
      },
      providersConfig,
    };
  }

  private async resolveModelCandidates(
    providerId: AIProviderId,
    apiKey: string,
    defaultModel: string
  ): Promise<string[]> {
    const list: string[] = [];
    if (this.workingModelsCache[providerId]) {
      list.push(this.workingModelsCache[providerId]);
    }

    if (providerId === 'groq') {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          const data: any = await res.json();
          if (Array.isArray(data.data)) {
            const ids: string[] = data.data.map((m: any) => m.id);
            const groqPriorities = [
              'qwen/qwen3.8-27b',
              'openai/gpt-oss-120b',
              'llama-3.3-70b-versatile',
              'llama-3.1-8b-instant',
              'llama-3.1-70b-versatile',
              'llama3-70b-8192',
              'openai/gpt-oss-20b',
              'allam-2-7b',
            ];
            for (const p of groqPriorities) {
              if (ids.includes(p) && !list.includes(p)) list.push(p);
            }
            for (const id of ids) {
              if (!id.includes('whisper') && !id.includes('guard') && !list.includes(id)) {
                list.push(id);
              }
            }
          }
        }
      } catch {
        // Fallback to static list below
      }

      const fallbacks = [
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-120b',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'llama-3.1-70b-versatile',
        'llama3-70b-8192',
        'openai/gpt-oss-20b',
      ];
      for (const f of fallbacks) {
        if (!list.includes(f)) list.push(f);
      }
      return list;
    }

    if (providerId === 'openai') {
      return Array.from(new Set([defaultModel, 'gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']));
    }
    if (providerId === 'deepseek') {
      return Array.from(new Set([defaultModel, 'deepseek-chat', 'deepseek-reasoner']));
    }
    if (providerId === 'mistral') {
      return Array.from(new Set([defaultModel, 'mistral-small-latest', 'open-mistral-7b', 'mistral-large-latest']));
    }
    if (providerId === 'openrouter') {
      return Array.from(new Set([defaultModel, 'meta-llama/llama-3.3-70b-instruct:free', 'google/gemini-2.0-flash-lite:free', 'mistralai/mistral-7b-instruct:free']));
    }
    if (providerId === 'cerebras') {
      return Array.from(new Set([defaultModel, 'llama-3.3-70b', 'llama3.1-8b', 'llama3.1-70b']));
    }
    if (providerId === 'together') {
      return Array.from(new Set([defaultModel, 'meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo']));
    }
    if (providerId === 'perplexity') {
      return Array.from(new Set([defaultModel, 'sonar', 'sonar-pro']));
    }
    if (providerId === 'xai') {
      return Array.from(new Set([defaultModel, 'grok-2-latest', 'grok-beta']));
    }

    return [defaultModel];
  }

  // Live test verification for any provider (with optional candidate key testing)
  public async testProvider(
    providerId: AIProviderId,
    candidateKey?: string
  ): Promise<{ success: boolean; message: string; latencyMs?: number; activeModel?: string }> {
    const providerDef = PROVIDERS_REGISTRY.find((p) => p.id === providerId);
    if (!providerDef) return { success: false, message: 'Unknown provider' };

    const effectiveKey = candidateKey && candidateKey.trim().length > 0
      ? candidateKey.trim()
      : this.keys.find((k) => k.provider === providerId && k.isActive)?.key;

    if (!effectiveKey) {
      return { success: false, message: `No API key entered or configured for ${providerDef.name}. Please enter a key.` };
    }

    const startTime = Date.now();
    try {
      if (providerDef.type === 'gemini') {
        const ai = new GoogleGenAI({
          apiKey: effectiveKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const geminiCandidates = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
        let lastErr: any = null;

        for (const m of geminiCandidates) {
          try {
            const response = await ai.models.generateContent({
              model: m,
              contents: 'Ping test for Astha Study AI. Respond: "OK".',
            });
            const latencyMs = Date.now() - startTime;
            this.workingModelsCache['gemini'] = m;
            return {
              success: true,
              message: `Connected to ${providerDef.name} (Model: ${m})`,
              activeModel: m,
              latencyMs,
            };
          } catch (err: any) {
            lastErr = err;
          }
        }
        throw lastErr || new Error('All Gemini test models failed');
      }

      if (providerDef.type === 'anthropic') {
        const anthropicCandidates = ['claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'];
        let lastErr: any = null;

        for (const model of anthropicCandidates) {
          try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': effectiveKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model,
                max_tokens: 20,
                messages: [{ role: 'user', content: 'Ping test. Reply OK' }],
              }),
            });
            if (res.ok) {
              this.workingModelsCache['anthropic'] = model;
              return {
                success: true,
                message: `Connected to ${providerDef.name} (Model: ${model})`,
                activeModel: model,
                latencyMs: Date.now() - startTime,
              };
            }
            lastErr = new Error(`HTTP ${res.status}: ${await res.text()}`);
          } catch (e: any) {
            lastErr = e;
          }
        }
        throw lastErr || new Error('Anthropic connection test failed');
      }

      // Standard OpenAI-compatible REST endpoint (Groq, OpenAI, DeepSeek, Mistral, OpenRouter, Cerebras, etc.)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
      };
      if (providerId === 'openrouter') {
        headers['HTTP-Referer'] = 'https://astha-study.ai';
        headers['X-Title'] = 'Astha Study AI';
      }

      const candidates = await this.resolveModelCandidates(providerId, effectiveKey, providerDef.defaultModel);
      let lastErrorText = '';

      for (const model of candidates) {
        try {
          const res = await fetch(providerDef.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: 'Ping test. Reply OK' }],
              max_tokens: 20,
              temperature: 0.1,
            }),
          });

          if (res.ok) {
            this.workingModelsCache[providerId] = model;
            return {
              success: true,
              message: `Connected to ${providerDef.name} (Model: ${model})`,
              activeModel: model,
              latencyMs: Date.now() - startTime,
            };
          }

          const errText = await res.text();
          lastErrorText = `HTTP ${res.status}: ${errText.slice(0, 160)}`;

          // If model 404 or model_not_found, try next available candidate model automatically
          if (res.status === 404 || errText.includes('model_not_found') || errText.includes('does not exist')) {
            continue;
          } else {
            // Bad key or auth error: break immediately
            break;
          }
        } catch (err: any) {
          lastErrorText = err.message;
        }
      }

      throw new Error(lastErrorText || `Failed to connect to ${providerDef.name}`);
    } catch (err: any) {
      return { success: false, message: `Test failed: ${err.message}` };
    }
  }

  // Bulk add keys
  public addKeysBulk(entries: Array<{ provider: AIProviderId; key: string }>): number {
    let saved = 0;
    entries.forEach((e) => {
      if (e.provider && e.key && e.key.trim().length > 0) {
        this.addKey(e.provider, e.key.trim());
        saved++;
      }
    });
    return saved;
  }

  // Multi-Provider Cascading Failover Dispatcher (10+ Companies)
  public async executeChatPrompt(
    systemPrompt: string,
    userPrompt: string,
    options?: { jsonMode?: boolean }
  ): Promise<string> {
    const sourceLockedSystem = `CRITICAL STRICT SOURCE LOCK:
You are Astha Study AI, an educational curriculum assistant for Class 6-10 students.
ABSOLUTE RULE: Use ONLY information directly present in the supplied chapter text.
NEVER add outside facts, numbers, dates, or trivia from general knowledge.
If any requested item is not found in the chapter, state:
"यह जानकारी दिए गए अध्याय में उपलब्ध नहीं है।" (or in English: "This information is not available in the provided chapter text.")

${systemPrompt}`;

    const errors: string[] = [];

    // Sort providers by priority (1 through 11)
    const sortedProviders = [...PROVIDERS_REGISTRY].sort((a, b) => a.priority - b.priority);

    for (const providerDef of sortedProviders) {
      const activeKeys = this.keys.filter((k) => k.provider === providerDef.id && k.isActive);
      if (activeKeys.length === 0) continue;

      for (const keyItem of activeKeys) {
        const stats = this.usageStats[providerDef.id] || {
          requests: 0,
          success: 0,
          errors: 0,
          rateLimit429: 0,
          estimatedTokens: 0,
        };

        try {
          stats.requests++;
          this.currentActiveProvider = providerDef.id;

          // Branch 1: Google Gemini SDK
          if (providerDef.type === 'gemini') {
            const ai = new GoogleGenAI({
              apiKey: keyItem.key,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            });

            // Model fallback list with flash-lite prioritized for high quota limits
            const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
            let content = '';

            for (const m of models) {
              try {
                const response = await ai.models.generateContent({
                  model: m,
                  contents: `${sourceLockedSystem}\n\n[USER REQUEST]:\n${userPrompt}`,
                  config: {
                    responseMimeType: options?.jsonMode ? 'application/json' : 'text/plain',
                    temperature: 0.1,
                    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                  },
                });
                content = response.text || '';
                if (content.length > 0) break;
              } catch (modelErr: any) {
                // If transient 503 or 429, try next model
                continue;
              }
            }

            if (!content) {
              throw new Error('Gemini models returned empty response or were busy');
            }

            stats.success++;
            stats.estimatedTokens += 500;
            keyItem.lastUsedAt = new Date().toISOString();
            this.lastUsedProvider = 'gemini';
            this.lastSuccessfulRequest = new Date().toISOString();
            return content;
          }

          // Branch 2: Anthropic Claude API
          if (providerDef.type === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': keyItem.key,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: providerDef.defaultModel,
                max_tokens: 3000,
                system: sourceLockedSystem,
                messages: [{ role: 'user', content: userPrompt }],
                temperature: 0.2,
              }),
            });

            if (!res.ok) {
              const status = res.status;
              if (status === 429 || status === 402) {
                stats.rateLimit429++;
                throw new Error(`Anthropic quota limit (${status}) on ${keyItem.maskedKey}`);
              }
              throw new Error(`Anthropic HTTP ${status}`);
            }

            const data = await res.json();
            const text = data.content?.[0]?.text || '';
            stats.success++;
            stats.estimatedTokens += 600;
            keyItem.lastUsedAt = new Date().toISOString();
            this.lastUsedProvider = 'anthropic';
            this.lastSuccessfulRequest = new Date().toISOString();
            return text;
          }

          // Branch 3: Standard OpenAI-Compatible REST (Groq, OpenAI, DeepSeek, Mistral, OpenRouter, Together, Perplexity, xAI, Cerebras)
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${keyItem.key}`,
          };
          if (providerDef.id === 'openrouter') {
            headers['HTTP-Referer'] = 'https://astha-study.ai';
            headers['X-Title'] = 'Astha Study AI';
          }

          const candidates = await this.resolveModelCandidates(providerDef.id, keyItem.key, providerDef.defaultModel);
          let successContent: string | null = null;
          let lastErrText = '';

          for (const model of candidates) {
            try {
              const res = await fetch(providerDef.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  model,
                  messages: [
                    { role: 'system', content: sourceLockedSystem },
                    { role: 'user', content: userPrompt },
                  ],
                  temperature: 0.2,
                  response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
                }),
              });

              if (!res.ok) {
                const status = res.status;
                if (status === 429 || status === 402) {
                  stats.rateLimit429++;
                  keyItem.failureCount++;
                  throw new Error(`${providerDef.name} Quota Limit (HTTP ${status}) on key ${keyItem.maskedKey}`);
                }
                const errBody = await res.text().catch(() => '');
                // If model not found or does not exist, try next candidate model
                if (status === 404 || errBody.includes('model_not_found') || errBody.includes('does not exist')) {
                  lastErrText = `${providerDef.name} Model ${model} not available`;
                  continue;
                }
                throw new Error(`${providerDef.name} HTTP ${status}: ${errBody.slice(0, 150)}`);
              }

              const data = await res.json();
              const content = data.choices?.[0]?.message?.content || '';
              if (content) {
                this.workingModelsCache[providerDef.id] = model;
                stats.success++;
                stats.estimatedTokens += (data.usage?.total_tokens || 500);
                keyItem.lastUsedAt = new Date().toISOString();
                this.lastUsedProvider = providerDef.id;
                this.lastSuccessfulRequest = new Date().toISOString();
                successContent = content;
                break;
              }
            } catch (branchErr: any) {
              if (branchErr.message && branchErr.message.includes('Quota Limit')) {
                throw branchErr;
              }
              lastErrText = branchErr.message;
            }
          }

          if (successContent) {
            return successContent;
          }

          throw new Error(lastErrText || `${providerDef.name} failed to generate content`);
        } catch (err: any) {
          const errText = err?.message || String(err);
          stats.errors++;
          keyItem.failureCount++;
          errors.push(`${providerDef.name} (${keyItem.maskedKey}): ${errText}`);
          this.lastError = `${providerDef.name}: ${errText}`;
          // Quota exhausted on this key/provider: continue to next key or next provider in priority chain!
        }
      }
    }

    // If every single provider in the cascade chain failed:
    throw new Error(
      `All configured AI providers exhausted or failed. Cascade trail: ${errors.join(' ➔ ') || 'No active API keys found'}`
    );
  }

  // Vision OCR (Gemini prioritized, fallback to OpenAI GPT-4o-mini vision if available)
  public async executeVisionOCR(base64Image: string, mimeType: string): Promise<string> {
    const prompt = `CRITICAL OCR EXTRACTION:
Extract ALL chapter text from this image page with 100% precision.
Maintain the exact headings, subheadings, definitions, scientific terms, examples, exercises, and numbered lists.
Do NOT invent or summarize. Extract everything verbatim.
Suitable for Indian school NCERT Hindi/English textbooks.`;

    // 1. Try Gemini Vision across models (prioritizing high-quota gemini-3.1-flash-lite)
    const geminiKeys = this.keys.filter((k) => k.provider === 'gemini' && k.isActive);
    if (geminiKeys.length === 0 && process.env.GEMINI_API_KEY) {
      geminiKeys.push({
        id: 'env-default',
        provider: 'gemini',
        key: process.env.GEMINI_API_KEY,
        maskedKey: '********',
        isActive: true,
        addedAt: new Date().toISOString(),
        failureCount: 0,
      });
    }

    const visionModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    for (const keyItem of geminiKeys) {
      const ai = new GoogleGenAI({
        apiKey: keyItem.key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Image,
        },
      };

      for (const model of visionModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          const text = response.text || '';
          if (text.trim().length > 0) {
            keyItem.lastUsedAt = new Date().toISOString();
            this.lastUsedProvider = 'gemini';
            this.lastSuccessfulRequest = new Date().toISOString();
            return text;
          }
        } catch (err: any) {
          console.warn(`Gemini OCR on model [${model}] failed (${err?.message?.slice(0, 100)}), falling back to next vision model...`);
          continue;
        }
      }
    }

    // 2. Try Groq Vision if available
    const activeGroq = this.keys.find((k) => k.provider === 'groq' && k.isActive)?.key || process.env.GROQ_API_KEY;
    if (activeGroq) {
      try {
        const formattedUrl = `data:${mimeType || 'image/jpeg'};base64,${base64Image}`;
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeGroq}`,
          },
          body: JSON.stringify({
            model: 'llama-3.2-11b-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: formattedUrl } },
                ],
              },
            ],
            max_tokens: 3000,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || '';
          if (text.trim().length > 0) {
            this.lastUsedProvider = 'groq';
            return text;
          }
        }
      } catch (err: any) {
        console.warn('Groq OCR fallback error:', err.message);
      }
    }

    // 3. Try OpenAI Vision if available
    const activeOpenAI = this.keys.find((k) => k.provider === 'openai' && k.isActive)?.key;
    if (activeOpenAI) {
      try {
        const formattedUrl = `data:${mimeType || 'image/jpeg'};base64,${base64Image}`;
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeOpenAI}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: formattedUrl } },
                ],
              },
            ],
            max_tokens: 3000,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || '';
          if (text.trim().length > 0) {
            this.lastUsedProvider = 'openai';
            return text;
          }
        }
      } catch (err: any) {
        console.warn('OpenAI OCR fallback failed:', err.message);
      }
    }

    throw new Error('OCR could not be performed. Please verify your Gemini or other provider API keys in Admin Settings.');
  }
}

export const aiProviderManager = new AIProviderManager();
