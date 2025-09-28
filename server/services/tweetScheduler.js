const { TwitterApi } = require('twitter-api-v2');
const Tweet = require('../models/Tweet');
const User = require('../models/User');

async function checkAndPostScheduledTweets() {
  try {
    const now = new Date();
    console.log(`=== Tweet Scheduler Check at ${now.toISOString()} ===`);
    
    const tweetsToPost = await Tweet.find({
      status: 'scheduled',
      scheduledTime: { $lte: now }
    });

    console.log(`Found ${tweetsToPost.length} tweets to post`);

    if (tweetsToPost.length === 0) {
      return;
    }

    for (const tweet of tweetsToPost) {
      try {
        console.log(`Processing tweet ${tweet._id}: "${tweet.content}"`);
        console.log(`Scheduled for: ${tweet.scheduledTime}`);
        
        const user = await User.findOne({ clerkId: tweet.userId });
        
        if (!user) {
          console.log(`User not found for clerkId: ${tweet.userId}`);
          await Tweet.findByIdAndUpdate(tweet._id, {
            status: 'failed',
            errorMessage: 'User not found'
          });
          continue;
        }

        if (!user.twitterAccessToken) {
          console.log(`User ${user.clerkId} has no Twitter access token`);
          await Tweet.findByIdAndUpdate(tweet._id, {
            status: 'failed',
            errorMessage: 'Twitter not connected'
          });
          continue;
        }

        console.log(`Posting tweet for user: ${user.twitterUsername || user.clerkId}`);
        
        // Check if access token exists
        if (!user.twitterAccessToken || user.twitterAccessToken === 'mock_access_token') {
          throw new Error('Invalid or missing Twitter access token');
        }
        
        // Use OAuth 2.0 for tweet posting
        const twitterClient = new TwitterApi(user.twitterAccessToken);
        console.log('Using OAuth 2.0 for posting');
        
        // First verify the token is valid
        try {
          await twitterClient.v2.me();
          console.log('Twitter token verified successfully');
        } catch (tokenError) {
          throw new Error(`Twitter token invalid: ${tokenError.message}`);
        }
        
        let result;
        // Disable image uploads until Twitter Elevated Access is approved
        const ENABLE_IMAGE_UPLOAD = false;
        
        if (tweet.hasImage && !ENABLE_IMAGE_UPLOAD) {
          console.log('⚠️  Image upload disabled: Twitter app needs Elevated Access for media uploads');
          console.log('📋 To enable images: Apply for Elevated Access at https://developer.twitter.com/en/portal/petition/essential/basic-info');
        }
        
        if (tweet.hasImage && tweet.imageUrl && ENABLE_IMAGE_UPLOAD) {
          console.log(`Tweet has image: ${tweet.imageUrl}`);
          
          // Read image file
          const fs = require('fs');
          const path = require('path');
          const imagePath = path.join(__dirname, '..', tweet.imageUrl);
          
          if (fs.existsSync(imagePath)) {
            try {
              // Upload image to Twitter using v1.1 API
              console.log('Uploading image to Twitter...');
              console.log('Image file size:', fs.statSync(imagePath).size, 'bytes');
              
              // Read image as buffer
              const imageBuffer = fs.readFileSync(imagePath);
              
              // Try OAuth 2.0 media upload first
              console.log('Attempting OAuth 2.0 media upload...');
              const mediaId = await twitterClient.v1.uploadMedia(imageBuffer, {
                mimeType: 'image/png'
              });
              console.log(`Image uploaded to Twitter, media ID: ${mediaId}`);
              
              // Post tweet with image
              result = await twitterClient.v2.tweet(tweet.content, {
                media: { media_ids: [mediaId] }
              });
            } catch (imageError) {
              console.log(`Image upload failed: ${imageError.message}`);
              console.log('Image error details:', imageError);
              
              // Try alternative approach - post without image
              console.log('Posting text-only tweet as fallback');
              result = await twitterClient.v2.tweet(tweet.content);
            }
          } else {
            console.log(`Image file not found: ${imagePath}, posting text only`);
            result = await twitterClient.v2.tweet(tweet.content);
          }
        } else {
          // Post text-only tweet
          if (tweet.hasImage && !ENABLE_IMAGE_UPLOAD) {
            console.log('Image upload disabled - posting text only');
          }
          result = await twitterClient.v2.tweet(tweet.content);
        }

        await Tweet.findByIdAndUpdate(tweet._id, {
          status: 'posted',
          twitterId: result.data.id
        });

        console.log(`✅ Tweet posted successfully: ${tweet._id} -> Twitter ID: ${result.data.id}`);
      } catch (error) {
        console.error(`❌ Failed to post tweet ${tweet._id}:`, error.message);
        
        let errorMessage = error.message;
        
        // Handle specific Twitter API errors
        if (error.code === 403) {
          errorMessage = 'Twitter access denied. Please reconnect your Twitter account.';
          // Mark user as disconnected
          await User.findOneAndUpdate(
            { clerkId: tweet.userId },
            { isTwitterConnected: false }
          );
        } else if (error.code === 401) {
          errorMessage = 'Twitter token expired. Please reconnect your Twitter account.';
          await User.findOneAndUpdate(
            { clerkId: tweet.userId },
            { isTwitterConnected: false }
          );
        }
        
        await Tweet.findByIdAndUpdate(tweet._id, {
          status: 'failed',
          errorMessage: errorMessage
        });
      }
    }
  } catch (error) {
    console.error('Tweet scheduler error:', error);
  }
}

module.exports = { checkAndPostScheduledTweets };