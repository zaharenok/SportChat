# 🏋️ SportChat - Your AI Fitness Companion

Smart fitness tracking application with AI integration for personalized workout advice and motivation.

*Умное приложение для отслеживания тренировок и получения персональных советов с интеграцией ИИ.*

## 🚀 Features

- **📅 Workout Day Management** - Create and track training days
- **💬 AI Chat Assistant** - Personalized advice and motivation 
- **📊 Analytics Dashboard** - Progress visualization and statistics
- **🎯 Goals & Achievements** - Set goals and track results
- **👤 User Profile** - Personal data management
- **🔐 Secure Authentication** - Cookie-based login system

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Redis (Upstash)
- **Authentication**: Custom cookie-based system
- **Deployment**: Vercel
- **AI Integration**: N8N webhooks
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Requirements

- Node.js 18+ 
- npm or yarn
- Redis database (Upstash recommended)
- N8N for AI integration (optional)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd sportchat
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Fill in the `.env` file:

```env
# Required variables
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-redis-token
WEBHOOK_URL=https://your-n8n.com/webhook/your-id

# Optional
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database

The application uses **Redis** via Upstash for:

- Users and authentication
- Training days and data
- Chat messages
- Goals and achievements
- User sessions (TTL 7 days)

### Redis Setup (Upstash)

1. Create database at [upstash.com](https://upstash.com)
2. Copy **REST API URL** and **Token**
3. Add to environment variables

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm start            # Start production server
npm run lint         # Run ESLint code check
npm run type-check   # Run TypeScript type check
```

## 📁 Project Structure

```
sportchat/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── register/       # Registration page
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main page
│   ├── components/         # React components
│   │   ├── Chat.tsx       # AI chat
│   │   ├── Dashboard.tsx  # Analytics
│   │   ├── DayManager.tsx # Day management
│   │   └── ...
│   └── lib/               # Utilities and API
│       ├── redis-db.ts   # Redis adapter
│       ├── auth.ts       # Authentication
│       └── client-api.ts # Client-side API
├── public/                # Static files
├── .env.example          # Environment template
├── SECURITY.md          # Security instructions
└── README.md           # This file
```

## 🚀 Deploy on Vercel

### 1. Preparation

```bash
npm run build  # Check build
```

### 2. Vercel Setup

1. Connect your repository to Vercel
2. In **Project Settings → Environment Variables** add all variables from `.env`
3. Mark sensitive variables as **Sensitive**

### 3. Environment Variables in Vercel

```env
KV_REST_API_URL          (Sensitive) ✅
KV_REST_API_TOKEN        (Sensitive) ✅  
WEBHOOK_URL              (Sensitive) ✅
NEXT_PUBLIC_WEBHOOK_URL  (Public)
```

### 4. Deploy

Vercel automatically deploys on push to main branch.

## 🔐 Security

- ✅ All sensitive data in environment variables
- ✅ `.env` excluded from git
- ✅ Cookie-based authentication with httpOnly
- ✅ Redis sessions with automatic TTL
- ✅ All user data validation

See [SECURITY.md](./SECURITY.md) for details.

## 🤖 AI Integration

### N8N Webhook

1. Set up N8N workflow with HTTP webhook
2. Add request processing from SportChat
3. Integrate with your AI service (OpenAI, Claude, etc.)
4. Add webhook URL to `WEBHOOK_URL`

### N8N Workflow Example

```json
{
  "trigger": "webhook",
  "method": "POST", 
  "data": {
    "message": "user message",
    "context": "training context"
  }
}
```

## 🤝 Development

### Adding New Features

1. Create feature branch
2. Add components to `src/components/`
3. Add API routes to `src/app/api/`
4. Update types in `src/lib/`
5. Create PR with description

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Components with TypeScript interfaces
- Async/await for asynchronous operations

## 📞 Support

If you have questions:

1. Check [SECURITY.md](./SECURITY.md) for deployment issues
2. Check logs in Vercel Functions
3. Verify environment variables
4. Open Issue in repository

## 📄 License

MIT License - feel free to use for any purpose.

---

**Built with ❤️ for the fitness community**

🚀 **GitHub**: https://github.com/zaharenok  
💪 **Start training with AI today!**
