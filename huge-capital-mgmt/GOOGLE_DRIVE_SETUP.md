# Google Drive Setup Instructions

## Problem
Service accounts don't have their own storage quota, so we need to use a folder in YOUR personal Google Drive.

## Solution - Quick Steps

### Option 1: Create Folder Manually (Easiest)

1. **Go to your Google Drive**: https://drive.google.com

2. **Create a new folder**:
   - Click "New" → "New folder"
   - Name it: `Huge Capital - Deal Documents`

3. **Share with service account**:
   - Right-click the folder → "Share"
   - Add this email: `huge-deals-page@huge-brain.iam.gserviceaccount.com`
   - Set permission to: **Editor**
   - Uncheck "Notify people" (it's a robot)
   - Click "Share"

4. **Get the folder ID**:
   - Open the folder you just created
   - Look at the URL in your browser: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy everything after `/folders/` - that's your folder ID
   - Example: If URL is `https://drive.google.com/drive/folders/1ABC123xyz`, then `1ABC123xyz` is the folder ID

5. **Update Supabase secret**:
   - Run this command (replace `YOUR_FOLDER_ID` with the ID you copied):
   ```bash
   npx supabase secrets set GOOGLE_DRIVE_PARENT_FOLDER_ID=YOUR_FOLDER_ID --project-ref oymwsfyspdvbazklqkpm
   ```

6. **Redeploy the edge function**:
   ```bash
   npx supabase functions deploy parse-deal-documents --project-ref oymwsfyspdvbazklqkpm
   ```

7. **Test it!**
   - Go to http://localhost:5173/deals
   - Click "New Deal"
   - Upload some documents
   - Check if they appear in your Google Drive folder

---

## Verification

After setup, your folder structure should look like:
```
Your Google Drive
└── Huge Capital - Deal Documents/          (shared with service account)
    └── [Business Name] - [Date]/           (auto-created by app)
        ├── application.pdf
        ├── bank_statement_1.pdf
        └── bank_statement_2.pdf
```

---

## Current Service Account Email
`huge-deals-page@huge-brain.iam.gserviceaccount.com`

---

## Troubleshooting

**"Permission denied" error?**
- Make sure you gave **Editor** permissions (not just Viewer)
- The service account email should show up in the "Shared with" list

**"Folder not found" error?**
- Double-check the folder ID is correct
- Make sure you copied the full ID from the URL

**Still not working?**
- Try waiting 1-2 minutes after sharing (permissions can take a moment to propagate)
- Make sure the folder is in YOUR personal Drive, not a Shared Drive
