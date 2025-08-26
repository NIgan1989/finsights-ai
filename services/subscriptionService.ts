import { SubscriptionStatus, UserLimits, SubscriptionInfo, LimitCheckResult } from '../types';

export type { SubscriptionStatus, UserLimits, SubscriptionInfo, LimitCheckResult };

// Лимиты для разных тарифов
export const SUBSCRIPTION_LIMITS: Record<SubscriptionStatus, UserLimits> = {
  free: {
    maxProfiles: 1,
    maxTransactions: 200,
    maxAiRequests: 10, // в день
    hasAdvancedAnalytics: false,
    hasExcelExport: false,
    hasPrioritySupport: false,
    hasFinancialModeling: true, // доступна всем пользователям
    maxFileUploads: 3, // 3 загрузки банковских выписок
    maxReportDownloads: 3, // 3 скачивания отчетов на финансовой модели
    maxDashboardExports: 0, // без экспорта с дашборда
  },
  pro: {
    maxProfiles: -1, // unlimited
    maxTransactions: -1, // unlimited
    maxAiRequests: -1, // unlimited
    hasAdvancedAnalytics: true,
    hasExcelExport: true,
    hasPrioritySupport: true,
    hasFinancialModeling: true,
    maxFileUploads: -1, // безлимитные загрузки
    maxReportDownloads: -1, // безлимитные скачивания
    maxDashboardExports: -1, // безлимитные экспорты с дашборда
  },
  pending: {
    maxProfiles: 1,
    maxTransactions: 200,
    maxAiRequests: 10,
    hasAdvancedAnalytics: false,
    hasExcelExport: false,
    hasPrioritySupport: false,
    hasFinancialModeling: true,
    maxFileUploads: 3,
    maxReportDownloads: 3,
    maxDashboardExports: 0,
  },
  admin: {
    maxProfiles: -1, // unlimited
    maxTransactions: -1, // unlimited
    maxAiRequests: -1, // unlimited
    hasAdvancedAnalytics: true,
    hasExcelExport: true,
    hasPrioritySupport: true,
    hasFinancialModeling: true,
    maxFileUploads: -1, // безлимитные загрузки
    maxReportDownloads: -1, // безлимитные скачивания
    maxDashboardExports: -1, // безлимитные экспорты с дашборда
  }
};

export class SubscriptionService {
  private static instance: SubscriptionService;
  private subscriptionInfo: SubscriptionInfo | null = null;
  
  // Список администраторов с пожизненной подпиской
  private readonly lifetimeAdmins = [
    'dulat280489@gmail.com'
  ];

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  private isLifetimeAdmin(userId: string): boolean {
    const normalizedUserId = userId.toLowerCase().trim();
    const isAdmin = this.lifetimeAdmins.includes(normalizedUserId);
    return isAdmin;
  }

  // Публичный метод для проверки админских прав
  public checkIsLifetimeAdmin(userIdOrEmail: string): boolean {
    return this.isLifetimeAdmin(userIdOrEmail);
  }

