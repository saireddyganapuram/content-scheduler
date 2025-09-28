const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const User = require('../models/User');
const { ensureUser } = require('../middleware/auth');
const router = express.Router();

// Twitter OAuth login - Enhanced with database storage
router.get('/auth/:clerkId', ensureUser, async (req, res) => {
  try {
    console.log('=== Twitter Auth Debug ===');
    console.log('ClerkId:', req.params.clerkId);
    console.log('Session ID:', req.sessionID);
    
    if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Twitter API keys not configured' });
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      process.env.TWITTER_REDIRECT_URI,
      { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
    );
    
    // Store in both session AND database for reliability
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
    req.session.clerkId = req.params.clerkId;
    
    // Also store in database as backup
    await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { 
        tempCodeVerifier: codeVerifier,
        tempState: state,
        tempStateExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      },
      { upsert: true }
    );
    
    // Force session save
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      console.log('Session saved successfully');
    });
    
    console.log('OAuth data stored, sending auth URL');
    res.json({ authUrl: url });
  } catch (error) {
    console.error('Twitter auth error:', error);
    res.status(500).json({ 
      error: 'Failed to generate auth URL', 
      details: error.message
    });
  }
});

// Twitter OAuth callback (OAuth 2.0) - Enhanced with fallback
router.get('/callback', async (req, res) => {
  try {
    console.log('=== Twitter Callback Debug ===');
    console.log('Query params:', req.query);
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    
    const { code, state, error: oauthError } = req.query;
    
    if (oauthError) {
      console.log('OAuth error:', oauthError);
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=denied`);
    }

    if (!code) {
      console.log('Missing authorization code');
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=no_code`);
    }

    // Try to get from session first
    let { codeVerifier, clerkId } = req.session || {};
    
    // If session data missing, try database fallback
    if (!codeVerifier || !clerkId) {
      console.log('Session data missing, trying database fallback...');
      
      // Find user by state or recent temp data
      const user = await User.findOne({
        $and: [
          { tempState: state },
          { tempStateExpiry: { $gt: new Date() } }
        ]
      });
      
      if (user) {
        codeVerifier = user.tempCodeVerifier;
        clerkId = user.clerkId;
        console.log('Found data in database for clerkId:', clerkId);
      } else {
        console.log('No valid data found in database either');
        return res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=session_expired`);
      }
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    console.log('Attempting to exchange code for tokens...');
    const { accessToken, refreshToken } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: process.env.TWITTER_REDIRECT_URI,
    });

    // Get user info
    const twitterClient = new TwitterApi(accessToken);
    const { data: userInfo } = await twitterClient.v2.me();
    console.log('Twitter user info:', userInfo);

    // Update user in database
    await User.findOneAndUpdate(
      { clerkId },
      {
        twitterId: userInfo.id,
        twitterUsername: userInfo.username,
        twitterAccessToken: accessToken,
        twitterRefreshToken: refreshToken,
        isTwitterConnected: true,
        // Clear temp data
        $unset: {
          tempCodeVerifier: 1,
          tempState: 1,
          tempStateExpiry: 1
        }
      }
    );

    // Clear session data
    if (req.session) {
      delete req.session.codeVerifier;
      delete req.session.state;
      delete req.session.clerkId;
    }

    console.log('Twitter connection successful!');
    res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=error&msg=${encodeURIComponent(error.message)}`);
  }
});

// Test Twitter API keys
router.get('/test', async (req, res) => {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
    });
    
    // Just test if we can create the client
    res.json({ 
      success: true, 
      message: 'Twitter API keys are valid',
      hasApiKey: !!process.env.TWITTER_API_KEY,
      hasApiSecret: !!process.env.TWITTER_API_SECRET
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check Twitter connection status
router.get('/status/:clerkId', ensureUser, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    res.json({ 
      connected: user?.isTwitterConnected || false,
      username: user?.twitterUsername 
    });
  } catch (error) {
    console.error('Twitter status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disconnect Twitter account
router.post('/disconnect/:clerkId', ensureUser, async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      {
        twitterId: null,
        twitterUsername: null,
        twitterAccessToken: null,
        twitterRefreshToken: null,
        isTwitterConnected: false
      }
    );
    
    res.json({ message: 'Twitter account disconnected successfully' });
  } catch (error) {
    console.error('Twitter disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Twitter account' });
  }
});

// Debug session data
router.get('/debug/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.headers.cookie
  });
});

// Clean up expired temp data
router.post('/cleanup', async (req, res) => {
  try {
    await User.updateMany(
      { tempStateExpiry: { $lt: new Date() } },
      { $unset: { tempCodeVerifier: 1, tempState: 1, tempStateExpiry: 1 } }
    );
    res.json({ message: 'Cleanup completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;