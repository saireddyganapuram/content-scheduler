const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const User = require('../models/User');
const { ensureUser } = require('../middleware/auth');
const router = express.Router();

// Twitter OAuth login - Simplified approach
router.get('/auth/:clerkId', ensureUser, async (req, res) => {
  try {
    console.log('=== Twitter Auth Debug ===');
    console.log('ClerkId:', req.params.clerkId);
    console.log('API Key exists:', !!process.env.TWITTER_API_KEY);
    console.log('API Secret exists:', !!process.env.TWITTER_API_SECRET);
    console.log('Redirect URI:', process.env.TWITTER_REDIRECT_URI);
    
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      console.log('Missing API keys');
      return res.status(500).json({ error: 'Twitter API keys not configured' });
    }

    // Try OAuth 2.0 instead of 1.0a
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    console.log('Attempting OAuth 2.0 auth link generation...');
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      process.env.TWITTER_REDIRECT_URI,
      { scope: ['tweet.read', 'tweet.write', 'users.read'] }
    );
    
    // Store for callback
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
    req.session.clerkId = req.params.clerkId;
    
    console.log('OAuth 2.0 auth link generated successfully');
    res.json({ authUrl: url });
  } catch (error) {
    console.error('=== Twitter Auth Error ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to generate auth URL', 
      details: error.message,
      code: error.code 
    });
  }
});

// Twitter OAuth callback (OAuth 2.0)
router.get('/callback', async (req, res) => {
  try {
    console.log('=== Twitter Callback Debug ===');
    console.log('Query params:', req.query);
    console.log('Session data:', req.session);
    
    const { code, state, error: oauthError } = req.query;
    
    if (oauthError) {
      console.log('OAuth error:', oauthError);
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=denied`);
    }
    
    const { codeVerifier, clerkId } = req.session || {};

    if (!codeVerifier || !clerkId) {
      console.log('Missing session data:', { codeVerifier: !!codeVerifier, clerkId: !!clerkId });
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=session_error`);
    }

    if (!code) {
      console.log('Missing authorization code');
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=no_code`);
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    const { accessToken, refreshToken } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: process.env.TWITTER_REDIRECT_URI,
    });

    // Get user info
    const twitterClient = new TwitterApi(accessToken);
    const { data: userInfo } = await twitterClient.v2.me();

    // Update user in database
    await User.findOneAndUpdate(
      { clerkId },
      {
        twitterId: userInfo.id,
        twitterUsername: userInfo.username,
        twitterAccessToken: accessToken,
        twitterRefreshToken: refreshToken,
        isTwitterConnected: true
      }
    );

    // Clear session data
    delete req.session.codeVerifier;
    delete req.session.state;
    delete req.session.clerkId;

    res.redirect(`${process.env.CLIENT_URL}/dashboard?twitter=connected`);
  } catch (error) {
    console.error('Twitter callback error:', error.message);
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

module.exports = router;