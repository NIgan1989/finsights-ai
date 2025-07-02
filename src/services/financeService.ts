import { Transaction, PnLData, CashFlowData, BalanceSheetData, FinancialReport } from '../types';
import { categorizeExpenses, identifyTransactionsForClarification, extractTransactionsFromImage } from './openaiService';
import { parseBankPdf, validateBankStatement } from './bankPdfService';

const parseCSV = (csvText: string): Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];

    const dateIndex = headers.findIndex(h => h.includes('дата'));
    const descIndex = headers.findIndex(h => h.includes('описание'));
    const amountIndex = headers.findIndex(h => h.includes('сумма'));

    if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
        throw new Error('Неверный формат CSV. Убедитесь, что файл содержит колонки "Дата", "Описание" и "Сумма".');
    }

    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        if (data.length < headers.length) continue;

        const amount = parseFloat(data[amountIndex].trim());
        if (isNaN(amount)) continue;

        const dateRaw = data[dateIndex].trim();
        // Handle dd.mm.yyyy and yyyy-mm-dd
        const dateParts = dateRaw.split(/[.-]/);
        let dateObj;
        if (dateParts.length === 3) {
            if (dateParts[0].length === 4) { // yyyy-mm-dd
                dateObj = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`);
            } else { // dd.mm.yyyy
                dateObj = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
            }
        } else {
            // Try parsing directly if format is unusual
            dateObj = new Date(dateRaw);
        }

        // Check if date is valid
        if (isNaN(dateObj.getTime())) continue;

        const isoDate = dateObj.toISOString().split('T')[0];

        transactions.push({
            id: `tx_${Date.now()}_${i}`,
            date: isoDate,
            description: data[descIndex].trim(),
            amount: Math.abs(amount),
            type: amount >= 0 ? 'income' : 'expense',
        });
    }
    return transactions;
};

export const processAndCategorizeTransactions = async (file: File, onProgress: (msg: string) => void): Promise<Transaction[]> => {
    let csvContent: string;

    if (file.type === 'text/csv') {
        onProgress("Обработка CSV файла...");
        csvContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
            reader.readAsText(file, 'utf-8');
        });
    } else if (file.type === 'application/pdf') {
        onProgress("Обработка PDF банковской выписки...");
        try {
            // Используем специализированный парсер для банковских PDF
            const result = await parseBankPdf(file);
            onProgress(`Определен банк: ${result.bankType.toUpperCase()}. Найдено транзакций: ${result.transactions.length}`);
            
            // Проверяем, что это действительно банковская выписка
            if (!validateBankStatement(result.extractedText)) {
                throw new Error('PDF файл не содержит данных банковской выписки');
            }

            // Конвертируем банковские транзакции в CSV формат для дальнейшей обработки
            const csvHeader = "Дата,Описание,Сумма";
            const csvRows = result.transactions.map(tx => 
                `${tx.date},"${tx.description.replace(/"/g, '""')}",${tx.type === 'income' ? tx.amount : -tx.amount}`
            );
            csvContent = [csvHeader, ...csvRows].join('\n');
            
        } catch (error) {
            console.error('Ошибка обработки PDF банковской выписки:', error);
            // Fallback к общему методу извлечения данных
            onProgress("Извлечение данных из PDF документа (может занять до минуты)...");
            try {
                const base64String: string = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve((event.target?.result as string).split(',')[1]);
                    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
                    reader.readAsDataURL(file);
                });
                csvContent = await extractTransactionsFromImage({ mimeType: file.type, data: base64String });
            } catch (e) {
                throw new Error(`Не удалось обработать PDF файл: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
            }
        }
    } else if (['image/png', 'image/jpeg'].includes(file.type)) {
        onProgress("Извлечение данных из изображения (может занять до минуты)...");
        try {
            const base64String: string = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve((event.target?.result as string).split(',')[1]);
                reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
                reader.readAsDataURL(file);
            });
            csvContent = await extractTransactionsFromImage({ mimeType: file.type, data: base64String });
        } catch (e) {
            throw e; // re-throw specific error from geminiService
        }
    } else {
        throw new Error(`Неподдерживаемый тип файла: ${file.type}. Поддерживаются: CSV, PDF (банковские выписки), PNG, JPEG`);
    }

    if (!csvContent || csvContent.trim() === '') {
        throw new Error('Не удалось извлечь или прочитать транзакции из файла.');
    }

    onProgress("Анализ и классификация транзакций...");

    const rawTransactions = parseCSV(csvContent);
    const transactionsToCategorize = rawTransactions.map(tx => ({
        id: tx.id,
        description: tx.description,
        type: tx.type
    }));

    const classifications = await categorizeExpenses(transactionsToCategorize);

    const classificationMap = new Map(classifications.map(c => [c.id, c]));

    const categorizedTransactions: Transaction[] = rawTransactions.map(tx => {
        const classification = classificationMap.get(tx.id);
        const defaultCategory = tx.type === 'income' ? 'Основная выручка' : 'Прочие расходы';
        return {
            ...tx,
            category: classification?.category || defaultCategory,
            transactionType: classification?.transactionType || 'operating',
            isCapitalized: classification?.isCapitalized || false,
        };
    });

    onProgress("Выявление неточностей для уточнения...");
    const idsToClarify = await identifyTransactionsForClarification(categorizedTransactions);

    const finalTransactions = categorizedTransactions.map(tx => ({
        ...tx,
        needsClarification: idsToClarify.includes(tx.id)
    }));

    return finalTransactions;
};

const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', { month: 'short', year: 'numeric' });
}

// Обновленная функция для генерации финансового отчета по МСФО/GAAP
export const generateFinancialReport = (transactions: Transaction[]): FinancialReport => {
    // Начальные значения для агрегаторов
    const monthlySummary: {
        [key: string]: {
            revenue: number,            // Общая выручка
            costOfGoodsSold: number,    // Себестоимость
            operatingExpenses: number,  // Операционные расходы
            cashInflow: number,         // Приток денежных средств
            cashOutflow: number,        // Отток денежных средств
            depreciation: number,       // Амортизация (распределенная по месяцам)
        }
    } = {};

    // Сортировка по дате
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Если нет транзакций, возвращаем пустой отчет
    if (sortedTransactions.length === 0) {
        return createEmptyFinancialReport();
    }

    // Определение периода отчета
    const firstMonthDate = new Date(sortedTransactions[0].date);
    const lastMonthDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);
    const monthsInPeriod = (lastMonthDate.getFullYear() - firstMonthDate.getFullYear()) * 12
        + (lastMonthDate.getMonth() - firstMonthDate.getMonth()) + 1;

    // Расчет капитальных затрат и амортизации
    let totalCapitalExpenditures = 0;
    sortedTransactions.forEach(tx => {
        if (tx.type === 'expense' && tx.isCapitalized) {
            totalCapitalExpenditures += tx.amount;
        }
    });

    // Расчет амортизации - прямолинейный метод на 3 года (36 месяцев)
    const monthlyDepreciation = totalCapitalExpenditures > 0 ? totalCapitalExpenditures / 36 : 0;
    const totalDepreciation = monthlyDepreciation * monthsInPeriod;

    // Учетные категории для расходов
    const expenseByCategory: { [key: string]: number } = {};

    // Агрегирование по месяцам и категориям
    sortedTransactions.forEach(tx => {
        const month = getMonthYear(tx.date);
        if (!monthlySummary[month]) {
            monthlySummary[month] = {
                revenue: 0,
                costOfGoodsSold: 0,
                operatingExpenses: 0,
                cashInflow: 0,
                cashOutflow: 0,
                depreciation: monthlyDepreciation
            };
        }

        if (tx.type === 'income') {
            // Доходы
            monthlySummary[month].cashInflow += tx.amount;
            if (tx.transactionType === 'operating') {
                monthlySummary[month].revenue += tx.amount;
            }
        } else {
            // Расходы
            monthlySummary[month].cashOutflow += tx.amount;

            // Классификация операционных расходов
            if (tx.transactionType === 'operating' && !tx.isCapitalized) {
                // Определение себестоимости vs операционные расходы
                const isCogsCategory = [
                    'Закупка товаров',
                    'Сырье и материалы',
                    'Производственная зарплата',
                    'Производственная аренда',
                    'Производственные услуги'
                ].includes(tx.category);

                if (isCogsCategory) {
                    monthlySummary[month].costOfGoodsSold += tx.amount;
                } else {
                    monthlySummary[month].operatingExpenses += tx.amount;
                }

                // Накопление расходов по категориям
                expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
            }
        }
    });

    // Если есть амортизация, добавляем ее в расходы по категориям
    if (totalDepreciation > 0) {
        expenseByCategory['Амортизация'] = totalDepreciation;
    }

    // Сортировка месяцев хронологически
    const sortedMonths = Object.keys(monthlySummary).sort((a, b) => {
        const [monthA, yearA] = a.split(' г.');
        const [monthB, yearB] = b.split(' г.');
        const dateA = new Date(`${yearA} ${monthA} 1`);
        const dateB = new Date(`${yearB} ${monthB} 1`);
        return dateA.getTime() - dateB.getTime();
    });

    // ------------------- ОТЧЕТ О ПРИБЫЛЯХ И УБЫТКАХ -------------------
    // Подготовка данных по месяцам для графиков
    const pnlMonthlyData = sortedMonths.map(month => {
        const { revenue, costOfGoodsSold, operatingExpenses, depreciation } = monthlySummary[month];
        const grossProfit = revenue - costOfGoodsSold;
        const ebitda = grossProfit - operatingExpenses;
        const ebit = ebitda - depreciation;

        return {
            month,
            'Доход': revenue,
            'Себестоимость': costOfGoodsSold,
            'ОперРасходы': operatingExpenses,
            'Амортизация': depreciation,
            'Прибыль': ebit
        };
    });

    // Агрегированные значения для всего периода
    const totalRevenue = pnlMonthlyData.reduce((sum, d) => sum + d['Доход'], 0);
    const totalCostOfGoodsSold = pnlMonthlyData.reduce((sum, d) => sum + d['Себестоимость'], 0);
    const totalOperatingExpenses = pnlMonthlyData.reduce((sum, d) => sum + d['ОперРасходы'], 0);

    // Расчет финансовых доходов и расходов
    const financialExpense = sortedTransactions
        .filter(tx => tx.category === 'Проценты по кредитам')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const financialIncome = sortedTransactions
        .filter(tx => ['Процентные доходы', 'Положительные курсовые разницы'].includes(tx.category))
        .reduce((sum, tx) => sum + tx.amount, 0);

    // Расчет прибыли
    const grossProfit = totalRevenue - totalCostOfGoodsSold;
    const ebitda = grossProfit - totalOperatingExpenses;
    const ebit = ebitda - totalDepreciation;
    const ebt = ebit + financialIncome - financialExpense;

    // Расчет налога на прибыль (20%)
    const taxRate = 0.20;
    const taxes = Math.max(0, ebt * taxRate);
    const netProfit = ebt - taxes;

    // Расчет финансовых коэффициентов
    const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;
    const operatingMargin = totalRevenue > 0 ? ebit / totalRevenue : 0;
    const netMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;

    // Итоговый объект ОПиУ
    const pnl: PnLData = {
        totalRevenue,
        costOfGoodsSold: totalCostOfGoodsSold,
        grossProfit,
        totalOperatingExpenses,
        ebitda,
        depreciation: totalDepreciation,
        ebit,
        financialExpense,
        financialIncome,
        ebt,
        taxes,
        netProfit,
        monthlyData: pnlMonthlyData,
        expenseByCategory: Object.entries(expenseByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value),
        ratios: {
            grossMargin,
            operatingMargin,
            netMargin,
            roa: 0, // Будет рассчитано после формирования баланса
            roe: 0  // Будет рассчитано после формирования баланса
        }
    };

    // ------------------- ОТЧЕТ О ДВИЖЕНИИ ДЕНЕЖНЫХ СРЕДСТВ -------------------
    // Данные по месяцам для графиков ДДС
    const cashFlowMonthlyData = sortedMonths.map(month => {
        const { cashInflow, cashOutflow } = monthlySummary[month];
        return {
            month,
            'Поступления': cashInflow,
            'Выбытия': cashOutflow,
            'Чистый поток': cashInflow - cashOutflow
        };
    });

    // Разделение по видам деятельности
    const operatingActivities = transactions
        .filter(tx => tx.transactionType === 'operating')
        .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

    const investingActivities = transactions
        .filter(tx => tx.transactionType === 'investing')
        .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

    const financingActivities = transactions
        .filter(tx => tx.transactionType === 'financing')
        .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

    // Детализация операционной деятельности
    const operatingDetails = {
        fromNetIncome: netProfit,
        depreciation: totalDepreciation,
        workingCapitalChanges: operatingActivities - netProfit - totalDepreciation
    };

    // Детализация инвестиционной деятельности
    const capitalExpenditures = -sortedTransactions
        .filter(tx => tx.type === 'expense' && tx.isCapitalized)
        .reduce((sum, tx) => sum + tx.amount, 0);

    const assetDisposals = sortedTransactions
        .filter(tx => tx.category === 'Продажа активов')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const investingDetails = {
        capitalExpenditures,
        assetDisposals,
        investments: investingActivities - capitalExpenditures - assetDisposals
    };

    // Детализация финансовой деятельности
    const debtProceeds = sortedTransactions
        .filter(tx => tx.category === 'Получение кредита')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const debtRepayments = -sortedTransactions
        .filter(tx => tx.category === 'Погашение кредита')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const dividends = -sortedTransactions
        .filter(tx => tx.category === 'Выплата дивидендов')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const equityChanges = sortedTransactions
        .filter(tx => tx.category === 'Взнос учредителя')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const financingDetails = {
        debtProceeds,
        debtRepayments,
        dividends,
        equityChanges
    };

    // Итоговый объект ДДС
    const cashFlow: CashFlowData = {
        netCashFlow: operatingActivities + investingActivities + financingActivities,
        operatingActivities,
        investingActivities,
        financingActivities,
        operatingDetails,
        investingDetails,
        financingDetails,
        monthlyData: cashFlowMonthlyData,
        liquidity: {
            operatingCashFlowRatio: 0, // Будет рассчитано после формирования баланса
            cashConversionCycle: 45    // Значение по умолчанию, в реальности зависит от данных
        }
    };

    // ------------------- БАЛАНС -------------------
    // Оборотные активы
    const cash = operatingActivities + investingActivities + financingActivities;
    const accountsReceivable = totalRevenue * 0.1; // Условно 10% от выручки
    const inventory = totalCostOfGoodsSold * 0.15; // Условно 15% от себестоимости
    const prepaidExpenses = totalOperatingExpenses * 0.05; // Условно 5% от операционных расходов
    const totalCurrentAssets = cash + accountsReceivable + inventory + prepaidExpenses;

    // Внеоборотные активы
    const equipment = totalCapitalExpenditures;
    const accumulatedDepreciation = -totalDepreciation;
    const netEquipment = equipment + accumulatedDepreciation;
    const totalNonCurrentAssets = netEquipment;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    // Краткосрочные обязательства
    const accountsPayable = totalCostOfGoodsSold * 0.08; // Условно 8% от себестоимости
    const accruedExpenses = totalOperatingExpenses * 0.03; // Условно 3% от операционных расходов
    const taxesPayable = taxes;
    const totalCurrentLiabilities = accountsPayable + accruedExpenses + taxesPayable;

    // Долгосрочные обязательства
    const loansPayable = debtProceeds - debtRepayments;
    const totalNonCurrentLiabilities = loansPayable;
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    // Капитал
    const authorizedCapital = equityChanges;
    const ownerWithdrawals = sortedTransactions
        .filter(tx => ['Личные траты', 'Выплата дивидендов'].includes(tx.category))
        .reduce((sum, tx) => sum + tx.amount, 0);

    const retainedEarnings = netProfit - dividends;
    const totalEquity = authorizedCapital + retainedEarnings - ownerWithdrawals;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    // Расчет коэффициентов
    const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const quickRatio = totalCurrentLiabilities > 0 ? (totalCurrentAssets - inventory) / totalCurrentLiabilities : 0;
    const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
    const assetTurnover = totalAssets > 0 ? totalRevenue / totalAssets : 0;

    // Итоговый объект баланса
    const balanceSheet: BalanceSheetData = {
        assets: {
            cash,
            accountsReceivable,
            inventory,
            shortTermInvestments: 0,
            prepaidExpenses,
            totalCurrentAssets,
            equipment,
            realEstate: 0,
            intangibleAssets: 0,
            longTermInvestments: 0,
            accumulatedDepreciation,
            netEquipment,
            totalNonCurrentAssets,
            totalAssets
        },
        liabilities: {
            accountsPayable,
            shortTermLoans: 0,
            accruedExpenses,
            taxesPayable,
            totalCurrentLiabilities,
            loansPayable,
            deferredTaxes: 0,
            totalNonCurrentLiabilities,
            totalLiabilities
        },
        equity: {
            authorizedCapital,
            retainedEarnings,
            ownerContributions: equityChanges,
            ownerWithdrawals,
            totalEquity
        },
        totalLiabilitiesAndEquity,
        ratios: {
            currentRatio,
            quickRatio,
            debtToEquity,
            assetTurnover
        }
    };

    // Обновление дополнительных коэффициентов, зависящих от баланса
    pnl.ratios.roa = totalAssets > 0 ? netProfit / totalAssets : 0;
    pnl.ratios.roe = totalEquity > 0 ? netProfit / totalEquity : 0;
    cashFlow.liquidity.operatingCashFlowRatio = totalCurrentLiabilities > 0 ? operatingActivities / totalCurrentLiabilities : 0;

    // Итоговый финансовый отчет
    return {
        pnl,
        cashFlow,
        balanceSheet
    };
};

// Вспомогательная функция для создания пустого отчета
const createEmptyFinancialReport = (): FinancialReport => {
    return {
        pnl: {
            totalRevenue: 0,
            costOfGoodsSold: 0,
            grossProfit: 0,
            totalOperatingExpenses: 0,
            ebitda: 0,
            depreciation: 0,
            ebit: 0,
            financialExpense: 0,
            financialIncome: 0,
            ebt: 0,
            taxes: 0,
            netProfit: 0,
            monthlyData: [],
            expenseByCategory: [],
            ratios: {
                grossMargin: 0,
                operatingMargin: 0,
                netMargin: 0,
                roa: 0,
                roe: 0
            }
        },
        cashFlow: {
            netCashFlow: 0,
            operatingActivities: 0,
            investingActivities: 0,
            financingActivities: 0,
            operatingDetails: {
                fromNetIncome: 0,
                depreciation: 0,
                workingCapitalChanges: 0
            },
            investingDetails: {
                capitalExpenditures: 0,
                assetDisposals: 0,
                investments: 0
            },
            financingDetails: {
                debtProceeds: 0,
                debtRepayments: 0,
                equityChanges: 0,
                dividends: 0
            },
            monthlyData: [],
            liquidity: {
                operatingCashFlowRatio: 0,
                cashConversionCycle: 0
            }
        },
        balanceSheet: {
            assets: {
                cash: 0,
                accountsReceivable: 0,
                inventory: 0,
                shortTermInvestments: 0,
                prepaidExpenses: 0,
                totalCurrentAssets: 0,
                equipment: 0,
                realEstate: 0,
                intangibleAssets: 0,
                longTermInvestments: 0,
                accumulatedDepreciation: 0,
                netEquipment: 0,
                totalNonCurrentAssets: 0,
                totalAssets: 0
            },
            liabilities: {
                accountsPayable: 0,
                shortTermLoans: 0,
                accruedExpenses: 0,
                taxesPayable: 0,
                totalCurrentLiabilities: 0,
                loansPayable: 0,
                deferredTaxes: 0,
                totalNonCurrentLiabilities: 0,
                totalLiabilities: 0
            },
            equity: {
                authorizedCapital: 0,
                retainedEarnings: 0,
                ownerContributions: 0,
                ownerWithdrawals: 0,
                totalEquity: 0
            },
            totalLiabilitiesAndEquity: 0,
            ratios: {
                currentRatio: 0,
                quickRatio: 0,
                debtToEquity: 0,
                assetTurnover: 0
            }
        }
    };
};