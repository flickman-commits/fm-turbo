/**
 * Shared Puppeteer browser launcher
 * Handles both local development (uses bundled Chromium from puppeteer)
 * and Vercel serverless (uses @sparticuz/chromium)
 */
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export async function launchBrowser() {
  const isVercel = !!process.env.VERCEL

  if (isVercel) {
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
  }

  // Local: use the Chrome that puppeteer downloaded
  const { default: puppeteerFull } = await import('puppeteer')
  return puppeteerFull.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}
