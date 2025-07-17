// services/aiSuggestService.ts
import axios from 'axios';

export interface AISuggestionResult {
  suggestedIncome: string[];
  suggestedExpense: string[];
  followUpQuestions: string[];
  scenarios: { name: string; description: string }[];
  defaults: Record<string, string>;
}

export interface GetAISuggestionsInput {
  businessType: string;
  currentAnswers: Record<string, string>;
  previousQuestions?: string[];
}

// Вынесенный хелпер для парсинга JSON из текстового ответа
function extractJsonFromResponse(content: string): any {
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }

  return JSON.parse(cleaned);
}

// Основной метод получения AI-подсказок по финансовой модели
export async function getAISuggestions(context: GetAISuggestionsInput): Promise<AISuggestionResult> {
  const { businessType, currentAnswers, previousQuestions = [] } = context;

  const prompt = `
Ты — профессиональный финансовый аналитик. Пользователь описал свой бизнес и частично заполнил статьи доходов и расходов.

1. Проанализируй ответы и предложи, какие статьи доходов и расходов обычно бывают для такого бизнеса (укажи, что пользователь мог забыть).
2. Сформулируй уточняющие вопросы, чтобы собрать все данные для P&L, Cash Flow, KPI, DCF. Не повторяй вопросы из списка: [${previousQuestions.join('; ')}].
3. Предложи 3 сценария развития (базовый, оптимистичный, пессимистичный).
4. Если пользователь не знает значения (например, WACC, налоговая ставка), предложи стандартные для отрасли.

Формат: 
{
  suggestedIncome: [],
  suggestedExpense: [],
  followUpQuestions: [],
  scenarios: [{ name: string, description: string }],
  defaults: { ключ: значение }
}

Тип бизнеса: ${businessType}
Ответы: ${JSON.stringify(currentAnswers, null, 2)}
Уже заданные вопросы: [${previousQuestions.join('; ')}]
`;

  try {
    const response = await axios.post('/api/openai', {
      messages: [
        { role: 'system', content: 'Ты — профессиональный финансовый аналитик, помогаешь собирать полную финансовую модель.' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 1000
    });

    const content = response.data.choices?.[0]?.message?.content ?? '';
    const parsed = extractJsonFromResponse(content);

    // Удалим повторы в followUpQuestions
    if (Array.isArray(parsed.followUpQuestions)) {
      parsed.followUpQuestions = parsed.followUpQuestions.filter((q: string) => !previousQuestions.includes(q));
    }

    return parsed;
  } catch (error: any) {
    console.error('Ошибка при получении AI-подсказок:', error);
    throw new Error('AI вернул неверный формат данных или произошла ошибка при запросе.');
  }
}

export interface FinalFinancialModelResult {
  assumptions: string[];
  tables: { name: string; data: any }[];
  charts: { type: string; data: any; options?: any }[];
  recommendations: string[];
  summary: string;
}

export async function generateFinalFinancialModel(dialog: { role: 'user' | 'ai'; text: string }[]): Promise<FinalFinancialModelResult> {
  // Собираем историю диалога в виде prompt
  const history = dialog.map(msg => `${msg.role === 'user' ? 'Пользователь' : 'AI'}: ${msg.text}`).join('\n');
  const prompt = `Ты — профессиональный финансовый аналитик мирового уровня. На основе следующего диалога с пользователем:
${history}

1. Построй профессиональную финансовую модель на 3 года (P&L, Cash Flow, KPI, DCF, Sensitivity Analysis).
2. Приведи assumptions (налог, WACC, темпы роста и т.д.).
3. Сформируй таблицы по годам, графики (выручка, расходы, прибыль), рекомендации и краткое резюме.
4. Если данных не хватает — делай обоснованные предположения и указывай их.
5. Форматируй результат в JSON-структуре:
{
  assumptions: string[],
  tables: [{ name: string, data: any }],
  charts: [{ type: string, data: any, options?: any }],
  recommendations: string[],
  summary: string
}`;

  // Вызов OpenAI (пример для gpt-4o)
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Ты — профессиональный финансовый аналитик и эксперт по моделированию.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 2000
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  // Парсим JSON из ответа
  const text = response.data.choices[0].message.content;
  let result: FinalFinancialModelResult;
  try {
    result = JSON.parse(text);
  } catch {
    // Если невалидный JSON — возвращаем как summary
    result = {
      assumptions: [],
      tables: [],
      charts: [],
      recommendations: [],
      summary: text
    };
  }
  return result;
} 