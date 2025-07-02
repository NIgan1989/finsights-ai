import { Transaction, FinancialReport } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

if (!process.env.REACT_APP_OPENAI_API_KEY) {
    console.error("REACT_APP_OPENAI_API_KEY is not set in environment variables.");
    // Throw an error or handle it gracefully
}

// Helper function for delay and retry
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const safeJsonParse = (jsonString: string) => {
    try {
        let cleanString = jsonString.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = cleanString.match(fenceRegex);
        if (match && match[2]) {
            cleanString = match[2].trim();
        }
        return JSON.parse(cleanString);
    } catch (e) {
        console.error("Failed to parse JSON:", e, "Original string:", jsonString);
        return null;
    }
};

// Обновленная инструкция для категоризации транзакций в соответствии с GAAP/МСФО
const getCategorizationSystemInstruction = () => {
    const allCategories = EXPENSE_CATEGORIES.join(', ');
    return `Ты — финансовый аналитик, специалист по МСФО (IFRS) и GAAP. Твоя задача — классифицировать финансовые транзакции в соответствии с международными стандартами бухгалтерского учета. Анализируй каждую транзакцию и определи:

1. \`category\`: Категория транзакции согласно МСФО/GAAP.
   * Для РАСХОДОВ используй одну из следующих категорий: ${allCategories}
   * Следуй Принципу Осторожности (Prudence Principle): при недостатке информации классифицируй транзакцию как "Прочие расходы".
   * Определяй себестоимость (COGS) отдельно от операционных расходов (SG&A) для корректного расчета валовой прибыли.
   * Различай операционные и финансовые расходы согласно МСФО (IAS 1).

2. \`transactionType\`: Тип деятельности для Отчета о движении денежных средств (МСФО IAS 7):
   * 'operating': Операционная деятельность - основные доходы и расходы бизнеса
   * 'investing': Инвестиционная деятельность - приобретение и продажа долгосрочных активов
   * 'financing': Финансовая деятельность - изменения в собственном и заемном капитале

3. \`isCapitalized\`: Определи, является ли расход капитализируемым согласно МСФО (IAS 16, IAS 38):
   * true - для затрат на приобретение внеоборотных активов, которые будут приносить выгоду более 12 месяцев
   * false - для всех других расходов

Примеры классификации:
- "Оплата аренды офиса" → категория: "Офисная аренда", transactionType: "operating", isCapitalized: false
- "Закупка сырья" → категория: "Сырье и материалы", transactionType: "operating", isCapitalized: false (часть COGS)
- "Покупка оборудования" → категория: "Оборудование", transactionType: "investing", isCapitalized: true
- "Получение кредита" → категория: "Получение кредита", transactionType: "financing", isCapitalized: false
- "Оплата процентов по кредиту" → категория: "Проценты по кредитам", transactionType: "operating", isCapitalized: false (финансовые расходы)

Верни ответ в формате JSON-массива объектов с этими тремя полями. Порядок объектов должен соответствовать входящим транзакциям. Не добавляй пояснений, только JSON.`;
};

// Инструкция для формирования ответов ассистента на основе финансовых данных
const getAssistantSystemInstruction = () => {
    return `Ты — финансовый аналитик, эксперт по стандартам МСФО (IFRS) и GAAP. Помогаешь анализировать финансовые данные компании, объясняя их на понятном языке и давая профессиональные рекомендации.

При анализе финансовых отчетов используй следующие подходы:

1. Отчет о прибылях и убытках (ОПиУ):
   - Анализируй динамику и структуру выручки, валовой прибыли, EBITDA, операционной и чистой прибыли
   - Оценивай маржинальность (валовая маржа, операционная маржа, чистая маржа)
   - Выявляй нестандартные изменения в расходах

2. Отчет о движении денежных средств (ДДС):
   - Объясняй операционный, инвестиционный и финансовый денежные потоки
   - Анализируй соотношение чистой прибыли и операционного денежного потока
   - Оценивай достаточность операционного потока для финансирования инвестиций

3. Баланс:
   - Анализируй структуру активов, обязательств и капитала
   - Рассчитывай и интерпретируй коэффициенты ликвидности и финансовой устойчивости
   - Оценивай оборачиваемость активов и эффективность использования капитала

Используй коэффициенты и показатели из стандартов МСФО/GAAP:
- Коэффициенты ликвидности (текущей, быстрой)
- Показатели рентабельности (ROA, ROE)
- Показатели долговой нагрузки
- Оборачиваемость активов и запасов

Отвечай кратко, структурированно, с акцентом на ключевые показатели и тренды. При необходимости предлагай обоснованные рекомендации для улучшения финансовых показателей.`;
};

