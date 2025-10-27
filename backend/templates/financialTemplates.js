// Полные финансовые шаблоны для всех 14 бизнес-моделей

const getFinancialTemplates = () => {
  return {
    'coffee-shop': {
      assumptions: {
        seats: 20,
        avg_check: 1500,
        working_hours: 12,
        working_days: 365,
        tax_rate: 0.20,
        rent_per_month: 500000,
        staff_cost: 300000,
        food_cost_percent: 0.35,
        growth_rate: 0.15,
        wacc: 0.18,
        occupancy_rate: 0.60,
        operating_expenses_percent: 0.25
      },
      sheets: [
        {
          id: 'assumptions',
          name: 'Предпосылки',
          type: 'assumptions',
          icon: '⚙️',
          data: [
            ['Параметр', 'Значение', 'Единица'],
            ['Количество мест', 20, 'шт'],
            ['Средний чек', 1500, 'тенге'],
            ['Часы работы в день', 12, 'часов'],
            ['Рабочих дней в году', 365, 'дней'],
            ['Налоговая ставка', 0.20, '%'],
            ['Аренда в месяц', 500000, 'тенге'],
            ['Расходы на персонал', 300000, 'тенге/мес'],
            ['Себестоимость еды', 0.35, '% от выручки'],
            ['Темп роста', 0.15, '%'],
            ['Загрузка зала', 0.60, '%']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'revenue',
          name: 'Выручка',
          type: 'revenue',
          icon: '💰',
          data: [
            ['Показатель', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Посетителей в день, человек', '=assumptions!B2*assumptions!B11', '=B2*(1+assumptions!B10)', '=C2*(1+assumptions!B10)', '=D2*(1+assumptions!B10)', '=E2*(1+assumptions!B10)'],
            ['Средний чек, тенге', '=assumptions!B3', '=B3*(1+assumptions!B10)', '=C3*(1+assumptions!B10)', '=D3*(1+assumptions!B10)', '=E3*(1+assumptions!B10)'],
            ['Выручка в день, тенге', '=B2*B3', '=C2*C3', '=D2*D3', '=E2*E3', '=F2*F3'],
            ['Выручка в месяц, тенге', '=B4*30', '=C4*30', '=D4*30', '=E4*30', '=F4*30'],
            ['Выручка в год, тенге', '=B5*12', '=C5*12', '=D5*12', '=E5*12', '=F5*12']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'expenses',
          name: 'Расходы',
          type: 'expenses',
          icon: '📊',
          data: [
            ['Статья расходов', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Себестоимость продуктов, тенге', '=revenue!B6*assumptions!B9', '=revenue!C6*assumptions!B9', '=revenue!D6*assumptions!B9', '=revenue!E6*assumptions!B9', '=revenue!F6*assumptions!B9'],
            ['Аренда помещения, тенге', '=assumptions!B7*12', '=B3*(1+assumptions!B10)', '=C3*(1+assumptions!B10)', '=D3*(1+assumptions!B10)', '=E3*(1+assumptions!B10)'],
            ['Фонд оплаты труда, тенге', '=assumptions!B8*12', '=B4*(1+assumptions!B10)', '=C4*(1+assumptions!B10)', '=D4*(1+assumptions!B10)', '=E4*(1+assumptions!B10)'],
            ['Коммунальные услуги, тенге', '=B3*0.06', '=C3*0.06', '=D3*0.06', '=E3*0.06', '=F3*0.06'],
            ['Маркетинг и реклама, тенге', '=revenue!B6*0.02', '=revenue!C6*0.02', '=revenue!D6*0.02', '=revenue!E6*0.02', '=revenue!F6*0.02'],
            ['Прочие операционные расходы, тенге', '=revenue!B6*0.03', '=revenue!C6*0.03', '=revenue!D6*0.03', '=revenue!E6*0.03', '=revenue!F6*0.03'],
            ['Итого операционные расходы, тенге', '=SUM(B2:B7)', '=SUM(C2:C7)', '=SUM(D2:D7)', '=SUM(E2:E7)', '=SUM(F2:F7)']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'pnl',
          name: 'P&L',
          type: 'pnl',
          icon: '📋',
          data: [
            ['P&L', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Выручка, тенге', '=revenue!B6', '=revenue!C6', '=revenue!D6', '=revenue!E6', '=revenue!F6'],
            ['Операционные расходы, тенге', '=expenses!B8', '=expenses!C8', '=expenses!D8', '=expenses!E8', '=expenses!F8'],
            ['EBITDA, тенге', '=B2-B3', '=C2-C3', '=D2-D3', '=E2-E3', '=F2-F3'],
            ['Амортизация, тенге', 200000, 200000, 200000, 200000, 200000],
            ['EBIT, тенге', '=B4-B5', '=C4-C5', '=D4-D5', '=E4-E5', '=F4-F5'],
            ['Налоги, тенге', '=MAX(0,B6*assumptions!B6)', '=MAX(0,C6*assumptions!B6)', '=MAX(0,D6*assumptions!B6)', '=MAX(0,E6*assumptions!B6)', '=MAX(0,F6*assumptions!B6)'],
            ['Чистая прибыль, тенге', '=B6-B7', '=C6-C7', '=D6-D7', '=E6-E7', '=F6-F7'],
            ['Рентабельность по чистой прибыли, %', '=B8/B2*100', '=C8/C2*100', '=D8/D2*100', '=E8/E2*100', '=F8/F2*100']
          ],
          formulas: {},
          validations: {}
        }
      ]
    },

    'saas-startup': {
      assumptions: {
        initial_users: 100,
        monthly_price: 50,
        annual_discount: 0.15,
        churn_rate: 0.05,
        growth_rate: 0.20,
        cac: 300,
        ltv_cac_ratio: 3,
        gross_margin: 0.85,
        tax_rate: 0.20
      },
      sheets: [
        {
          id: 'assumptions',
          name: 'Предпосылки',
          type: 'assumptions',
          icon: '⚙️',
          data: [
            ['Параметр', 'Значение', 'Единица'],
            ['Начальные пользователи', 100, 'шт'],
            ['Месячная подписка', 50, 'USD'],
            ['Скидка на годовой план', 0.15, '%'],
            ['Месячный отток (Churn)', 0.05, '%'],
            ['Темп роста пользователей', 0.20, '%'],
            ['CAC (стоимость привлечения)', 300, 'USD'],
            ['Валовая маржа', 0.85, '%'],
            ['Налоговая ставка', 0.20, '%']
          ]
        },
        {
          id: 'revenue',
          name: 'Выручка',
          type: 'revenue',
          icon: '💰',
          data: [
            ['Показатель', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Активные пользователи', '=assumptions!B2*(1+assumptions!B5)^12', '=B2*(1+assumptions!B5)^12', '=C2*(1+assumptions!B5)^12', '=D2*(1+assumptions!B5)^12', '=E2*(1+assumptions!B5)^12'],
            ['MRR (месячная выручка), USD', '=B2*assumptions!B3', '=C2*assumptions!B3', '=D2*assumptions!B3', '=E2*assumptions!B3', '=F2*assumptions!B3'],
            ['ARR (годовая выручка), USD', '=B3*12', '=C3*12', '=D3*12', '=E3*12', '=F3*12']
          ]
        },
        {
          id: 'expenses',
          name: 'Расходы',
          type: 'expenses',
          icon: '📊',
          data: [
            ['Статья расходов', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Себестоимость (15% от выручки)', '=revenue!B4*(1-assumptions!B7)', '=revenue!C4*(1-assumptions!B7)', '=revenue!D4*(1-assumptions!B7)', '=revenue!E4*(1-assumptions!B7)', '=revenue!F4*(1-assumptions!B7)'],
            ['Маркетинг (CAC * новые пользователи)', '=(revenue!B2-assumptions!B2)*assumptions!B6', '=(revenue!C2-revenue!B2)*assumptions!B6', '=(revenue!D2-revenue!C2)*assumptions!B6', '=(revenue!E2-revenue!D2)*assumptions!B6', '=(revenue!F2-revenue!E2)*assumptions!B6'],
            ['Зарплаты команды', '=revenue!B4*0.8', '=B4*1.5', '=C4*1.5', '=D4*1.5', '=E4*1.5'],
            ['Инфраструктура и сервисы', '=revenue!B4*0.08', '=C5*2', '=D5*2', '=E5*2', '=F5*2'],
            ['Операционные расходы', '=revenue!B4*0.14', '=B6*1.5', '=C6*1.5', '=D6*1.5', '=E6*1.5']
          ]
        },
        {
          id: 'pnl',
          name: 'P&L',
          type: 'pnl',
          icon: '📋',
          data: [
            ['P&L', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Выручка (ARR)', '=revenue!B4', '=revenue!C4', '=revenue!D4', '=revenue!E4', '=revenue!F4'],
            ['Валовая прибыль', '=B2*assumptions!B7', '=C2*assumptions!B7', '=D2*assumptions!B7', '=E2*assumptions!B7', '=F2*assumptions!B7'],
            ['Операционные расходы', '=SUM(expenses!B3:B7)', '=SUM(expenses!C3:C7)', '=SUM(expenses!D3:D7)', '=SUM(expenses!E3:E7)', '=SUM(expenses!F3:F7)'],
            ['EBITDA', '=B3-B4', '=C3-C4', '=D3-D4', '=E3-E4', '=F3-F4'],
            ['Чистая прибыль', '=B5*(1-assumptions!B8)', '=C5*(1-assumptions!B8)', '=D5*(1-assumptions!B8)', '=E5*(1-assumptions!B8)', '=F5*(1-assumptions!B8)']
          ]
        }
      ]
    },

    'retail-store': {
      assumptions: {
        store_area: 200,
        daily_customers: 50,
        avg_check: 3000,
        gross_margin: 0.40,
        rent_per_sqm: 500,
        staff_count: 5,
        staff_salary: 150000,
        growth_rate: 0.12
      },
      sheets: [
        {
          id: 'assumptions',
          name: 'Предпосылки',
          type: 'assumptions',
          icon: '⚙️',
          data: [
            ['Параметр', 'Значение', 'Единица'],
            ['Площадь магазина', 200, 'м²'],
            ['Покупателей в день', 50, 'чел'],
            ['Средний чек', 3000, 'тенге'],
            ['Валовая маржа', 0.40, '%'],
            ['Аренда за м²', 500, 'тенге/м²'],
            ['Количество сотрудников', 5, 'чел'],
            ['Зарплата сотрудника', 150000, 'тенге/мес']
          ]
        },
        {
          id: 'revenue',
          name: 'Выручка',
          type: 'revenue',
          icon: '💰',
          data: [
            ['Показатель', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Покупателей в день', 50, 56, 63, 70, 79],
            ['Средний чек, тенге', 3000, 3360, 3763, 4214, 4720],
            ['Выручка в день, тенге', 150000, 188160, 236169, 294929, 372921],
            ['Выручка в год, тенге', 54750000, 68688400, 86201485, 107629135, 136106215]
          ]
        },
        {
          id: 'expenses',
          name: 'Расходы',
          type: 'expenses',
          icon: '📊',
          data: [
            ['Статья расходов', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Себестоимость товаров (60%)', 32850000, 41213040, 51720891, 64577481, 81663729],
            ['Аренда помещения', 1200000, 1344000, 1505280, 1685714, 1888000],
            ['Фонд оплаты труда', 9000000, 10080000, 11289600, 12644352, 14161674],
            ['Коммунальные услуги', 240000, 268800, 301056, 337343, 377824],
            ['Маркетинг', 547500, 686884, 862015, 1076291, 1361062]
          ]
        },
        {
          id: 'pnl',
          name: 'P&L',
          type: 'pnl',
          icon: '📋',
          data: [
            ['P&L', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Выручка', 54750000, 68688400, 86201485, 107629135, 136106215],
            ['Валовая прибыль', 21900000, 27475360, 34480594, 43051654, 54442486],
            ['Операционные расходы', 10987500, 12379684, 13957951, 15763696, 17788560],
            ['EBITDA', 10912500, 15095676, 20522643, 27287958, 36653926],
            ['Чистая прибыль', 8730000, 12076541, 16418114, 21830366, 29323141]
          ]
        }
      ]
    },

    'manufacturing': {
      assumptions: {
        production_capacity: 1000,
        unit_price: 15000,
        unit_cost: 9000,
        fixed_costs: 2000000,
        capex_investment: 10000000,
        depreciation_rate: 0.10,
        tax_rate: 0.20,
        working_capital_percent: 0.15
      },
      sheets: [
        {
          id: 'assumptions',
          name: 'Предпосылки',
          type: 'assumptions',
          icon: '⚙️',
          data: [
            ['Параметр', 'Значение', 'Единица'],
            ['Производственная мощность', 1000, 'ед/мес'],
            ['Цена за единицу', 15000, 'тенге'],
            ['Себестоимость единицы', 9000, 'тенге'],
            ['Постоянные расходы', 2000000, 'тенге/мес'],
            ['Капитальные вложения', 10000000, 'тенге'],
            ['Норма амортизации', 0.10, '%'],
            ['Налоговая ставка', 0.20, '%']
          ]
        },
        {
          id: 'revenue',
          name: 'Выручка',
          type: 'revenue',
          icon: '💰',
          data: [
            ['Показатель', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Объем производства, ед', 8000, 9600, 10800, 11520, 12000],
            ['Цена за единицу, тенге', 15000, 15750, 16538, 17364, 18233],
            ['Выручка, тенге', 120000000, 151200000, 178606080, 199987200, 218790000]
          ]
        },
        {
          id: 'expenses',
          name: 'Расходы',
          type: 'expenses',
          icon: '📊',
          data: [
            ['Статья расходов', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Переменные расходы', 72000000, 86400000, 97200000, 103680000, 108000000],
            ['Постоянные расходы', 24000000, 25200000, 26460000, 27783000, 29172150],
            ['Амортизация', 1000000, 1000000, 1000000, 1000000, 1000000],
            ['Итого операционные расходы', 97000000, 112600000, 124660000, 132463000, 138172150]
          ]
        },
        {
          id: 'pnl',
          name: 'P&L',
          type: 'pnl',
          icon: '📋',
          data: [
            ['P&L', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Выручка', 120000000, 151200000, 178606080, 199987200, 218790000],
            ['Операционные расходы', 97000000, 112600000, 124660000, 132463000, 138172150],
            ['EBITDA', 23000000, 38600000, 53946080, 67524200, 80617850],
            ['EBIT', 22000000, 37600000, 52946080, 66524200, 79617850],
            ['Чистая прибыль', 17600000, 30080000, 42356864, 53219360, 63694280]
          ]
        }
      ]
    },

    'ecommerce': {
      assumptions: {
        monthly_visitors: 10000,
        conversion_rate: 0.02,
        avg_order_value: 8000,
        cac: 1200,
        return_rate: 0.08,
        fulfillment_cost_percent: 0.15,
        marketing_percent: 0.25
      },
      sheets: [
        {
          id: 'assumptions',
          name: 'Предпосылки',
          type: 'assumptions',
          icon: '⚙️',
          data: [
            ['Параметр', 'Значение', 'Единица'],
            ['Посетителей сайта в месяц', 10000, 'чел'],
            ['Конверсия в покупку', 0.02, '%'],
            ['Средняя сумма заказа', 8000, 'тенге'],
            ['CAC (стоимость привлечения)', 1200, 'тенге'],
            ['Возврат товаров', 0.08, '%'],
            ['Стоимость выполнения заказа', 0.15, '% от выручки'],
            ['Маркетинг', 0.25, '% от выручки']
          ]
        },
        {
          id: 'revenue',
          name: 'Выручка',
          type: 'revenue',
          icon: '💰',
          data: [
            ['Показатель', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Посетителей в месяц', '=assumptions!B2', '=B2*1.5', '=C2*1.5', '=D2*1.5', '=E2*1.5'],
            ['Заказов в месяц', '=B2*assumptions!B3', '=C2*assumptions!B3', '=D2*assumptions!B3', '=E2*assumptions!B3', '=F2*assumptions!B3'],
            ['Средняя сумма заказа', '=assumptions!B4', '=B4*1.05', '=C4*1.05', '=D4*1.05', '=E4*1.05'],
            ['Выручка в месяц', '=B3*B4', '=C3*C4', '=D3*D4', '=E3*E4', '=F3*F4'],
            ['Выручка в год', '=B5*12', '=C5*12', '=D5*12', '=E5*12', '=F5*12']
          ]
        },
        {
          id: 'expenses',
          name: 'Расходы',
          type: 'expenses',
          icon: '📊',
          data: [
            ['Статья расходов', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Себестоимость товаров', '=revenue!B6*0.6', '=revenue!C6*0.6', '=revenue!D6*0.6', '=revenue!E6*0.6', '=revenue!F6*0.6'],
            ['Маркетинг и реклама', '=revenue!B6*assumptions!B8', '=revenue!C6*assumptions!B8', '=revenue!D6*assumptions!B8', '=revenue!E6*assumptions!B8', '=revenue!F6*assumptions!B8'],
            ['Логистика и фулфилмент', '=revenue!B6*assumptions!B7', '=revenue!C6*assumptions!B7', '=revenue!D6*assumptions!B7', '=revenue!E6*assumptions!B7', '=revenue!F6*assumptions!B7'],
            ['Операционные расходы', '=revenue!B6*0.075', '=revenue!C6*0.075', '=revenue!D6*0.075', '=revenue!E6*0.075', '=revenue!F6*0.075']
          ]
        },
        {
          id: 'pnl',
          name: 'P&L',
          type: 'pnl',
          icon: '📋',
          data: [
            ['P&L', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Выручка', '=revenue!B6', '=revenue!C6', '=revenue!D6', '=revenue!E6', '=revenue!F6'],
            ['Валовая прибыль', '=B2-expenses!B2', '=C2-expenses!C2', '=D2-expenses!D2', '=E2-expenses!E2', '=F2-expenses!F2'],
            ['Операционные расходы', '=SUM(expenses!B3:B5)', '=SUM(expenses!C3:C5)', '=SUM(expenses!D3:D5)', '=SUM(expenses!E3:E5)', '=SUM(expenses!F3:F5)'],
            ['EBITDA', '=B3-B4', '=C3-C4', '=D3-D4', '=E3-E4', '=F3-F4'],
            ['Чистая прибыль', '=B5', '=C5', '=D5', '=E5', '=F5']
          ]
        }
      ]
    },

    'consulting': {
      assumptions: {
        consultants_count: 3,
        hourly_rate: 5000,
        billable_hours_per_month: 120,
        utilization_rate: 0.75,
        overhead_percent: 0.30,
        salary_per_consultant: 350000,
        growth_rate: 0.25
      },
      sheets: [
        {
          id: 'assumptions',
          name: 'Предпосылки',
          type: 'assumptions',
          icon: '⚙️',
          data: [
            ['Параметр', 'Значение', 'Единица'],
            ['Количество консультантов', 3, 'чел'],
            ['Часовая ставка', 5000, 'тенге/час'],
            ['Оплачиваемых часов в месяц', 120, 'час'],
            ['Коэффициент загрузки', 0.75, '%'],
            ['Накладные расходы', 0.30, '% от выручки'],
            ['Зарплата консультанта', 350000, 'тенге/мес']
          ]
        },
        {
          id: 'revenue',
          name: 'Выручка',
          type: 'revenue',
          icon: '💰',
          data: [
            ['Показатель', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Количество консультантов', 3, 4, 5, 6, 8],
            ['Часовая ставка, тенге', 5000, 5250, 5513, 5788, 6078],
            ['Оплачиваемых часов в месяц', 90, 90, 90, 90, 90],
            ['Выручка в месяц, тенге', 1350000, 1890000, 2756250, 3787800, 5834400],
            ['Выручка в год, тенге', 16200000, 22680000, 33075000, 45453600, 70012800]
          ]
        },
        {
          id: 'expenses',
          name: 'Расходы',
          type: 'expenses',
          icon: '📊',
          data: [
            ['Статья расходов', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Фонд оплаты труда', 12600000, 16800000, 21000000, 25200000, 33600000],
            ['Накладные расходы', 4860000, 6804000, 9922500, 13636080, 21003840],
            ['Офисные расходы', 600000, 720000, 900000, 1080000, 1440000],
            ['Маркетинг', 324000, 453600, 661500, 909072, 1400256]
          ]
        },
        {
          id: 'pnl',
          name: 'P&L',
          type: 'pnl',
          icon: '📋',
          data: [
            ['P&L', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Выручка', 16200000, 22680000, 33075000, 45453600, 70012800],
            ['Операционные расходы', 18384000, 24777600, 32484000, 40825152, 56444096],
            ['EBITDA', -2184000, -2097600, 591000, 4628448, 13568704],
            ['Чистая прибыль', -2184000, -2097600, 472800, 3702758, 10854963]
          ]
        }
      ]
    },

    'real-estate': {
      assumptions: {
        units_count: 20,
        avg_rent_per_unit: 250000,
        occupancy_rate: 0.9,
        operating_expenses_percent: 0.18,
        maintenance_percent: 0.05,
        property_tax_rate: 0.01,
        annual_rent_growth: 0.05,
        capex_reserve_per_year: 2000000
      },
      sheets: [
        {
          id: 'assumptions',
          name: 'Предпосылки',
          type: 'assumptions',
          icon: '⚙️',
          data: [
            ['Параметр', 'Значение', 'Единица'],
            ['Количество объектов (квартир)', 20, 'шт'],
            ['Средняя аренда за единицу', 250000, 'тенге/мес'],
            ['Заполняемость', 0.9, '%'],
            ['Опер. расходы', 0.18, '% от выручки'],
            ['Обслуживание (maintenance)', 0.05, '% от выручки'],
            ['Налог на имущество', 0.01, '% от выручки'],
            ['Рост аренды ежегодно', 0.05, '%'],
            ['CAPEX-резерв в год', 2000000, 'тенге']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'revenue',
          name: 'Выручка',
          type: 'revenue',
          icon: '💰',
          data: [
            ['Показатель', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Ежемесячная аренда (все объекты), тенге', '=assumptions!B2*assumptions!B3', '=B2*1.05', '=C2*1.05', '=D2*1.05', '=E2*1.05'],
            ['Коэффициент заполняемости', '=assumptions!B4', '=assumptions!B4', '=assumptions!B5', '=assumptions!B6', '=assumptions!B7'],
            ['Эффективная ежемесячная выручка, тенге', '=B2*B3', '=C2*C3', '=D2*D3', '=E2*E3', '=F2*F3'],
            ['Выручка в год, тенге', '=B4*12', '=C4*12', '=D4*12', '=E4*12', '=F4*12']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'expenses',
          name: 'Расходы',
          type: 'expenses',
          icon: '📊',
          data: [
            ['Статья расходов', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Опер. расходы (18%)', '=revenue!B5*assumptions!B5', '=revenue!C5*assumptions!B5', '=revenue!D5*assumptions!B5', '=revenue!E5*assumptions!B5', '=revenue!F5*assumptions!B5'],
            ['Обслуживание (5%)', '=revenue!B5*assumptions!B6', '=revenue!C5*assumptions!B6', '=revenue!D5*assumptions!B6', '=revenue!E5*assumptions!B6', '=revenue!F5*assumptions!B6'],
            ['Налог на имущество (1%)', '=revenue!B5*assumptions!B7', '=revenue!C5*assumptions!B7', '=revenue!D5*assumptions!B7', '=revenue!E5*assumptions!B7', '=revenue!F5*assumptions!B7'],
            ['CAPEX-резерв', '=assumptions!B9', '=assumptions!B9', '=assumptions!B9*1.1', '=assumptions!B9*1.1', '=assumptions!B9*1.2'],
            ['Итого расходы', '=B2+B3+B4+B5', '=C2+C3+C4+C5', '=D2+D3+D4+D5', '=E2+E3+E4+E5', '=F2+F3+F4+F5']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'pnl',
          name: 'P&L',
          type: 'pnl',
          icon: '📋',
          data: [
            ['P&L', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Выручка', '=revenue!B5', '=revenue!C5', '=revenue!D5', '=revenue!E5', '=revenue!F5'],
            ['Расходы', '=expenses!B6', '=expenses!C6', '=expenses!D6', '=expenses!E6', '=expenses!F6'],
            ['EBITDA', '=B2-B3', '=C2-C3', '=D2-D3', '=E2-E3', '=F2-F3'],
            ['Чистая прибыль', '=B4*(1-assumptions!B8)', '=C4*(1-assumptions!B8)', '=D4*(1-assumptions!B8)', '=E4*(1-assumptions!B8)', '=F4*(1-assumptions!B8)']
          ],
          formulas: {},
          validations: {}
        }
      ]
    },

    'medical-clinic': {
      assumptions: {
        doctors_count: 5,
        patients_per_day_per_doctor: 12,
        avg_ticket: 8000,
        working_days_per_month: 22,
        consumables_percent: 0.12,
        rent_per_month: 1500000,
        admin_staff_costs: 2000000,
        marketing_percent: 0.08,
        tax_rate: 0.2
      },
      sheets: [
        {
          id: 'assumptions',
          name: 'Предпосылки',
          type: 'assumptions',
          icon: '⚙️',
          data: [
            ['Параметр', 'Значение', 'Единица'],
            ['Врачей', 5, 'чел'],
            ['Пациентов на врача в день', 12, 'чел'],
            ['Средний чек', 8000, 'тенге'],
            ['Рабочих дней в месяц', 22, 'дней'],
            ['Расходные материалы', 0.12, '% от выручки'],
            ['Аренда в месяц', 1500000, 'тенге'],
            ['Админ. персонал', 2000000, 'тенге/мес'],
            ['Маркетинг', 0.08, '% от выручки'],
            ['Налоговая ставка', 0.2, '%']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'revenue',
          name: 'Выручка',
          type: 'revenue',
          icon: '💰',
          data: [
            ['Показатель', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Приемов в день', '=assumptions!B2*assumptions!B3', '=B2*1.08', '=C2*1.08', '=D2*1.08', '=E2*1.08'],
            ['Средний чек, тенге', '=assumptions!B4', '=B3*1.05', '=C3*1.05', '=D3*1.05', '=E3*1.05'],
            ['Выручка в месяц, тенге', '=B2*B3*assumptions!B5', '=C2*C3*assumptions!B5', '=D2*D3*assumptions!B5', '=E2*E3*assumptions!B5', '=F2*F3*assumptions!B5'],
            ['Выручка в год, тенге', '=B4*12', '=C4*12', '=D4*12', '=E4*12', '=F4*12']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'expenses',
          name: 'Расходы',
          type: 'expenses',
          icon: '📊',
          data: [
            ['Статья расходов', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Расходные материалы (12%)', '=revenue!B5*assumptions!B6', '=revenue!C5*assumptions!B6', '=revenue!D5*assumptions!B6', '=revenue!E5*assumptions!B6', '=revenue!F5*assumptions!B6'],
            ['Маркетинг (8%)', '=revenue!B5*assumptions!B9', '=revenue!C5*assumptions!B9', '=revenue!D5*assumptions!B9', '=revenue!E5*assumptions!B9', '=revenue!F5*assumptions!B9'],
            ['Аренда помещения', '=assumptions!B7*12', '=B4*1.05', '=C4*1.05', '=D4*1.05', '=E4*1.05'],
            ['Админ. персонал', '=assumptions!B8*12', '=B5*1.05', '=C5*1.05', '=D5*1.05', '=E5*1.05']
          ],
          formulas: {},
          validations: {}
        },
        {
          id: 'pnl',
          name: 'P&L',
          type: 'pnl',
          icon: '📋',
          data: [
            ['P&L', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
            ['Выручка', '=revenue!B5', '=revenue!C5', '=revenue!D5', '=revenue!E5', '=revenue!F5'],
            ['Операционные расходы', '=expenses!B2+expenses!B3+expenses!B4+expenses!B5', '=expenses!C2+expenses!C3+expenses!C4+expenses!C5', '=expenses!D2+expenses!D3+expenses!D4+expenses!D5', '=expenses!E2+expenses!E3+expenses!E4+expenses!E5', '=expenses!F2+expenses!F3+expenses!F4+expenses!F5'],
            ['EBITDA', '=B2-B3', '=C2-C3', '=D2-D3', '=E2-E3', '=F2-F3'],
            ['Чистая прибыль', '=B4*(1-assumptions!B10)', '=C4*(1-assumptions!B10)', '=D4*(1-assumptions!B10)', '=E4*(1-assumptions!B10)', '=F4*(1-assumptions!B10)']
          ],
          formulas: {},
          validations: {}
        }
      ]
    }
  };
};

module.exports = { getFinancialTemplates };
