import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/openai/forecast', async (req, res) => {
    try {
        const { pnlMonthlyData } = req.body;
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Ты — финансовый аналитик. Проанализируй данные о прибылях и убытках и создай прогноз на следующие 3 месяца. Верни только валидный JSON с полями: forecastedRevenue (массив из 3 чисел), forecastedExpenses (массив из 3 чисел), forecastedProfit (массив из 3 чисел), confidence, assumptions. forecastedRevenue, forecastedExpenses, forecastedProfit — всегда массивы длины 3, даже если значения одинаковые. Не возвращай одно число, только массив из 3 чисел! Без пояснений, markdown и текста.'
                },
                {
                    role: 'user',
                    content: `Создай финансовый прогноз на основе данных: ${JSON.stringify(pnlMonthlyData)}`
                }
            ],
            response_format: { type: 'json_object' }
        });
        let text = response.choices[0]?.message?.content || '{}';
        // Попытка извлечь JSON, если вдруг что-то не так
        try {
            text = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const parsed = JSON.parse(text);
            // Приводим forecastedRevenue, forecastedExpenses, forecastedProfit к массивам, если это объекты или числа
            ['forecastedRevenue', 'forecastedExpenses', 'forecastedProfit'].forEach(key => {
              if (parsed[key] && typeof parsed[key] === 'object' && !Array.isArray(parsed[key])) {
                // Берём только числовые значения
                let arr = Object.values(parsed[key]).map(Number).filter(v => !isNaN(v));
                // Если длина не 3, дублируем последнее значение
                while (arr.length < 3) arr.push(arr[arr.length - 1] ?? 0);
                parsed[key] = arr.slice(0, 3);
              }
              if (parsed[key] && !Array.isArray(parsed[key])) {
                parsed[key] = [parsed[key], parsed[key], parsed[key]];
              }
            });
            res.json(parsed);
        } catch (e) {
            res.status(500).json({ error: 'AI ответ не является валидным JSON', raw: text });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages, transactions, report, dateRange, profile } = req.body;
    // Формируем краткую сводку по финансам
    let summary = '';
    if (report) {
      summary += `Финансовый отчет пользователя:\n`;
      summary += `Период: ${dateRange?.start || ''} - ${dateRange?.end || ''}\n`;
      summary += `Выручка: ${report.pnl?.totalRevenue ?? '-'}; Операционные расходы: ${report.pnl?.totalOperatingExpenses ?? '-'}; Чистая прибыль: ${report.pnl?.netProfit ?? '-'};\n`;
      summary += `Денежный поток: ${report.cashFlow?.netCashFlow ?? '-'};\n`;
      summary += `Контрагентов: ${report.counterpartyReport?.length ?? '-'};\n`;
    }
    if (transactions && Array.isArray(transactions)) {
      summary += `Транзакций за период: ${transactions.length}.\n`;
    }
    if (profile) {
      summary += `Профиль бизнеса: ${profile.businessName || ''} (${profile.businessType || ''})\n`;
    }
    const systemPrompt = {
      role: 'system',
      content: `Ты — финансовый ассистент. Используй эти данные для анализа и ответов на вопросы пользователя.\n${summary}`
    };
    const fullMessages = [systemPrompt, ...(messages || [])];
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: fullMessages,
      max_tokens: 500,
    });
    const text = response.choices[0]?.message?.content || '';
    res.json({ content: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
    res.send('FinSights AI backend is running');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
}); 