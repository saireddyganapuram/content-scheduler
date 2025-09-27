import { useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { twitterAPI, chatbotAPI, tweetsAPI } from '../services/api'

export default function Dashboard() {
  const { user } = useUser()
  const [twitterConnected, setTwitterConnected] = useState(false)
  const [twitterUsername, setTwitterUsername] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generatedTweet, setGeneratedTweet] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => {
    if (user?.id) {
      checkTwitterStatus()
    }
  }, [user])

  const checkTwitterStatus = async () => {
    try {
      const response = await twitterAPI.getStatus(user.id)
      setTwitterConnected(response.data.connected)
      setTwitterUsername(response.data.username || '')
    } catch (error) {
      console.error('Error checking Twitter status:', error)
    }
  }

  const handleConnectTwitter = async () => {
    try {
      const response = await twitterAPI.getAuthUrl(user.id)
      // Use same window instead of popup to avoid blocking
      window.location.href = response.data.authUrl
    } catch (error) {
      console.error('Error connecting Twitter:', error)
      alert('Failed to connect Twitter. Please try again.')
    }
  }

  const handleGenerateTweet = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    try {
      const response = await chatbotAPI.generateTweet(prompt)
      setGeneratedTweet(response.data.tweet)
    } catch (error) {
      console.error('Error generating tweet:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleScheduleTweet = async () => {
    if (!generatedTweet || !scheduledTime) return
    
    try {
      await tweetsAPI.schedule(user.id, generatedTweet, scheduledTime)
      alert('Tweet scheduled successfully!')
      setGeneratedTweet('')
      setScheduledTime('')
      setPrompt('')
    } catch (error) {
      console.error('Error scheduling tweet:', error)
      alert('Failed to schedule tweet')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.firstName}!</h1>
      
      {/* Twitter Connection Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Twitter Account</h2>
        {twitterConnected ? (
          <div className="flex items-center text-green-600">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Connected to @{twitterUsername}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">Connect your Twitter account to start scheduling tweets</p>
            <button 
              onClick={handleConnectTwitter}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Connect Twitter
            </button>
          </div>
        )}
      </div>

      {/* AI Tweet Generator */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">AI Tweet Generator</h2>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to tweet about..."
            className="w-full p-3 border rounded-lg resize-none h-24"
          />
          <button
            onClick={handleGenerateTweet}
            disabled={isGenerating || !prompt.trim()}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Tweet'}
          </button>
          
          {generatedTweet && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Generated Tweet:</h3>
              <p className="text-gray-800 mb-3">{generatedTweet}</p>
              <p className="text-sm text-gray-600 mb-3">{generatedTweet.length}/280 characters</p>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Schedule for:</label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <button 
                  onClick={handleScheduleTweet}
                  disabled={!scheduledTime || !twitterConnected}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Schedule Tweet
                </button>
              </div>
              
              {!twitterConnected && (
                <p className="text-red-600 text-sm mt-2">Connect Twitter to schedule tweets</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}