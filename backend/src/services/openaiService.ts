const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';
const REQUEST_TIMEOUT_MS = 15000;

export type OpenAIConnectionStatus = {
  configured: boolean;
  model: string;
  success: boolean;
  message: string;
  possibleCauses?: string[];
};

const getApiKey = (): string | null => {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key ? key : null;
};

const getModel = (): string => process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

export const getOpenAIConfig = () => ({
  configured: Boolean(getApiKey()),
  model: getModel(),
});

export const enhanceDescription = async (
  itemName: string,
  category: string,
  rawDescription: string,
  location?: string,
  brand?: string,
  color?: string,
): Promise<string> => {
  const apiKey = getApiKey();
  const model = getModel();

  if (!apiKey) {
    const details = [
      color ? `Color: ${color}` : '',
      brand ? `Brand: ${brand}` : '',
      location ? `Location: ${location}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    return `${itemName} (${category}) - ${rawDescription}${details ? ` [${details}]` : ''}`;
  }

  const prompt = `You are a campus lost & found assistant. Transform the following item information into a crisp, detailed, and searchable 2-3 sentence description suitable for item matching.

Item Name: ${itemName}
Category: ${category}
User Description: ${rawDescription}
Location: ${location || 'Unknown'}
Brand: ${brand || 'Unspecified'}
Color: ${color || 'Unspecified'}

Return ONLY the enhanced description paragraph without quotes or metadata prefixes.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || rawDescription;
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.warn('[OpenAI] Description enhancement fallback:', isAbort ? 'Request timed out' : err);
    return rawDescription;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const generateTitle = async (description: string, location?: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return description.slice(0, 30) + '...';
  }
  const prompt = `Generate a concise 3-6 word title for a lost & found report based on this description: "${description}" (Location: ${location || 'Campus'}). Return ONLY the title string.`;
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: getModel(),
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 30,
      }),
    });
    if (!response.ok) return description.slice(0, 30);
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim()?.replace(/^["']|["']$/g, '') || description.slice(0, 30);
  } catch {
    return description.slice(0, 30);
  }
};

export const autoCategorizeAndTag = async (itemName: string, description: string) => {
  const apiKey = getApiKey();
  const defaultRes = {
    category: 'Electronics',
    tags: [itemName.toLowerCase()],
    keywords: [itemName.toLowerCase()],
  };

  if (!apiKey) return defaultRes;

  const prompt = `Categorize this campus item into one of [Electronics, Books & Stationery, Clothing & Accessories, ID Cards & Wallet, Keys, Bags & Backpacks, Sports & Fitness, Miscellaneous] and extract 3-5 tags and keywords.
Item: ${itemName}
Description: ${description}
Return strictly JSON format: {"category": "...", "tags": ["..."], "keywords": ["..."]}`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: getModel(),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 150,
      }),
    });
    if (!response.ok) return defaultRes;
    const data = await response.json();
    const content = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
    return {
      category: content.category || 'Electronics',
      tags: Array.isArray(content.tags) ? content.tags : [itemName.toLowerCase()],
      keywords: Array.isArray(content.keywords) ? content.keywords : [itemName.toLowerCase()],
    };
  } catch {
    return defaultRes;
  }
};

export const explainMatch = async (lostItem: any, foundItem: any) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      explanation: `Match between ${lostItem.itemName} and ${foundItem.itemName} based on location and category similarity.`,
      matchScore: 85,
    };
  }

  const prompt = `Compare these two campus item reports and explain why they match or differ.
Lost Item: ${lostItem.itemName} - ${lostItem.description} (Category: ${lostItem.category}, Location: ${lostItem.lostLocation})
Found Item: ${foundItem.itemName} - ${foundItem.description} (Category: ${foundItem.category}, Location: ${foundItem.foundLocation})

Return strictly JSON format: {"explanation": "2-sentence clear explanation", "matchScore": number_between_0_and_100}`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: getModel(),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 150,
      }),
    });
    if (!response.ok)
      return {
        explanation: `Match between ${lostItem.itemName} and ${foundItem.itemName} based on category and proximity.`,
        matchScore: 85,
      };
    const data = await response.json();
    const content = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
    return {
      explanation: content.explanation || 'Strong correlation detected between lost and found item records.',
      matchScore: content.matchScore || 85,
    };
  } catch {
    return {
      explanation: `Match between ${lostItem.itemName} and ${foundItem.itemName} based on category and proximity.`,
      matchScore: 85,
    };
  }
};

export const testOpenAIConnection = async (): Promise<OpenAIConnectionStatus> => {
  const apiKey = getApiKey();
  const model = getModel();

  if (!apiKey) {
    return {
      configured: false,
      success: false,
      model,
      message: 'Missing OPENAI_API_KEY',
      possibleCauses: [
        'OPENAI_API_KEY is not set in the root .env file',
        'Environment variables are not loaded before the server starts',
      ],
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with: OpenAI API is working.' }],
        max_tokens: 20,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error?.message || response.statusText || 'OpenAI request failed';
      return {
        configured: true,
        success: false,
        model,
        message: errorMessage,
        possibleCauses: [
          'Invalid API key',
          'Billing or quota is unavailable',
          'Incorrect model name',
          'OpenAI service returned an error',
        ],
      };
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return {
        configured: true,
        success: false,
        model,
        message: 'Unexpected response from OpenAI',
        possibleCauses: [
          'API response structure changed',
          'Model did not return a text completion',
        ],
      };
    }

    return {
      configured: true,
      success: true,
      model,
      message: reply,
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    return {
      configured: true,
      success: false,
      model,
      message: isAbort ? 'OpenAI request timed out' : error instanceof Error ? error.message : 'Unknown error',
      possibleCauses: isAbort
        ? ['OpenAI took too long to respond', 'Network connectivity issues']
        : ['Network error', 'OpenAI service unavailable'],
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
