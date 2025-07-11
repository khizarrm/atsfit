# Passr - AI Resume Optimization

**Optimize your resume with AI precision** - Beat ATS systems and get more interviews with intelligent resume optimization powered by OpenAI.

## 🚀 Features

- **ATS Score Analysis** - Get detailed scoring based on job requirements
- **AI-Powered Keyword Extraction** - Extract relevant keywords from job descriptions
- **Resume Optimization** - AI rewrites your resume to match job requirements
- **PDF Export** - Generate professional PDFs of your optimized resume
- **Real-time Preview** - See changes as you edit your resume
- **Secure Authentication** - User accounts with Supabase Auth
- **Persistent Storage** - Your resumes are saved and accessible across sessions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **UI Components**: Radix UI + shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: Zustand with persistence and devtools
- **Authentication**: Supabase Auth with local caching
- **Database**: Supabase PostgreSQL
- **AI Integration**: OpenAI API for resume processing
- **Deployment**: Netlify

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Supabase account and project
- OpenAI API key

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd atsfit-dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# Application URL (for development)
NEXT_PUBLIC_HOST_URL=http://localhost:3000
```

### 4. Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Set up the required tables:
   - `resumes` table for storing user resume data
   - Enable Row Level Security (RLS) policies
3. Copy your project URL and anon key to the `.env.local` file

### 5. OpenAI API Setup
1. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file
3. Ensure you have credits/billing set up for API usage

## 🚀 Development

### Start the development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

### Other useful commands
```bash
# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📁 Project Structure

```
atsfit-dashboard/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Authentication pages
│   └── ...
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   └── ...
├── stores/              # Zustand state management
│   ├── slices/         # Store slices (auth, resume, ui)
│   └── ...
├── lib/                # Utilities and services
│   ├── database/      # Database operations
│   ├── utils/         # Utility functions
│   └── ...
├── contexts/           # React context providers
├── hooks/             # Custom React hooks
└── styles/           # Global styles
```

## 🔐 Authentication Flow

1. **Sign Up/Sign In** - Users create accounts via Supabase Auth
2. **Session Management** - Auth state cached locally for 24 hours
3. **Resume Setup** - New users directed to resume creation
4. **Dashboard Access** - Authenticated users can access all features

## 🎯 Usage

### 1. Create Account
- Sign up with email and password
- Verify your email if required

### 2. Set Up Resume
- Upload existing resume or create new one
- Content is automatically formatted

### 3. Analyze with ATS
- Paste job description
- Get ATS score and keyword analysis
- View matched/missing keywords

### 4. Optimize Resume
- Use AI suggestions to improve content
- Real-time preview of changes
- Export to PDF when ready

## 🌐 Deployment

### Netlify Deployment
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy with these settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

### Environment Variables for Production
```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_HOST_URL=https://your-domain.com
```

## 🔧 Configuration Notes

- **Build Process**: ESLint and TypeScript errors are ignored during builds for rapid iteration
- **Image Optimization**: Disabled for deployment compatibility
- **State Persistence**: User data cached in localStorage with 24-hour expiration
- **API Rate Limits**: Consider OpenAI API usage limits for production

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**: Check that all environment variables are set correctly
2. **API Failures**: Verify OpenAI API key and billing status
3. **Database Issues**: Ensure Supabase RLS policies are configured
4. **Auth Problems**: Check Supabase project settings and URLs

### Development Tips

- Use browser dev tools to inspect localStorage for cached auth state
- Check network tab for API call failures
- Zustand devtools available for state debugging

## 📄 License

This project is part of a resume optimization platform. Please check with the repository owner for licensing information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📧 Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ using Next.js, OpenAI, and Supabase**