type CreditChangeListener = (credits: number) => void;

class CreditsManager {
  private credits: number = 5;
  private listeners: CreditChangeListener[] = [];

  getCredits(): number {
    return this.credits;
  }

  useCredit(): void {
    if (this.credits > 0) {
      this.credits--;
      this.notifyListeners();
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
}

export const creditsManager = new CreditsManager(); 