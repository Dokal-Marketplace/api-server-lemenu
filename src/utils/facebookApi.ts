import User from '../models/User'
import logger from './logger'

export class FacebookApiService {
  /**
   * Get a valid Facebook access token for a user
   * Handles token refresh if needed
   */
  static async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const user = await User.findById(userId)
      
      if (!user || !user.facebookAccessToken) {
        logger.error(`No Facebook token found for user ${userId}`)
        return null
      }

      // Get decrypted access token
      const decryptedToken = (user as any).getDecryptedFacebookAccessToken()
      if (!decryptedToken) {
        logger.error(`Failed to decrypt Facebook token for user ${userId}`)
        return null
      }

      // Check if token is expired
      if (user.facebookTokenExpiresAt && new Date() > user.facebookTokenExpiresAt) {
        logger.info(`Facebook token expired for user ${userId}, attempting refresh`)
        
        // Try to refresh the token
        const refreshed = await this.refreshAccessToken(decryptedToken)
        if (refreshed) {
          user.facebookAccessToken = refreshed.access_token // Will be encrypted by pre-save middleware
          user.facebookTokenExpiresAt = new Date(Date.now() + (refreshed.expires_in * 1000))
          await user.save()
          return refreshed.access_token
        } else {
          logger.error(`Failed to refresh Facebook token for user ${userId}`)
          return null
        }
      }

      return decryptedToken
    } catch (error) {
      logger.error(`Error getting Facebook token for user ${userId}: ${error}`)
      return null
    }
  }

  /**
   * Refresh a Facebook access token
   */
  private static async refreshAccessToken(currentToken: string): Promise<any> {
    try {
      const response = await fetch('https://graph.facebook.com/v22.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          fb_exchange_token: currentToken
        })
      })

      if (!response.ok) {
        logger.error(`Facebook token refresh failed: ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      logger.error(`Error refreshing Facebook token: ${error}`)
      return null
    }
  }

  /**
   * Make a Facebook API call with automatic token management
   */
  static async makeApiCall(userId: string, endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken(userId)
      
      if (!accessToken) {
        throw new Error('No valid Facebook access token available')
      }

      // Add access token to params
      const queryParams = new URLSearchParams({
        access_token: accessToken,
        ...params
      })

      const url = `https://graph.facebook.com/v22.0/${endpoint}?${queryParams}`
      
      logger.info(`Making Facebook API call: ${url}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        logger.error(`Facebook API call failed: ${JSON.stringify(errorData)}`)
        throw new Error(`Facebook API error: ${errorData.error?.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      logger.error(`Facebook API call error: ${error}`)
      throw error
    }
  }

  /**
   * Get user's Facebook profile
   */
  static async getUserProfile(userId: string): Promise<any> {
    return this.makeApiCall(userId, 'me', {
      fields: 'id,name,email,picture'
    })
  }

  /**
   * Get user's Facebook pages (for business accounts)
   */
  static async getUserPages(userId: string): Promise<any> {
    return this.makeApiCall(userId, 'me/accounts', {
      fields: 'id,name,access_token,category'
    })
  }

  /**
   * Post to a Facebook page
   */
  static async postToPage(userId: string, pageId: string, message: string): Promise<any> {
    return this.makeApiCall(userId, `${pageId}/feed`, {
      message: message
    })
  }
}
