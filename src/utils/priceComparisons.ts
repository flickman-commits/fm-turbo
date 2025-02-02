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
    { item: '', price: '$10/mo', emoji: '<img src="/lightroom-logo.png" alt="Adobe Lightroom" class="h-[84px] w-auto object-contain mx-auto" />' },
    { item: '', price: '$11/mo', emoji: '<img src="/spotify-logo.png" alt="Spotify Premium" class="h-[84px] w-auto object-contain mx-auto" />' },
    { item: '', price: '$15/mo', emoji: '<img src="/netflix-logo.png" alt="Netflix" class="h-[84px] w-auto object-contain mx-auto" />' }
  ],
  20: [
    { item: '', price: '$20/mo', emoji: '<img src="/dropbox-logo.png" alt="Dropbox" class="h-[84px] w-auto object-contain mx-auto" />' },
    { item: '', price: '$40/mo', emoji: '<img src="/honeybook-logo.png" alt="Honeybook" class="h-[67px] w-auto object-contain mx-auto" />' },
    { item: '', price: '$23/mo', emoji: '<img src="/squarespace-logo.png" alt="Squarespace" class="h-[84px] w-auto object-contain mx-auto" />' }
  ],
  '¯\\_(ツ)_/¯': [
    { item: 'Full Frame Lens', price: '$800', emoji: '🔭' },
    { item: 'MacBook Pro', price: '$2000', emoji: '💻' },
    { item: 'Cinema Camera', price: '$6000', emoji: '🎥' }
  ]
}; 