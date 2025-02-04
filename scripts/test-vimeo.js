import { Vimeo } from '@vimeo/vimeo'

const VIMEO_CLIENT_ID = 'd06d2c7e91eb9638288225587948d52868bd41be'
const VIMEO_CLIENT_SECRET = 'zfkRrhP5GmnbWgTc/8QQ7tSi7Zsb51t6wPI8RHyn2WvTfeyS8sDISSuIy+iTsiS0rszXM5nFv+5PbL6MMz5g/EAKRk4PlkVGgrB+o19Z8yd/E4/nSVNFds8c8rVbkGp+'
const VIMEO_ACCESS_TOKEN = 'f2698b4ebdd48ae5f773702e12d9a4c0'

const client = new Vimeo(
  VIMEO_CLIENT_ID,
  VIMEO_CLIENT_SECRET,
  VIMEO_ACCESS_TOKEN
)

async function testVimeoIntegration() {
  console.log('Testing Vimeo integration...')
  
  try {
    // Test credentials by fetching user info
    client.request({
      method: 'GET',
      path: '/me'
    }, (error, body, statusCode, headers) => {
      if (error) {
        console.error('Error validating credentials:', error)
        return
      }
      
      console.log('Credentials valid! User info:', body)
      
      // Now fetch videos
      client.request({
        method: 'GET',
        path: '/users/flickman/videos',
        query: {
          fields: 'uri,name,description,link,pictures.base_link,metadata.connections.likes.total,metadata.interactions.view.total,tags'
        }
      }, (error, body, statusCode, headers) => {
        if (error) {
          console.error('Error fetching videos:', error)
          return
        }
        
        console.log('Fetched videos:', JSON.stringify(body, null, 2))
      })
    })
  } catch (error) {
    console.error('Error testing Vimeo integration:', error)
  }
}

testVimeoIntegration() 