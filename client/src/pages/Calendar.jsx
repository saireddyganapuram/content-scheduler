import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { tweetsAPI } from '../services/api'

export default function Calendar() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadScheduledTweets()
    }
  }, [user])

  const loadScheduledTweets = async () => {
    try {
      const response = await tweetsAPI.getScheduled(user.id)
      const tweets = response.data || []
      const tweetEvents = tweets.map(tweet => ({
        id: tweet._id,
        title: tweet.content.substring(0, 30) + (tweet.content.length > 30 ? '...' : ''),
        start: tweet.scheduledTime,
        extendedProps: {
          content: tweet.content,
          status: tweet.status
        },
        backgroundColor: tweet.status === 'failed' ? '#ef4444' : '#3b82f6'
      }))
      setEvents(tweetEvents)
    } catch (error) {
      console.error('Error loading tweets:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (dateInfo) => {
    const selectedDate = dateInfo.dateStr
    navigate(`/day/${selectedDate}`)
  }

  const handleEventClick = async (clickInfo) => {
    const { content, status } = clickInfo.event.extendedProps
    const action = confirm(`Tweet: "${content}"\nStatus: ${status}\n\nClick OK to delete, Cancel to edit`)
    
    if (action) {
      try {
        await tweetsAPI.delete(clickInfo.event.id)
        loadScheduledTweets()
      } catch (error) {
        console.error('Error deleting tweet:', error)
        alert('Failed to delete tweet')
      }
    } else {
      const newContent = prompt('Edit tweet content:', content)
      if (newContent && newContent.length <= 280) {
        const newTime = prompt('Edit scheduled time (YYYY-MM-DDTHH:MM):', clickInfo.event.startStr.slice(0, 16))
        if (newTime) {
          try {
            await tweetsAPI.update(clickInfo.event.id, newContent, newTime)
            loadScheduledTweets()
          } catch (error) {
            console.error('Error updating tweet:', error)
            alert('Failed to update tweet')
          }
        }
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tweet Calendar</h1>
      
      {loading ? (
        <div className="text-center py-8">Loading scheduled tweets...</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            height="auto"
          />
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>• Click on any date to view and manage posts for that day</p>
        <p>• Click on existing tweets to see details</p>
      </div>
    </div>
  )
}