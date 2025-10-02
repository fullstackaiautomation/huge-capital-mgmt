# Huge Capital - Business Management Tool

A comprehensive multi-user business management application built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

### 🔐 Authentication
- Secure authentication powered by Supabase
- Protected routes
- Multi-user support

### 📊 Funding Dashboard
- Live data integration with Google Sheets
- Pipeline stage tracking
- Key metrics visualization
- Conversion rate analytics
- Deal timeline tracking

### 🤖 AI Automation Tasks
- Task management with status tracking
- Connector/tool tracking
- Opportunity level prioritization
- Interactive checklists
- Discovery call findings reference
- AI tools research section

### 📝 Content Management
- Multi-platform content management (LinkedIn, Facebook, Instagram, Blog)
- Live preview for each platform
- Character count tracking
- Content scheduling
- Status workflow (Pending → Approved → Scheduled → Published)
- Brand voice guidelines for founders

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Backend/Database:** Supabase
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** GitHub Pages

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud account (for Sheets API)
- GitHub account (for deployment)

## Setup Instructions

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd huge-capital-mgmt
npm install
\`\`\`

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Run the SQL schema:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the script

### 3. Create Users

In your Supabase Dashboard:
1. Go to Authentication → Users
2. Click "Add User"
3. Create 3 users with email/password combinations

### 4. Set Up Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create credentials (API Key)
5. Get your spreadsheet ID from the URL:
   \`https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit\`

### 5. Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
VITE_GOOGLE_SHEETS_ID=your_google_sheets_id
\`\`\`

### 6. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:5173` to see your application.

## Database Schema

### Tables

- **profiles** - User profile information
- **ai_tasks** - AI automation task tracking
- **content_drafts** - Content management and scheduling

See `supabase-schema.sql` for complete schema details.

## Deployment to GitHub Pages

### 1. Update Base Path

Edit `vite.config.ts` and update the `base` property to match your GitHub repository name:

\`\`\`typescript
base: '/your-repo-name/',
\`\`\`

### 2. Configure GitHub Repository

1. Push your code to GitHub
2. Go to Settings → Pages
3. Set Source to "GitHub Actions"

### 3. Add Secrets

Go to Settings → Secrets and variables → Actions, and add:

- \`VITE_SUPABASE_URL\`
- \`VITE_SUPABASE_ANON_KEY\`
- \`VITE_GOOGLE_SHEETS_API_KEY\`
- \`VITE_GOOGLE_SHEETS_ID\`

### 4. Deploy

Push to the \`main\` branch or manually trigger the workflow:

\`\`\`bash
git add .
git commit -m "Initial deployment"
git push origin main
\`\`\`

Your app will be available at: \`https://[username].github.io/[repo-name]/\`

## Project Structure

\`\`\`
huge-capital-mgmt/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.tsx
│   │   ├── Login.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/           # Page components
│   │   ├── FundingDashboard.tsx
│   │   ├── AIAutomationTasks.tsx
│   │   └── ContentManagement.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useAuth.tsx
│   ├── lib/             # Utilities and configs
│   │   └── supabase.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions deployment
├── supabase-schema.sql  # Database schema
├── .env.example         # Environment template
└── README.md
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run lint\` - Run ESLint

## Features Roadmap

### Phase 1 (Current)
- ✅ Authentication and user management
- ✅ Basic page structure
- ✅ UI components and layout

### Phase 2 (Next Steps)
- [ ] Google Sheets integration for Funding Dashboard
- [ ] Real-time data updates with Supabase
- [ ] Task CRUD operations
- [ ] Content draft management
- [ ] Image uploads for content

### Phase 3 (Future)
- [ ] AI content generation
- [ ] Automated social media posting
- [ ] Analytics and reporting
- [ ] Team collaboration features
- [ ] Mobile app

## Contributing

This is a private business tool for Huge Capital. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved
