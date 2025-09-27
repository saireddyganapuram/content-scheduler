# Twitter Content Scheduler

A full-stack MERN application for scheduling Twitter posts with AI-generated content using Google Gemini API.

## Features

- 🔐 User authentication with Clerk
- 🐦 Twitter OAuth 2.0 integration
- 🤖 AI-powered tweet generation with Google Gemini
- 📅 Calendar-based tweet scheduling
- ⏰ Automatic tweet posting with cron jobs
- 📱 Responsive design with Tailwind CSS

## Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- Clerk Authentication
- FullCalendar
- Axios

**Backend:**
- Node.js
- Express.js
- MongoDB (Mongoose)
- Twitter API v2
- Google Gemini AI
- node-cron

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Variables

**Backend (.env in server folder):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/twitter-scheduler
JWT_SECRET=your_jwt_secret_here
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:5000/api/twitter/callback
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
PORT=5000
```

**Frontend (.env in client folder):**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
VITE_API_URL=http://localhost:5000/api
```

### 3. API Keys Setup

#### MongoDB Atlas
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and replace in `MONGODB_URI`

#### Clerk Authentication
1. Create account at [Clerk](https://clerk.com)
2. Create new application
3. Copy publishable key to `VITE_CLERK_PUBLISHABLE_KEY`

#### Twitter API
1. Create Twitter Developer account
2. Create new app with OAuth 2.0
3. Add callback URL: `http://localhost:5000/api/twitter/callback`
4. Copy Client ID and Secret to environment variables

#### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `GEMINI_API_KEY`

### 4. Run the Application

```bash
# Start backend server
cd server
npm run dev

# Start frontend (in new terminal)
cd client
npm run dev
```

## Usage

1. **Sign Up/Login:** Create account using Clerk authentication
2. **Connect Twitter:** Link your Twitter account via OAuth
3. **Generate Tweets:** Use AI chatbot to create tweet content
4. **Schedule Posts:** Set date/time for automatic posting
5. **Manage Calendar:** View and edit scheduled tweets

## Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy dist folder to Vercel
```

### Backend (Render)
1. Connect GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy from `server` folder

### Environment Variables for Production
- Update `CLIENT_URL` to your frontend domain
- Update `TWITTER_REDIRECT_URI` to production callback URL
- Set `VITE_API_URL` to your backend domain

## Project Structure

```
content-scheduler/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   └── App.jsx
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── index.js
└── README.md
```

## API Endpoints

- `POST /api/chatbot/generate` - Generate tweet with AI
- `GET /api/twitter/auth/:clerkId` - Get Twitter OAuth URL
- `GET /api/twitter/status/:clerkId` - Check Twitter connection
- `POST /api/tweets/schedule` - Schedule new tweet
- `GET /api/tweets/scheduled/:userId` - Get user's scheduled tweets
- `PUT /api/tweets/:tweetId` - Update scheduled tweet
- `DELETE /api/tweets/:tweetId` - Delete scheduled tweet

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License