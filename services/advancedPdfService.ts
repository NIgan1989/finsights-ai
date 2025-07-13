import { AdvancedFinancialReport } from '../types';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import vfsFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = (vfsFonts as any).vfs;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const getRiskColor = (value: number) => {
  if (value < 0.3) return '#22c55e'; // green
  if (value < 0.7) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing': return '↗️';
    case 'decreasing': return '↘️';
    default: return '→';
  }
};

export const generateAdvancedPdfReport = (report: AdvancedFinancialReport, businessName: string = 'Бизнес') => {
  const docDefinition = {
    content: [
      // Header
      {
        text: 'ПЕРЕДОВОЙ ФИНАНСОВЫЙ ОТЧЕТ',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      {
        text: businessName,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 30]
      },
      {
        text: `Отчет сгенерирован: ${new Date().toLocaleDateString('ru-RU')}`,
        style: 'date',
        alignment: 'right',
        margin: [0, 0, 0, 20]
      },

      // Executive Summary
      {
        text: 'ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: 'Ключевые показатели',
                style: 'subsectionHeader',
                margin: [0, 0, 0, 10]
              },
              {
                text: [
                  { text: 'Выручка: ', bold: true }, formatCurrency(report.pnl.totalRevenue), '\n',
                  { text: 'Чистая прибыль: ', bold: true }, formatCurrency(report.pnl.netProfit), '\n',
                  { text: 'Рентабельность: ', bold: true }, formatPercentage(report.advancedMetrics.netProfitMargin), '\n',
                  { text: 'Денежный поток: ', bold: true }, formatCurrency(report.cashFlow.netCashFlow)
                ],
                style: 'bodyText'
              }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                text: 'Тренды',
                style: 'subsectionHeader',
                margin: [0, 0, 0, 10]
              },
              {
                text: [
                  { text: 'Выручка: ', bold: true }, getTrendIcon(report.trendAnalysis.revenueTrend), ' ', report.trendAnalysis.revenueTrend, '\n',
                  { text: 'Прибыль: ', bold: true }, getTrendIcon(report.trendAnalysis.profitTrend), ' ', report.trendAnalysis.profitTrend, '\n',
                  { text: 'Денежный поток: ', bold: true }, getTrendIcon(report.trendAnalysis.cashFlowTrend), ' ', report.trendAnalysis.cashFlowTrend
                ],
                style: 'bodyText'
              }
            ]
          }
        ]
      },

      // Financial Ratios
      {
        text: 'ФИНАНСОВЫЕ КОЭФФИЦИЕНТЫ',
        style: 'sectionHeader',
        margin: [0, 30, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Показатель', style: 'tableHeader' },
              { text: 'Значение', style: 'tableHeader' },
              { text: 'Статус', style: 'tableHeader' }
            ],
            [
              'Коэффициент текущей ликвидности',
              report.advancedMetrics.currentRatio.toFixed(2),
              report.advancedMetrics.currentRatio >= 1 ? '✅ Хорошо' : '⚠️ Требует внимания'
            ],
            [
              'Коэффициент быстрой ликвидности',
              report.advancedMetrics.quickRatio.toFixed(2),
              report.advancedMetrics.quickRatio >= 0.8 ? '✅ Хорошо' : '⚠️ Требует внимания'
            ],
            [
              'Валовая маржа',
              formatPercentage(report.advancedMetrics.grossProfitMargin),
              report.advancedMetrics.grossProfitMargin > 20 ? '✅ Отлично' : report.advancedMetrics.grossProfitMargin > 10 ? '✅ Хорошо' : '⚠️ Низкая'
            ],
            [
              'Чистая маржа',
              formatPercentage(report.advancedMetrics.netProfitMargin),
              report.advancedMetrics.netProfitMargin > 10 ? '✅ Отлично' : report.advancedMetrics.netProfitMargin > 5 ? '✅ Хорошо' : '⚠️ Низкая'
            ],
            [
              'ROE',
              formatPercentage(report.advancedMetrics.returnOnEquity),
              report.advancedMetrics.returnOnEquity > 15 ? '✅ Отлично' : report.advancedMetrics.returnOnEquity > 10 ? '✅ Хорошо' : '⚠️ Низкий'
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Risk Analysis
      {
        text: 'АНАЛИЗ РИСКОВ',
        style: 'sectionHeader',
        margin: [0, 30, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Тип риска', style: 'tableHeader' },
              { text: 'Уровень', style: 'tableHeader' },
              { text: 'Оценка', style: 'tableHeader' }
            ],
            [
              'Риск ликвидности',
              `${(report.riskMetrics.liquidityRisk * 100).toFixed(1)}%`,
              report.riskMetrics.liquidityRisk < 0.3 ? '🟢 Низкий' : report.riskMetrics.liquidityRisk < 0.7 ? '🟡 Средний' : '🔴 Высокий'
            ],
            [
              'Риск платежеспособности',
              `${(report.riskMetrics.solvencyRisk * 100).toFixed(1)}%`,
              report.riskMetrics.solvencyRisk < 0.3 ? '🟢 Низкий' : report.riskMetrics.solvencyRisk < 0.7 ? '🟡 Средний' : '🔴 Высокий'
            ],
            [
              'Операционный риск',
              `${(report.riskMetrics.operationalRisk * 100).toFixed(1)}%`,
              report.riskMetrics.operationalRisk < 0.3 ? '🟢 Низкий' : report.riskMetrics.operationalRisk < 0.7 ? '🟡 Средний' : '🔴 Высокий'
            ],
            [
              'Концентрационный риск',
              `${(report.riskMetrics.concentrationRisk * 100).toFixed(1)}%`,
              report.riskMetrics.concentrationRisk < 0.3 ? '🟢 Низкий' : report.riskMetrics.concentrationRisk < 0.7 ? '🟡 Средний' : '🔴 Высокий'
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // KPI Dashboard
      {
        text: 'КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ ЭФФЕКТИВНОСТИ',
        style: 'sectionHeader',
        margin: [0, 30, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Показатель', style: 'tableHeader' },
              { text: 'Значение', style: 'tableHeader' },
              { text: 'Описание', style: 'tableHeader' }
            ],
            [
              'Выручка на транзакцию',
              formatCurrency(report.kpis.revenuePerEmployee),
              'Средняя выручка на одну транзакцию'
            ],
            [
              'Прибыль на транзакцию',
              formatCurrency(report.kpis.profitPerTransaction),
              'Средняя прибыль на одну транзакцию'
            ],
            [
              'Цикл конвертации',
              `${report.kpis.cashConversionCycle.toFixed(0)} дней`,
              'Время от оплаты поставщикам до получения денег от клиентов'
            ],
            [
              'DSO (Дни продаж в дебиторской задолженности)',
              `${report.kpis.daysSalesOutstanding.toFixed(0)} дней`,
              'Среднее время получения оплаты от клиентов'
            ],
            [
              'DPO (Дни оплаты поставщикам)',
              `${report.kpis.daysPayablesOutstanding.toFixed(0)} дней`,
              'Среднее время оплаты поставщикам'
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Growth Analysis
      {
        text: 'АНАЛИЗ РОСТА',
        style: 'sectionHeader',
        margin: [0, 30, 0, 10]
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: 'Темпы роста',
                style: 'subsectionHeader',
                margin: [0, 0, 0, 10]
              },
              {
                text: [
                  { text: 'Рост выручки: ', bold: true }, formatPercentage(report.advancedMetrics.revenueGrowthRate), '\n',
                  { text: 'Рост прибыли: ', bold: true }, formatPercentage(report.advancedMetrics.profitGrowthRate)
                ],
                style: 'bodyText'
              }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                text: 'Сезонность',
                style: 'subsectionHeader',
                margin: [0, 0, 0, 10]
              },
              {
                text: [
                  { text: 'Пиковые месяцы: ', bold: true }, report.trendAnalysis.seasonality.peakMonths.join(', '), '\n',
                  { text: 'Низкие месяцы: ', bold: true }, report.trendAnalysis.seasonality.lowMonths.join(', '), '\n',
                  { text: 'Индекс сезонности: ', bold: true }, report.trendAnalysis.seasonality.seasonalityIndex.toFixed(2)
                ],
                style: 'bodyText'
              }
            ]
          }
        ]
      },

      // Cash Flow Analysis
      {
        text: 'АНАЛИЗ ДЕНЕЖНЫХ ПОТОКОВ',
        style: 'sectionHeader',
        margin: [0, 30, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            [
              { text: 'Показатель', style: 'tableHeader' },
              { text: 'Сумма', style: 'tableHeader' }
            ],
            [
              'Операционный денежный поток',
              formatCurrency(report.cashFlowAnalysis.operatingCashFlow)
            ],
            [
              'Инвестиционный денежный поток',
              formatCurrency(report.cashFlowAnalysis.investingCashFlow)
            ],
            [
              'Финансовый денежный поток',
              formatCurrency(report.cashFlowAnalysis.financingCashFlow)
            ],
            [
              'Свободный денежный поток',
              formatCurrency(report.cashFlowAnalysis.freeCashFlow)
            ],
            [
              'Капитальные затраты',
              formatCurrency(report.cashFlowAnalysis.capitalExpenditure)
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Alerts and Recommendations
      {
        text: 'ПРЕДУПРЕЖДЕНИЯ И РЕКОМЕНДАЦИИ',
        style: 'sectionHeader',
        margin: [0, 30, 0, 10]
      },

      // Critical Alerts
      ...(report.alerts.critical.length > 0 ? [{
        text: 'КРИТИЧЕСКИЕ ПРЕДУПРЕЖДЕНИЯ',
        style: 'alertHeader',
        color: '#dc2626',
        margin: [0, 10, 0, 5]
      }, {
        ul: report.alerts.critical.map(alert => ({ text: alert, color: '#dc2626' }))
      }] : []),

      // Warnings
      ...(report.alerts.warning.length > 0 ? [{
        text: 'ПРЕДУПРЕЖДЕНИЯ',
        style: 'alertHeader',
        color: '#d97706',
        margin: [0, 10, 0, 5]
      }, {
        ul: report.alerts.warning.map(alert => ({ text: alert, color: '#d97706' }))
      }] : []),

      // Positive Info
      ...(report.alerts.info.length > 0 ? [{
        text: 'ПОЛОЖИТЕЛЬНЫЕ МОМЕНТЫ',
        style: 'alertHeader',
        color: '#059669',
        margin: [0, 10, 0, 5]
      }, {
        ul: report.alerts.info.map(alert => ({ text: alert, color: '#059669' }))
      }] : []),

      // Recommendations
      {
        text: 'РЕКОМЕНДАЦИИ',
        style: 'subsectionHeader',
        margin: [0, 20, 0, 10]
      },
      ...(report.recommendations.length > 0 ? [{
        ul: report.recommendations.map(rec => ({ text: rec, color: '#1e40af' }))
      }] : [{
        text: 'Все показатели в норме. Продолжайте в том же духе!',
        style: 'bodyText',
        color: '#059669'
      }]),

      // Footer
      {
        text: 'Отчет сгенерирован системой FinSights AI Studio',
        style: 'footer',
        alignment: 'center',
        margin: [0, 40, 0, 0]
      }
    ],

    styles: {
      header: {
        fontSize: 24,
        bold: true,
        color: '#1e40af'
      },
      subheader: {
        fontSize: 18,
        bold: true,
        color: '#374151'
      },
      date: {
        fontSize: 12,
        color: '#6b7280'
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: '#1e40af',
        margin: [0, 20, 0, 10]
      },
      subsectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#374151'
      },
      bodyText: {
        fontSize: 12,
        color: '#374151',
        lineHeight: 1.4
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: '#ffffff',
        fillColor: '#1e40af'
      },
      alertHeader: {
        fontSize: 14,
        bold: true
      },
      footer: {
        fontSize: 10,
        color: '#6b7280',
        italic: true
      }
    },

    defaultStyle: {
      font: 'Roboto'
    }
  };

  return pdfMake.createPdf(docDefinition);
};