import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { tweetsAPI } from '../services/api'
import SuccessPopup from '../components/SuccessPopup'

export default function DayView() {
  const { date } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTweet, setEditingTweet] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editTime, setEditTime] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (user?.id && date) {
      loadDayTweets()
    }
  }, [user, date])

  const loadDayTweets = async () => {
    try {
      const response = await tweetsAPI.getScheduled(user.id)
      const selectedDate = new Date(date)
      const dayTweets = response.data.filter(tweet => {
        const tweetDate = new Date(tweet.scheduledTime)
        return tweetDate.toDateString() === selectedDate.toDateString()
      })
      setTweets(dayTweets.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)))
    } catch (error) {
      console.error('Error loading day tweets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (tweet) => {
    setEditingTweet(tweet._id)
    setEditContent(tweet.content)
    setEditTime(new Date(tweet.scheduledTime).toISOString().slice(0, 16))
  }

  const handleSaveEdit = async (tweetId) => {
    try {
      await tweetsAPI.update(tweetId, editContent, editTime)
      setEditingTweet(null)
      setSuccessMessage('Tweet updated successfully!')
      setShowSuccess(true)
      loadDayTweets()
    } catch (error) {
      console.error('Error updating tweet:', error)
    }
  }

  const handleDelete = async (tweetId) => {
    if (confirm('Are you sure you want to delete this tweet?')) {
      try {
        await tweetsAPI.delete(tweetId)
        setSuccessMessage('Tweet deleted successfully!')
        setShowSuccess(true)
        loadDayTweets()
      } catch (error) {
        console.error('Error deleting tweet:', error)
      }
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canEdit = (scheduledTime) => {
    return new Date(scheduledTime) > new Date()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button 
            onClick={() => navigate('/calendar')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Calendar
          </button>
          <h1 className="text-2xl font-bold">Posts for {formatDate(date)}</h1>
        </div>
      </div>

      {tweets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No posts scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <div key={tweet._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    tweet.postType === 'dynamic' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {tweet.postType || 'static'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    tweet.status === 'scheduled' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : tweet.status === 'posted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tweet.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(tweet.scheduledTime)}
                </div>
              </div>

              {editingTweet === tweet._id ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none h-24"
                    maxLength={280}
                  />
                  <div className="text-sm text-gray-500">
                    {editContent.length}/280 characters
                  </div>
                  <input
                    type="datetime-local"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="p-2 border rounded"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveEdit(tweet._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTweet(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-800 mb-4">{tweet.content}</p>
                  
                  {tweet.hasImage && tweet.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={`http://localhost:5000${tweet.imageUrl}`} 
                        alt="Tweet image" 
                        className="w-full max-w-md rounded-lg"
                      />
                    </div>
                  )}

                  {canEdit(tweet.scheduledTime) && tweet.status === 'scheduled' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(tweet)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tweet._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {!canEdit(tweet.scheduledTime) && (
                    <p className="text-sm text-gray-500 italic">
                      Cannot edit - scheduled time has passed
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <SuccessPopup 
        show={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  )
}