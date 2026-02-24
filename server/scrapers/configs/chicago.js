/**
 * Chicago Marathon - Mika Timing platform
 * Results: https://results.chicagomarathon.com/{year}
 */
export default {
  platform: 'mika',
  raceName: 'Chicago Marathon',
  tag: 'Chicago Marathon',
  location: 'Chicago, IL',
  baseUrlPattern: 'https://results.chicagomarathon.com/{year}',
  eventCode: 'MAR',
  eventTypes: ['Marathon'],
  defaultEventType: 'Marathon',
  distanceMiles: 26.2,
  aliases: [
    'Chicago Marathon',
    'Bank of America Chicago Marathon',
    'BOA Chicago Marathon'
  ],
  keywords: ['chicago'],
  keywordRequiresMarathon: true,
  /**
   * Chicago Marathon is the second Sunday of October
   */
  calculateDate(year) {
    const oct1 = new Date(year, 9, 1)
    const dayOfWeek = oct1.getDay()
    const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    return new Date(year, 9, 1 + daysUntilFirstSunday + 7)
  }
}
