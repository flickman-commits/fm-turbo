/**
 * California International Marathon (CIM) - MyRace.ai platform
 * Results: https://myrace.ai/races/cim_{year}/results
 */
export default {
  platform: 'myrace',
  raceName: 'California International Marathon',
  tag: 'CIM',
  location: 'Folsom to Sacramento, CA',
  raceIdPattern: 'cim_{year}',
  eventTypes: ['Marathon'],
  defaultEventType: 'Marathon',
  distanceMiles: 26.2,
  aliases: [
    'California International Marathon',
    'CIM Marathon',
    'CIM'
  ],
  keywords: ['california international', 'cim'],
  keywordRequiresMarathon: false, // 'cim' alone is enough
  /**
   * CIM is always the first Sunday of December
   */
  calculateDate(year) {
    const dec1 = new Date(year, 11, 1)
    const dayOfWeek = dec1.getDay()
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    return new Date(year, 11, 1 + daysUntilSunday)
  }
}
