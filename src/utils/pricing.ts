export interface PricingTier {
  maxUsers: number;
  price: number | 'FREE' | '¯\\_(ツ)_/¯';
  name: string;
  position: number; // percentage position on slider
}

export const PRICING_TIERS: PricingTier[] = [
  {
    maxUsers: 100,
    price: 'FREE',
    name: 'First 100 users',
    position: 8 // Position for FREE tier
  },
  {
    maxUsers: 200,
    price: 10,
    name: 'Users 101-200',
    position: 35 // Position for $10 tier
  },
  {
    maxUsers: 500,
    price: 20,
    name: 'Users 201-500',
    position: 62 // Position for $20 tier
  },
  {
    maxUsers: Infinity,
    price: 30,
    name: 'Users 501+',
    position: 89 // Position for final tier
  }
];

export function getCurrentPricingTier(userCount: number): PricingTier {
  // Start from the first tier
  let prevMaxUsers = 0;
  
  // Find the tier where the user count falls between the previous tier's max and this tier's max
  const tier = PRICING_TIERS.find(tier => {
    const isInTier = userCount > prevMaxUsers && userCount <= tier.maxUsers;
    prevMaxUsers = tier.maxUsers;
    return isInTier;
  });
  
  return tier || PRICING_TIERS[PRICING_TIERS.length - 1];
}

export function formatPrice(price: number | 'FREE' | '¯\\_(ツ)_/¯'): string {
  if (typeof price === 'number') {
    return `$${price}/mo`;
  }
  return price;
}

export function getSliderPosition(userCount: number): number {
  const currentTier = getCurrentPricingTier(userCount);
  return currentTier.position;
} 