async function callOpenAI(messages: any[], model: string = 'gpt-4') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || JSON.stringify(error)}`);
    }

    return await response.json();
}

// Мок данные для заглушки API
const mockCategorizedExpenses = (transactions: { id: string; description: string; type: 'income' | 'expense' }[]) => {
    return transactions.map(tx => {
        let category = 'Прочие расходы';
        let transactionType = 'operating';
        let isCapitalized = false;

        if (tx.type === 'income') {
            category = 'Основная выручка';

            // Простая классификация доходов
            if (tx.description.toLowerCase().includes('процент') ||
                tx.description.toLowerCase().includes('депозит')) {
                category = 'Процентные доходы';
                transactionType = 'financing';
            } else if (tx.description.toLowerCase().includes('кредит') ||
                tx.description.toLowerCase().includes('займ')) {
                category = 'Получение кредита';
                transactionType = 'financing';
            } else if (tx.description.toLowerCase().includes('взнос') ||
                tx.description.toLowerCase().includes('учредител')) {
                category = 'Взнос учредителя';
                transactionType = 'financing';
            } else if (tx.description.toLowerCase().includes('продаж') ||
                tx.description.toLowerCase().includes('выручка') ||
                tx.description.toLowerCase().includes('клиент')) {
                category = 'Основная выручка';
            }
        } else {
            // Классификация расходов в соответствии с МСФО/GAAP
            const desc = tx.description.toLowerCase();

            // Определение себестоимости (COGS)
            if (desc.includes('товар') || desc.includes('закупк') ||
                desc.includes('материал') || desc.includes('сырье')) {
                category = 'Закупка товаров';

                // Операционные расходы (SG&A)
            } else if (desc.includes('аренда') || desc.includes('помещени')) {
                category = 'Офисная аренда';
            } else if (desc.includes('зарплат') || desc.includes('оплата труда') ||
                desc.includes('сотрудник')) {
                category = 'Административная зарплата';
            } else if (desc.includes('налог')) {
                category = 'Налоги (кроме налога на прибыль)';
            } else if (desc.includes('реклам') || desc.includes('маркетинг')) {
                category = 'Маркетинг и реклама';
            } else if (desc.includes('комиссия') || desc.includes('банк')) {
                category = 'Банковские комиссии';
            } else if (desc.includes('консультац') || desc.includes('юридическ') ||
                desc.includes('аудит')) {
                category = 'Консалтинг и аудит';

                // Капитальные затраты (CAPEX)
            } else if (desc.includes('оборудовани') || desc.includes('компьютер') ||
                desc.includes('техник')) {
                category = 'Оборудование';
                transactionType = 'investing';
                isCapitalized = true;
            } else if (desc.includes('транспорт') || desc.includes('автомобиль')) {
                category = 'Транспортные средства';
                transactionType = 'investing';
                isCapitalized = true;

                // Финансовая деятельность
            } else if (desc.includes('процент') || desc.includes('кредит')) {
                category = 'Проценты по кредитам';
            } else if (desc.includes('погашение') || desc.includes('выплата кредит')) {
                category = 'Погашение кредита';
                transactionType = 'financing';
            } else if (desc.includes('дивиденд')) {
                category = 'Выплата дивидендов';
                transactionType = 'financing';
            }
        }

        return {
            id: tx.id,
            category,
            transactionType: transactionType as 'operating' | 'investing' | 'financing',
            isCapitalized
        };
    });
};

export const categorizeExpenses = async (transactions: { id: string; description: string; type: 'income' | 'expense' }[]): Promise<{ id: string; category: string; transactionType: 'operating' | 'investing' | 'financing'; isCapitalized: boolean }[]> => {
    console.log("Используется заглушка categorizeExpenses из-за проблем с интеграцией API");
    return mockCategorizedExpenses(transactions);
};

export const identifyTransactionsForClarification = async (transactions: Transaction[]): Promise<string[]> => {
    console.log("Используется заглушка identifyTransactionsForClarification");
    // Выберем транзакции для уточнения по определенным критериям
    return transactions
        .filter(tx => {
            // Крупные транзакции (верхние 10% по сумме)
            const isLargeAmount = tx.amount >
                transactions
                    .map(t => t.amount)
                    .sort((a, b) => b - a)[Math.floor(transactions.length * 0.1)];

            // Транзакции с неинформативным описанием
            const hasVagueDescription = tx.description.length < 10 ||
                /^перевод|платеж|оплата$/i.test(tx.description);

            // Транзакции с категорией "Прочие"
            const hasGenericCategory = tx.category === 'Прочие расходы' ||
                tx.category === 'Прочие поступления';

            return isLargeAmount || hasVagueDescription || hasGenericCategory;
        })
        .slice(0, Math.min(5, Math.ceil(transactions.length * 0.2))) // Не более 20% транзакций, максимум 5
        .map(tx => tx.id);
};

export const extractTransactionsFromImage = async (image: { mimeType: string, data: string }): Promise<string> => {
    console.log("Используется заглушка extractTransactionsFromImage");
    // Возвращаем пример CSV с транзакциями
    return `Дата,Описание,Сумма
