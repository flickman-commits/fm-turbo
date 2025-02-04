import { vimeoService } from '../../src/services/vimeo'

async function testVimeoIntegration() {
  console.log('Testing Vimeo integration...')
  
  try {
    // First validate credentials
    const isValid = await vimeoService.validateCredentials()
    console.log('Credentials valid:', isValid)
    
    if (!isValid) {
      console.error('Invalid Vimeo credentials')
      return
    }
    
    // Fetch videos
    const videos = await vimeoService.generateMockDatabase()
    console.log('Fetched videos:', videos)
  } catch (error) {
    console.error('Error testing Vimeo integration:', error)
  }
}

testVimeoIntegration() 