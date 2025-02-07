type CreditChangeListener = (credits: number) => void;

class CreditsManager {
  private credits: number = 50;
  private readonly storageKey = 'turbo_credits';
  private listeners: CreditChangeListener[] = [];

  constructor() {
    const savedCredits = localStorage.getItem(this.storageKey);
    if (savedCredits === null) {
      this.credits = 50;
      this.saveCredits();
    } else {
      this.credits = parseInt(savedCredits, 10);
    }
  }

  getCredits(): number {
    return this.credits;
  }

  useCredit(): void {
    if (this.credits > 0) {
      this.credits--;
      this.notifyListeners();
      this.saveCredits();
    }
  }

  addListener(listener: CreditChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.credits));
  }

  private saveCredits(): void {
    localStorage.setItem(this.storageKey, this.credits.toString());
  }
}

export const creditsManager = new CreditsManager(); 