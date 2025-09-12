# SportChat - Your AI Fitness Companion 💪

SportChat is a modern web application for workout tracking and personalized AI coaching. The app helps users maintain workout diaries, set goals, track progress, and receive motivation through an interactive AI chat assistant.

## 🚀 Key Features

### 📱 Interactive AI Chat
- **AI Assistant**: Smart bot that analyzes your workouts and provides personalized recommendations
- **Daily History**: Each day has its own separate chat history
- **Workout Analysis**: Automatic exercise recognition and activity logging
- **Personal Advice**: Recommendations for nutrition, recovery, and workout planning

### 📊 Dashboard & Analytics
- **Workout Statistics**: Number of workouts, average time, calories burned
- **Activity Charts**: Weekly and monthly statistics with interactive diagrams
- **Goal Tracking**: Visual progress tracking for set goals
- **Workout History**: Detailed journal of all completed workouts

### 🎯 Goals & Achievements System
- **Personal Goals**: Set and track individual fitness goals
- **Achievement System**: Rewards for completing various challenges
- **Progress Bars**: Visual representation of progress for each goal

### 📅 Day Management
- **Workout Calendar**: Create and manage training days
- **Quick Switching**: Easy navigation between different days
- **Auto Creation**: System automatically creates today's entry

## 🛠 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animations and transitions
- **Recharts** - Chart library for analytics
- **Lucide React** - Icon library

### Backend & Database
- **Next.js API Routes** - Server-side logic
- **JSON Database** - File-based data storage (default)
- **Supabase** (optional) - PostgreSQL database
- **Authentication** - JWT token-based authentication system

### Integrations
- **N8N Webhook** - AI service integration for message processing
- **External AI API** - Natural language processing and response generation

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/zaharenok/SportChat.git
cd SportChat
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# Project Configuration
NEXT_PUBLIC_PROJECT_ID=your-project-id
NEXT_PUBLIC_PROJECT_NAME=SportChat

# JWT Secret for Authentication (generate a secure random string)
JWT_SECRET=your-jwt-secret-key

# Supabase Configuration (optional - for database mode)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Integration (if using external AI service)
AI_WEBHOOK_URL=your-ai-webhook-endpoint
AI_API_KEY=your-ai-api-key
```

4. **Run in development mode**
```bash
npm run dev
```

5. **Open the application**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Structure

The application supports two data storage modes:

### JSON Database (Default)
Files located in `data/db/`:
- `users.json` - User accounts
- `days.json` - Training days
- `chat_messages.json` - Chat history
- `workouts.json` - Workout records
- `goals.json` - User goals
- `achievements.json` - User achievements

### Supabase (Optional)
For Supabase setup, follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/update-profile` - Update user profile

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

### Training Days
- `GET /api/days?userId={id}` - Get user's days
- `POST /api/days` - Create new day
- `DELETE /api/days?dayId={id}` - Delete day

### Chat
- `GET /api/chat?dayId={id}` - Get day's messages
- `POST /api/chat` - Send message

### Goals & Achievements
- `GET /api/goals?userId={id}` - Get user goals
- `GET /api/achievements?userId={id}` - Get user achievements

## 🎨 Components

### Core Components
- **Chat** - Interactive AI chat assistant
- **Dashboard** - Analytics and statistics dashboard
- **DayManager** - Training day management
- **UserProfile** - User profile management
- **Navigation** - Section navigation

### Utilities
- **client-api.ts** - Client-side API utilities
- **json-db.ts** - JSON database operations
- **auth.ts** - Authentication utilities

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
The application is compatible with any platform supporting Next.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 🔒 Security

- JWT tokens for authentication
- HTTP-only cookies for session storage
- Server-side data validation
- CORS configuration
- Environment variables for sensitive data
- Rate limiting (recommended to implement)

### Security Best Practices
- Never commit sensitive keys to version control
- Use strong, randomly generated JWT secrets
- Regularly rotate API keys
- Implement proper input validation
- Use HTTPS in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure code passes linting

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 🆘 Support

If you encounter issues or have questions:

1. Check existing [Issues](../../issues) on GitHub
2. Create a new Issue with detailed problem description
3. Ensure all dependencies are installed correctly
4. Verify environment variable configuration

## 🔄 Roadmap

Upcoming features and improvements:
- Enhanced AI workout recommendations
- Mobile app version
- Social features and community
- Advanced analytics and insights
- Integration with fitness wearables
- Multi-language support

## 📊 Project Structure

```
SportChat/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   └── lib/               # Utilities and helpers
├── data/db/               # JSON database files
├── public/                # Static assets
├── .env                   # Environment variables
├── package.json           # Dependencies
└── README.md             # This file
```

---

**Built with ❤️ for the fitness community**

For more information, visit the [GitHub repository](https://github.com/zaharenok/SportChat.git)