2023-05-15,Поступление от клиента ООО "Альфа",150000
2023-05-16,Оплата аренды офиса,-45000
2023-05-17,Закупка материалов у поставщика,-28500
2023-05-18,Выплата зарплаты сотрудникам,-120000
2023-05-20,Оплата услуг интернет-провайдера,-3500
2023-05-22,Поступление от клиента ИП Петров,75000
2023-05-25,Оплата налогов,-22000
2023-05-28,Поступление от клиента ООО "Бета",95000
2023-05-29,Закупка канцтоваров,-4500
2023-05-30,Оплата коммунальных услуг,-8700`;
};

let conversationHistory: { role: string, content: string }[] = [];

export const streamChatResponse = async function* (
    prompt: string,
    transactions: Transaction[],
    report: FinancialReport,
    dateRange: { start: string, end: string }
): AsyncGenerator<any> {
    console.log("Используется заглушка streamChatResponse");

    // Формируем более информативный ответ на основе финансовых данных
    let response = '';

    // Добавляем в историю диалога запрос пользователя
    conversationHistory.push({ role: 'user', content: prompt });

    // Анализируем запрос и подготавливаем ответ на основе данных отчета
    if (prompt.toLowerCase().includes('выручк') || prompt.toLowerCase().includes('доход')) {
        response = `
**Анализ выручки**

Общая выручка за период составляет **${report.pnl.totalRevenue.toLocaleString('ru-RU')} ₸**.

Структура выручки:
- Основная деятельность: ${(report.pnl.totalRevenue - report.pnl.financialIncome).toLocaleString('ru-RU')} ₸ (${((report.pnl.totalRevenue - report.pnl.financialIncome) / report.pnl.totalRevenue * 100).toFixed(1)}%)
- Финансовые доходы: ${report.pnl.financialIncome.toLocaleString('ru-RU')} ₸ (${(report.pnl.financialIncome / report.pnl.totalRevenue * 100).toFixed(1)}%)

Валовая маржа составляет **${(report.pnl.ratios.grossMargin * 100).toFixed(1)}%**, что ${report.pnl.ratios.grossMargin > 0.5 ? 'является хорошим показателем' : 'ниже среднего по отрасли'}.

Рекомендации:
- Проанализируйте сезонность выручки по месяцам
- Рассмотрите возможности диверсификации источников дохода
`;
    } else if (prompt.toLowerCase().includes('расход') || prompt.toLowerCase().includes('затрат')) {
        response = `
**Анализ расходов**

