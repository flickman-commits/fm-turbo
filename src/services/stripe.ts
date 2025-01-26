interface StripeInstance {
  redirectToCheckout: (options: { sessionId: string }) => Promise<{ error?: { message: string } }>;
}

declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance;
  }
}

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL;

export const createCheckoutSession = async () => {
  try {
    // Load Stripe.js dynamically
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.body.appendChild(script);
      await new Promise((resolve) => script.addEventListener('load', resolve));
    }

    // Create checkout session
    const response = await fetch(`${API_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();

    // Initialize Stripe and redirect to checkout
    const stripe = window.Stripe?.(STRIPE_PUBLIC_KEY);
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    const result = await stripe.redirectToCheckout({ sessionId });
    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    throw error;
  }
}; 