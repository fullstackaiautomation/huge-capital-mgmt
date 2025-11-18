# Quick Setup Guide

## Immediate Next Steps

### 1. Set Up Supabase (Required before running the app)

1. **Create Supabase Project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details
   - Wait for project to be ready (~2 minutes)

2. **Get API Credentials:**
   - Go to Project Settings (gear icon) → API
   - Copy:
     - Project URL (looks like: `https://xxxxx.supabase.co`)
     - `anon` `public` key (long string starting with `eyJ...`)

3. **Run Database Schema:**
   - In Supabase Dashboard, go to SQL Editor (left sidebar)
   - Click "New Query"
   - Open `supabase-schema.sql` from this project
   - Copy entire contents and paste into query editor
   - Click "Run" or press Ctrl/Cmd + Enter

4. **Create Your Users:**
   - Go to Authentication → Users (left sidebar)
   - Click "Add User" → "Create new user"
   - Create 3 users:
     - Your email + password
     - Team member 1 email + password
     - Team member 2 email + password

### 2. Update Environment Variables

Edit the `.env` file in the project root:

\`\`\`env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_SHEETS_API_KEY=your_key_here_if_available
VITE_GOOGLE_SHEETS_ID=your_sheet_id_if_available
\`\`\`

> Note: Google Sheets integration is optional for now. You can add it later.

### 3. Run the Development Server

\`\`\`bash
cd huge-capital-mgmt
npm run dev
\`\`\`

The app will open at [http://localhost:5173](http://localhost:5173)

### 4. Log In

Use one of the email/password combinations you created in Supabase.

---

## Optional: Google Sheets Integration

To display live funding data, you'll need to:

1. **Enable Google Sheets API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable "Google Sheets API"
   - Create API Key credentials

2. **Get Spreadsheet ID:**
   - Open your Funding Dashboard spreadsheet
   - Copy ID from URL: `https://docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit`

3. **Update .env:**
   - Add the API key and spreadsheet ID to `.env`
   - Restart the dev server

---

## Deploy to GitHub Pages

### Prerequisites
- GitHub account
- Repository created

### Steps:

1. **Initialize Git (if not already done):**
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   \`\`\`

2. **Update vite.config.ts:**
   - Change `base: '/huge-capital-mgmt/'` to `base: '/your-repo-name/'`

3. **Push to GitHub:**
   \`\`\`bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   \`\`\`

4. **Configure GitHub Pages:**
   - Go to repo Settings → Pages
   - Set Source to "GitHub Actions"

5. **Add Secrets:**
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add each:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_GOOGLE_SHEETS_API_KEY` (if using)
     - `VITE_GOOGLE_SHEETS_ID` (if using)

6. **Deploy:**
   - Workflow will run automatically on push to main
   - Or manually trigger from Actions tab
   - App will be live at: `https://yourusername.github.io/your-repo-name/`

---

## Troubleshooting

### "Missing Supabase environment variables" error
- Check `.env` file exists in project root
- Verify variables start with `VITE_`
- Restart dev server after changing `.env`

### Can't log in
- Verify users were created in Supabase Authentication
- Check Supabase URL and key are correct
- Open browser console (F12) to see error messages

### Build fails
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`
- Check Node.js version: `node --version` (should be 18+)

### Pages don't load
- Check browser console for errors
- Verify all imports are correct
- Try clearing browser cache

---

## What's Next?

After the app is running, you can:

1. **Customize the UI:**
   - Edit colors in `tailwind.config.js`
   - Modify components in `src/components/`
   - Update page layouts in `src/pages/`

2. **Add Real Data:**
   - Implement Google Sheets fetching in `FundingDashboard.tsx`
   - Create/edit tasks in `AIAutomationTasks.tsx`
   - Draft content in `ContentManagement.tsx`

3. **Enhance Features:**
   - Add CRUD operations for tasks
   - Implement content saving to database
   - Add file uploads for images
   - Create charts/visualizations

Need help? Check the main README.md for full documentation.
