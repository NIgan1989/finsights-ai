import { BusinessProfile, Transaction } from '../types';

export class UserDataService {
  private static instance: UserDataService;

  static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService();
    }
    return UserDataService.instance;
  }

  // Профили пользователя
  async saveUserProfiles(userId: string, profiles: BusinessProfile[], activeProfileId?: string): Promise<void> {
    try {
      await fetch('/api/user/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profiles, activeProfileId })
      });
    } catch (error) {
      console.error('Failed to save user profiles:', error);
    }
  }

  async loadUserProfiles(userId: string): Promise<{ profiles: BusinessProfile[], activeProfileId: string | null }> {
    try {
      const response = await fetch(`/api/user/profiles?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      return { profiles: data.profiles || [], activeProfileId: data.activeProfileId || null };
    } catch (error) {
      console.error('Failed to load user profiles:', error);
      return { profiles: [], activeProfileId: null };
    }
  }

  // Транзакции пользователя
  async saveUserTransactions(userId: string, transactions: Transaction[]): Promise<void> {
    try {
      await fetch('/api/user/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, transactions })
      });
    } catch (error) {
      console.error('Failed to save user transactions:', error);
    }
  }

  async loadUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const response = await fetch(`/api/user/transactions?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Failed to load user transactions:', error);
      return [];
    }
  }

  // Очистка данных пользователя
  async clearUserData(userId: string): Promise<void> {
    try {
      await fetch('/api/user/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }
}

export const userDataService = UserDataService.getInstance(); 