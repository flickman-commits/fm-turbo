import { supabase } from '@/lib/supabase'
import { CreditTransaction, CreditTransactionType } from '@/types/credits'

type CreditChangeListener = (credits: number) => void;

class CreditsManager {
  private listeners: CreditChangeListener[] = [];
  private cachedCredits: number | null = null;
  private userId: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  async initialize(userId: string) {
    console.log('🔄 Initializing credits manager for user:', userId)
    if (this.initializationPromise && this.userId === userId) {
      console.log('✅ Already initialized for this user')
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        this.userId = userId;
        await this.fetchCredits();
      } catch (error) {
        console.error('❌ Failed to initialize credits:', error);
        this.userId = null;
        this.cachedCredits = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  private async fetchCredits(): Promise<number> {
    if (!this.userId) {
      console.error('❌ Cannot fetch credits: User not initialized')
      throw new Error('User not initialized');
    }

    try {
      console.log('🔄 Fetching credits from Supabase...')
      const { data: user, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', this.userId)
        .single();

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error;
      }
      
      if (!user) {
        console.error('❌ User not found')
        throw new Error('User not found');
      }

      const credits = user.credits ?? 0;
      console.log('✅ Credits fetched:', credits)
      this.cachedCredits = credits;
      this.notifyListeners();
      return credits;
    } catch (error) {
      console.error('❌ Failed to fetch credits:', error);
      throw error;
    }
  }

  async getCredits(): Promise<number> {
    if (!this.userId) {
      console.log('❌ No user initialized, returning 0 credits')
      return 0;
    }

    try {
      if (this.cachedCredits === null) {
        console.log('🔄 No cached credits, fetching fresh...')
        return await this.fetchCredits();
      }
      console.log('✅ Returning cached credits:', this.cachedCredits)
      return this.cachedCredits;
    } catch (error) {
      console.error('❌ Error getting credits:', error);
      return 0;
    }
  }

  async useCredit(taskId?: string): Promise<boolean> {
    if (!this.userId) {
      console.error('Cannot use credit: User not initialized');
      return false;
    }
    
    try {
      const currentCredits = await this.getCredits();
      if (currentCredits <= 0) {
        console.log('No credits available');
        return false;
      }

      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          user_id: this.userId,
          amount: -1,
          type: 'use' as CreditTransactionType,
          description: 'Used 1 credit for task',
          task_id: taskId
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: currentCredits - 1 })
        .eq('id', this.userId);

      if (updateError) throw updateError;

      this.cachedCredits = currentCredits - 1;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to use credit:', error);
      return false;
    }
  }

  async addCredits(amount: number, description: string): Promise<boolean> {
    if (!this.userId) {
      console.error('Cannot add credits: User not initialized');
      return false;
    }
    
    if (amount <= 0) {
      console.error('Cannot add credits: Amount must be positive');
      return false;
    }

    try {
      const currentCredits = await this.getCredits();

      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          user_id: this.userId,
          amount: amount,
          type: 'add' as CreditTransactionType,
          description
        }]);

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: currentCredits + amount })
        .eq('id', this.userId);

      if (updateError) throw updateError;

      this.cachedCredits = currentCredits + amount;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to add credits:', error);
      return false;
    }
  }

  async getTransactionHistory(): Promise<CreditTransaction[]> {
    if (!this.userId) {
      console.log('Cannot get history: User not initialized');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  addListener(listener: CreditChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    if (this.cachedCredits !== null) {
      this.listeners.forEach(listener => listener(this.cachedCredits!));
    }
  }
}

export const creditsManager = new CreditsManager(); 