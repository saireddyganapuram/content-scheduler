const { TwitterApi } = require('twitter-api-v2');
const Tweet = require('../models/Tweet');
const User = require('../models/User');

async function checkAndPostScheduledTweets() {
  try {
    const now = new Date();
    const tweetsToPost = await Tweet.find({
      status: 'scheduled',
      scheduledTime: { $lte: now }
    });

    for (const tweet of tweetsToPost) {
      try {
        const user = await User.findOne({ clerkId: tweet.userId });
        
        if (!user || !user.twitterAccessToken) {
          await Tweet.findByIdAndUpdate(tweet._id, {
            status: 'failed',
            errorMessage: 'User not found or Twitter not connected'
          });
          continue;
        }

        // Use OAuth 2.0 for tweet posting
        const twitterClient = new TwitterApi(user.twitterAccessToken);
        const result = await twitterClient.v2.tweet(tweet.content);

        await Tweet.findByIdAndUpdate(tweet._id, {
          status: 'posted',
          twitterId: result.data.id
        });

        console.log(`Tweet posted successfully: ${tweet._id}`);
      } catch (error) {
        console.error(`Failed to post tweet ${tweet._id}:`, error);
        
        await Tweet.findByIdAndUpdate(tweet._id, {
          status: 'failed',
          errorMessage: error.message
        });
      }
    }
  } catch (error) {
    console.error('Tweet scheduler error:', error);
  }
}

module.exports = { checkAndPostScheduledTweets };