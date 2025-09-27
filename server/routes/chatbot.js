const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Simple fallback for now - replace with working Gemini code later
    const templates = [
      `Just discovered something amazing about ${prompt}! 🚀 #Innovation #Tech`,
      `Thoughts on ${prompt}: This could be a game-changer! 💡 #Future #Ideas`,
      `Exploring ${prompt} today. The possibilities are endless! ✨ #Learning #Growth`,
      `${prompt} is reshaping how we think about technology 🌍 #TechTrends #AI`,
      `Fascinated by ${prompt} and its potential impact 🔥 #Innovation #Future`
    ];
    
    const randomTweet = templates[Math.floor(Math.random() * templates.length)];
    const finalTweet = randomTweet.length > 280 ? randomTweet.substring(0, 277) + '...' : randomTweet;

    res.json({ tweet: finalTweet });
  } catch (error) {
    console.error('Tweet generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate tweet' });
  }
});

module.exports = router;