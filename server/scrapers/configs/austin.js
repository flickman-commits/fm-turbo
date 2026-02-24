/**
 * Austin Marathon - MyChipTime platform
 * Results: https://www.mychiptime.com/searchevent.php?id=17035
 */
export default {
  platform: 'mychiptime',
  raceName: 'Austin Marathon',
  tag: 'Austin',
  location: 'Austin, TX',
  parseMode: 'columns',
  endpoint: 'searchResultGen.php',
  eventTypes: ['Marathon', 'Half Marathon', '5K'],
  eventSearchOrder: ['marathon', 'halfMarathon'],
  eventLabels: {
    marathon: 'Marathon',
    halfMarathon: 'Half Marathon'
  },
  aliases: [
    'Austin Marathon',
    'Austin Marathon 2026',
    'Ascension Seton Austin Marathon'
  ],
  keywords: ['austin'],
  keywordRequiresMarathon: true,
  eventIds: {
    2026: { marathon: '17035', halfMarathon: '17034' }
    // Add more years as they become available
  },
  /**
   * Austin Marathon is typically the third Sunday of February
   */
  calculateDate(year) {
    const feb1 = new Date(year, 1, 1)
    const dayOfWeek = feb1.getDay()
    const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    return new Date(year, 1, 1 + daysUntilFirstSunday + 14)
  }
}
