# Supabase Configuration for Authentication

## Fix Email Redirect Issue

When users click confirmation links in emails, they're being redirected to the old Supabase dashboard instead of your app. Here's how to fix it:

### Step 1: Configure Site URL and Redirect URLs

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm

2. Navigate to: **Authentication → URL Configuration**

3. Set the following URLs:

   **Site URL:**
   ```
   http://localhost:5174/huge-capital-mgmt/
   ```

   **Redirect URLs (add all of these):**
   ```
   http://localhost:5173/huge-capital-mgmt/**
   http://localhost:5174/huge-capital-mgmt/**
   http://localhost:5175/huge-capital-mgmt/**
   ```

   When you deploy to GitHub Pages, also add:
   ```
   https://yourusername.github.io/huge-capital-mgmt/**
   ```

### Step 2: Disable Email Confirmation (For Development)

For easier testing during development:

1. Go to: **Authentication → Providers → Email**

2. Scroll down to **"Email Settings"**

3. Toggle OFF: **"Enable email confirmations"**

This means users can log in immediately without confirming their email (only do this for development!)

### Step 3: Create Test Users Directly

Instead of using the signup flow, create users manually:

1. Go to: **Authentication → Users**
2. Click **"Add User"** → **"Create new user"**
3. Enter:
   - Email: your@email.com
   - Password: yourpassword123
   - Auto Confirm User: **YES** (toggle on)
4. Click **"Create User"**

Now you can log in with that email/password immediately!

---

## Alternative: Use Magic Links (Recommended for Production)

Once deployed, you can enable passwordless login:

1. Go to: **Authentication → Providers → Email**
2. Enable **"Magic Link"**
3. Users will receive a link to log in without a password

---

## Current Setup

Your app is configured for email/password authentication. Users created manually in the Supabase dashboard can log in immediately without email confirmation.