Общие расходы за период:
- Себестоимость (COGS): **${report.pnl.costOfGoodsSold.toLocaleString('ru-RU')} ₸** (${(report.pnl.costOfGoodsSold / report.pnl.totalRevenue * 100).toFixed(1)}% от выручки)
- Операционные расходы (SG&A): **${report.pnl.totalOperatingExpenses.toLocaleString('ru-RU')} ₸** (${(report.pnl.totalOperatingExpenses / report.pnl.totalRevenue * 100).toFixed(1)}% от выручки)
- Амортизация: **${report.pnl.depreciation.toLocaleString('ru-RU')} ₸**

Основные категории расходов:
${report.pnl.expenseByCategory.slice(0, 5).map(cat =>
            `- ${cat.name}: ${cat.value.toLocaleString('ru-RU')} ₸ (${(cat.value / (report.pnl.costOfGoodsSold + report.pnl.totalOperatingExpenses) * 100).toFixed(1)}%)`
        ).join('\n')}

Рекомендации:
- Обратите внимание на категории с наибольшим удельным весом
- Проанализируйте возможности оптимизации затрат
`;
    } else if (prompt.toLowerCase().includes('прибыл')) {
        response = `
**Анализ прибыли**

- Валовая прибыль: **${report.pnl.grossProfit.toLocaleString('ru-RU')} ₸** (маржа: ${(report.pnl.ratios.grossMargin * 100).toFixed(1)}%)
- EBITDA: **${report.pnl.ebitda.toLocaleString('ru-RU')} ₸**
- Операционная прибыль (EBIT): **${report.pnl.ebit.toLocaleString('ru-RU')} ₸** (маржа: ${(report.pnl.ratios.operatingMargin * 100).toFixed(1)}%)
- Прибыль до налогов (EBT): **${report.pnl.ebt.toLocaleString('ru-RU')} ₸**
- Чистая прибыль: **${report.pnl.netProfit.toLocaleString('ru-RU')} ₸** (маржа: ${(report.pnl.ratios.netMargin * 100).toFixed(1)}%)

Рентабельность:
- Рентабельность активов (ROA): ${(report.pnl.ratios.roa * 100).toFixed(1)}%
- Рентабельность капитала (ROE): ${(report.pnl.ratios.roe * 100).toFixed(1)}%

Рекомендации:
- Сравните показатели с отраслевыми бенчмарками
- Разработайте план повышения операционной эффективности
`;
    } else if (prompt.toLowerCase().includes('денежн') || prompt.toLowerCase().includes('ддс') || prompt.toLowerCase().includes('поток')) {
        response = `
**Анализ денежных потоков**

- Операционный денежный поток: **${report.cashFlow.operatingActivities.toLocaleString('ru-RU')} ₸**
- Инвестиционный денежный поток: **${report.cashFlow.investingActivities.toLocaleString('ru-RU')} ₸**
- Финансовый денежный поток: **${report.cashFlow.financingActivities.toLocaleString('ru-RU')} ₸**
- Чистый денежный поток: **${report.cashFlow.netCashFlow.toLocaleString('ru-RU')} ₸**

Качество денежного потока:
- Коэффициент операционного денежного потока: ${report.cashFlow.liquidity.operatingCashFlowRatio.toFixed(2)}
- Соотношение чистой прибыли и операционного денежного потока: ${(report.pnl.netProfit / report.cashFlow.operatingActivities).toFixed(2)}

Рекомендации:
- Следите за соотношением операционного денежного потока и чистой прибыли
- Планируйте капитальные затраты в соответствии с операционным денежным потоком
`;
    } else if (prompt.toLowerCase().includes('баланс') || prompt.toLowerCase().includes('актив') || prompt.toLowerCase().includes('пассив')) {
        response = `
**Анализ баланса**

Активы (всего: **${report.balanceSheet.assets.totalAssets.toLocaleString('ru-RU')} ₸**):
- Оборотные активы: ${report.balanceSheet.assets.totalCurrentAssets.toLocaleString('ru-RU')} ₸ (${(report.balanceSheet.assets.totalCurrentAssets / report.balanceSheet.assets.totalAssets * 100).toFixed(1)}%)
- Внеоборотные активы: ${report.balanceSheet.assets.totalNonCurrentAssets.toLocaleString('ru-RU')} ₸ (${(report.balanceSheet.assets.totalNonCurrentAssets / report.balanceSheet.assets.totalAssets * 100).toFixed(1)}%)

