const express = require('express');
const Tweet = require('../models/Tweet');
const router = express.Router();

// Schedule a new tweet
router.post('/schedule', async (req, res) => {
  try {
    const { userId, content, scheduledTime } = req.body;

    if (!userId || !content || !scheduledTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (content.length > 280) {
      return res.status(400).json({ error: 'Tweet content exceeds 280 characters' });
    }

    const tweet = new Tweet({
      userId,
      content,
      scheduledTime: new Date(scheduledTime)
    });

    await tweet.save();
    res.status(201).json(tweet);
  } catch (error) {
    console.error('Schedule tweet error:', error);
    res.status(500).json({ error: 'Failed to schedule tweet' });
  }
});

// Get scheduled tweets for a user
router.get('/scheduled/:userId', async (req, res) => {
  try {
    const tweets = await Tweet.find({ 
      userId: req.params.userId,
      status: { $in: ['scheduled', 'failed'] }
    }).sort({ scheduledTime: 1 });
    
    res.json(tweets || []);
  } catch (error) {
    console.error('Get tweets error:', error);
    res.status(500).json({ error: 'Failed to fetch tweets', data: [] });
  }
});

// Update a scheduled tweet
router.put('/:tweetId', async (req, res) => {
  try {
    const { content, scheduledTime } = req.body;
    
    const tweet = await Tweet.findByIdAndUpdate(
      req.params.tweetId,
      { content, scheduledTime: new Date(scheduledTime) },
      { new: true }
    );

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    res.json(tweet);
  } catch (error) {
    console.error('Update tweet error:', error);
    res.status(500).json({ error: 'Failed to update tweet' });
  }
});

// Delete a scheduled tweet
router.delete('/:tweetId', async (req, res) => {
  try {
    const tweet = await Tweet.findByIdAndDelete(req.params.tweetId);
    
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    res.json({ message: 'Tweet deleted successfully' });
  } catch (error) {
    console.error('Delete tweet error:', error);
    res.status(500).json({ error: 'Failed to delete tweet' });
  }
});

module.exports = router;