  async fetchSubscriptionInfo(userIdOrEmail: string): Promise<SubscriptionInfo> {
    try {
      // Проверяем гостевой режим
      if (userIdOrEmail.startsWith('guest_')) {
        this.subscriptionInfo = {
          status: 'free',
          limits: {
            ...SUBSCRIPTION_LIMITS.free,
            // Гости не могут использовать ИИ функции и не имеют доступа к финансовой модели
            maxAiRequests: 0,
            hasFinancialModeling: false,
            maxFileUploads: 0,
            maxReportDownloads: 0,
          },
          currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
        };
        return this.subscriptionInfo;
      }

      // Проверяем, является ли пользователь администратором с пожизненной подпиской (по email)
      if (this.isLifetimeAdmin(userIdOrEmail)) {
        this.subscriptionInfo = {
          status: 'admin',
          limits: SUBSCRIPTION_LIMITS.admin,
          currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
        };
        return this.subscriptionInfo;
      }

      const response = await fetch(`/api/subscription-info?userId=${userIdOrEmail}`);
      const data = await response.json();
      
      const status: SubscriptionStatus = data.status || 'free';
      this.subscriptionInfo = {
        status,
        limits: SUBSCRIPTION_LIMITS[status],
        currentUsage: data.currentUsage || { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
      };
      
      return this.subscriptionInfo;
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
      
      // Проверяем админа и в случае ошибки
      if (this.isLifetimeAdmin(userIdOrEmail)) {
        this.subscriptionInfo = {
          status: 'admin',
          limits: SUBSCRIPTION_LIMITS.admin,
          currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
        };
        return this.subscriptionInfo;
      }
      
      // Fallback to free tier
      this.subscriptionInfo = {
        status: 'free',
        limits: SUBSCRIPTION_LIMITS.free,
        currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
      };
      return this.subscriptionInfo;
    }
  }

  getSubscriptionInfo(): SubscriptionInfo | null {
    return this.subscriptionInfo;
  }

  // Метод для синхронизации subscriptionInfo из UserContext
  setSubscriptionInfo(info: SubscriptionInfo): void {
    this.subscriptionInfo = info;
  }

  checkProfileLimit(currentProfiles: number): LimitCheckResult {
    if (!this.subscriptionInfo) {
      return { allowed: false, reason: 'Subscription info not loaded' };
    }

    const { limits } = this.subscriptionInfo;
    if (limits.maxProfiles === -1) return { allowed: true };
    
    if (currentProfiles >= limits.maxProfiles) {
      return {
        allowed: false,
        reason: `Достигнут лимит профилей (${limits.maxProfiles}). Обновитесь до PRO для неограниченных профилей.`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  checkTransactionLimit(currentTransactions: number): LimitCheckResult {
    if (!this.subscriptionInfo) {
      return { allowed: false, reason: 'Subscription info not loaded' };
    }

    const { limits } = this.subscriptionInfo;
    if (limits.maxTransactions === -1) return { allowed: true };
    
    if (currentTransactions >= limits.maxTransactions) {
      return {
        allowed: false,
        reason: `Достигнут лимит транзакций (${limits.maxTransactions}). Обновитесь до PRO для безлимитной загрузки.`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  checkAiRequestLimit(): LimitCheckResult {
    if (!this.subscriptionInfo) {
      return { allowed: false, reason: 'Subscription info not loaded' };
    }

    const { limits, currentUsage } = this.subscriptionInfo;
    if (limits.maxAiRequests === -1) return { allowed: true };
    
    if (currentUsage.aiRequests >= limits.maxAiRequests) {
      return {
        allowed: false,
        reason: `Достигнут дневной лимит ИИ-запросов (${limits.maxAiRequests}). Обновитесь до PRO для безлимитного доступа.`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  // Новые методы для проверки лимитов загрузки и скачивания
  checkFileUploadLimit(): LimitCheckResult {
    if (!this.subscriptionInfo) {
      return { allowed: false, reason: 'Subscription info not loaded' };
    }

    const { limits, currentUsage } = this.subscriptionInfo;
    if (limits.maxFileUploads === -1) return { allowed: true };
    
    if (currentUsage.fileUploads >= limits.maxFileUploads) {
      return {
        allowed: false,
        reason: `Достигнут лимит загрузки файлов (${limits.maxFileUploads}). Обновитесь до PRO для безлимитной загрузки выписок.`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  checkReportDownloadLimit(): LimitCheckResult {
    if (!this.subscriptionInfo) {
      return { allowed: false, reason: 'Subscription info not loaded' };
    }

    const { limits, currentUsage } = this.subscriptionInfo;
    if (limits.maxReportDownloads === -1) return { allowed: true };
    
    if (currentUsage.reportDownloads >= limits.maxReportDownloads) {
      return {
        allowed: false,
        reason: `Достигнут лимит скачивания отчетов (${limits.maxReportDownloads}). Обновитесь до PRO для безлимитного скачивания.`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  checkDashboardExportLimit(): LimitCheckResult {
    if (!this.subscriptionInfo) {
      return { allowed: false, reason: 'Subscription info not loaded' };
    }

    const { limits, currentUsage } = this.subscriptionInfo;
    if (limits.maxDashboardExports === -1) return { allowed: true };
    
    if (currentUsage.dashboardExports >= limits.maxDashboardExports) {
      return {
        allowed: false,
        reason: `Экспорт отчетов с дашборда доступен только в PRO тарифе.`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  checkFeatureAccess(feature: keyof UserLimits): LimitCheckResult {
    if (!this.subscriptionInfo) {
      return { allowed: false, reason: 'Subscription info not loaded' };
    }

    const hasAccess = this.subscriptionInfo.limits[feature];
    if (typeof hasAccess === 'boolean' && !hasAccess) {
      const featureNames: Record<string, string> = {
        hasAdvancedAnalytics: 'расширенная аналитика',
        hasExcelExport: 'экспорт в Excel',
        hasPrioritySupport: 'приоритетная поддержка',
        hasFinancialModeling: 'финансовое моделирование'
      };

      return {
        allowed: false,
        reason: `Функция "${featureNames[feature] || feature}" доступна только в PRO тарифе.`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  async incrementAiRequests(userId: string): Promise<void> {
    try {
      await fetch('/api/increment-ai-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (this.subscriptionInfo) {
        this.subscriptionInfo.currentUsage.aiRequests++;
      }
    } catch (error) {
      console.error('Failed to increment AI requests:', error);
    }
  }

  // Новые методы для увеличения счетчиков
  async incrementFileUploads(userId: string): Promise<void> {
    try {
      await fetch('/api/increment-file-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (this.subscriptionInfo) {
        this.subscriptionInfo.currentUsage.fileUploads++;
      }
    } catch (error) {
      console.error('Failed to increment file uploads:', error);
    }
  }

  async incrementReportDownloads(userId: string): Promise<void> {
    try {
      await fetch('/api/increment-report-downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (this.subscriptionInfo) {
        this.subscriptionInfo.currentUsage.reportDownloads++;
      }
    } catch (error) {
      console.error('Failed to increment report downloads:', error);
    }
  }

  async incrementDashboardExports(userId: string): Promise<void> {
    try {
      await fetch('/api/increment-dashboard-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (this.subscriptionInfo) {
        this.subscriptionInfo.currentUsage.dashboardExports++;
      }
    } catch (error) {
      console.error('Failed to increment dashboard exports:', error);
    }
  }

  isPro(): boolean {
    return this.subscriptionInfo?.status === 'pro' || this.subscriptionInfo?.status === 'admin';
  }

  isFree(): boolean {
    return this.subscriptionInfo?.status === 'free';
  }

  // Проверяем, является ли пользователь администратором
  isAdmin(): boolean {
    return this.subscriptionInfo?.status === 'admin';
  }

  showUpgradeModal(reason: string): void {
    // Показать модальное окно с предложением обновления
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Обновление до PRO</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">${reason}</p>
        <div class="flex gap-3">
          <button onclick="window.location.href='/pricing'" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Обновить до PRO
          </button>
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Отмена
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

export const subscriptionService = SubscriptionService.getInstance();