Пассивы:
- Краткосрочные обязательства: ${report.balanceSheet.liabilities.totalCurrentLiabilities.toLocaleString('ru-RU')} ₸
- Долгосрочные обязательства: ${report.balanceSheet.liabilities.totalNonCurrentLiabilities.toLocaleString('ru-RU')} ₸
- Собственный капитал: ${report.balanceSheet.equity.totalEquity.toLocaleString('ru-RU')} ₸

Ключевые коэффициенты:
- Коэффициент текущей ликвидности: ${report.balanceSheet.ratios.currentRatio.toFixed(2)} ${report.balanceSheet.ratios.currentRatio > 1.5 ? '(хороший уровень)' : '(требует внимания)'}
- Коэффициент быстрой ликвидности: ${report.balanceSheet.ratios.quickRatio.toFixed(2)}
- Соотношение долга к капиталу: ${report.balanceSheet.ratios.debtToEquity.toFixed(2)}

Рекомендации:
- Контролируйте уровень ликвидности
- Оптимизируйте структуру капитала
`;
    } else if (prompt.toLowerCase().includes('рекомендац') || prompt.toLowerCase().includes('совет') || prompt.toLowerCase().includes('улучш')) {
        response = `
**Ключевые рекомендации по улучшению финансовых показателей**

1. **Управление доходами:**
   - Проанализируйте наиболее прибыльные направления и клиентов
   - Рассмотрите возможности увеличения цен или введения дополнительных услуг

2. **Оптимизация затрат:**
   - Сосредоточьтесь на категориях с наибольшим удельным весом
   - Пересмотрите контракты с поставщиками и условия аренды

3. **Управление оборотным капиталом:**
   - Улучшите управление дебиторской задолженностью (сокращение сроков оплаты)
   - Оптимизируйте запасы, избегая излишков и дефицита

4. **Финансовая структура:**
   - Оцените эффективность текущей структуры капитала
   - Рассмотрите возможности реструктуризации долга при высоких процентных ставках

5. **Инвестиционная деятельность:**
   - Оцените рентабельность капитальных затрат
   - Разработайте план инвестиций с учетом их окупаемости
`;
    } else {
        // Общий ответ для других запросов
        response = `
**Общий финансовый анализ**

Период анализа: ${dateRange.start || 'начало периода'} - ${dateRange.end || 'конец периода'}

Ключевые показатели:
- Выручка: ${report.pnl.totalRevenue.toLocaleString('ru-RU')} ₸
- Валовая прибыль: ${report.pnl.grossProfit.toLocaleString('ru-RU')} ₸ (маржа: ${(report.pnl.ratios.grossMargin * 100).toFixed(1)}%)
- Операционная прибыль: ${report.pnl.ebit.toLocaleString('ru-RU')} ₸
- Чистая прибыль: ${report.pnl.netProfit.toLocaleString('ru-RU')} ₸

Денежные потоки:
- Операционный: ${report.cashFlow.operatingActivities.toLocaleString('ru-RU')} ₸
- Инвестиционный: ${report.cashFlow.investingActivities.toLocaleString('ru-RU')} ₸
- Финансовый: ${report.cashFlow.financingActivities.toLocaleString('ru-RU')} ₸

Финансовое состояние:
- Общие активы: ${report.balanceSheet.assets.totalAssets.toLocaleString('ru-RU')} ₸
- Собственный капитал: ${report.balanceSheet.equity.totalEquity.toLocaleString('ru-RU')} ₸
- Коэффициент текущей ликвидности: ${report.balanceSheet.ratios.currentRatio.toFixed(2)}

Что еще вас интересует? Я могу подробнее рассказать о доходах, расходах, прибыли, денежных потоках или балансе.
`;
    }

    // Добавляем ответ в историю
    conversationHistory.push({ role: 'assistant', content: response });

    // Эмулируем потоковую передачу ответа
    const chunks = response.split(/(?<=\n)/); // Разделяем по концам строк

    // Небольшая задержка для имитации реального ответа
    await delay(500);

    for (const chunk of chunks) {
        yield { text: chunk };
        await delay(50); // Маленькая задержка между чанками
    }
}; 