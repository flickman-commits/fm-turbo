/**
 * Philadelphia Marathon - MyChipTime platform
 * Results: https://www.mychiptime.com/searchevent.php?id=16897
 */
export default {
  platform: 'mychiptime',
  raceName: 'Philadelphia Marathon',
  tag: 'Philadelphia',
  location: 'Philadelphia, PA',
  parseMode: 'searchevent',
  endpoint: 'searchevent.php',
  defaultEventId: '16897',
  eventTypes: ['Marathon'],
  eventSearchOrder: ['marathon'],
  eventLabels: {
    marathon: 'Marathon'
  },
  aliases: [
    'Philadelphia Marathon',
    'Philadelphia Marathon (Full)',
    'Philly Marathon'
  ],
  keywords: ['philadelphia', 'philly'],
  keywordRequiresMarathon: true,
  eventIds: {
    // Philadelphia uses a single event ID for all years (searchevent.php?id=16897)
    // The site handles year filtering internally
    2024: { marathon: '16897' },
    2025: { marathon: '16897' },
    2026: { marathon: '16897' }
  },
  /**
   * Philadelphia Marathon is typically the third Sunday of November
   */
  calculateDate(year) {
    const nov1 = new Date(year, 10, 1)
    const dayOfWeek = nov1.getDay()
    const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    return new Date(year, 10, 1 + daysUntilFirstSunday + 14)
  }
}
