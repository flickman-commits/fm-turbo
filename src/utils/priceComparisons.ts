interface PriceComparison {
  item: string;
  price: string;
  emoji: string;
}

interface TierComparisons {
  [key: string | number]: PriceComparison[];
}

export const PRICE_COMPARISONS: TierComparisons = {
  'FREE': [
    { item: 'Everything', price: 'Priceless', emoji: '✨' }
  ],
  10: [
    { item: 'Adobe Lightroom', price: '$10/mo', emoji: '🎨' },
    { item: 'Spotify Premium', price: '$11/mo', emoji: '🎵' },
    { item: 'Netflix', price: '$15/mo', emoji: '🎥' }
  ],
  20: [
    { item: 'Dropbox Pro', price: '$20/mo', emoji: '☁️' },
    { item: 'Honeybook', price: '$40/mo', emoji: '📊' },
    { item: 'Squarespace', price: '$23/mo', emoji: '🌐' }
  ],
  '¯\\_(ツ)_/¯': [
    { item: 'Full Frame Lens', price: '$800', emoji: '🔭' },
    { item: 'MacBook Pro', price: '$2000', emoji: '💻' },
    { item: 'Cinema Camera', price: '$6000', emoji: '🎥' }
  ]
}; 