# Google Sheets Setup Guide

## Current Configuration

Your Funding Dashboard is now connected to Google Sheets!

- **Spreadsheet ID**: `1wCc6qFA0aMIqlhCjndqMYKM3n6Iotbcsdwyl-SDPt4k`
- **API Key**: Configured ✓

## Expected Sheet Structure

The integration looks for data in **Sheet1** (first sheet tab). You can adjust this in `src/lib/googleSheets.ts` if your sheet has a different name.

### Recommended Column Headers

The code automatically detects columns. Here are the field names it looks for (case-insensitive):

#### Required/Important Columns:
- **Amount** / **FundingAmount** - Dollar amount of the deal
- **Stage** / **PipelineStage** - Current stage in pipeline
- **Tier** / **Paper** - Funding tier (A Paper, B Paper, C Paper, etc.)

#### Optional Columns:
- **DaysInPipeline** - Number of days in pipeline (for avg close time calculation)
- **Status** - Deal status
- Any other columns you want to track

### Example Sheet Structure:

| Business Name | Amount | Stage | Tier | DaysInPipeline | Status |
|---------------|--------|-------|------|----------------|---------|
| ABC Company | 50000 | Documentation | A Paper | 15 | Active |
| XYZ Corp | 75000 | Underwriting | B Paper | 22 | Active |
| Test LLC | 100000 | Funded | A Paper | 18 | Closed |

### Stage Names

Common stage names (customize as needed):
- Initial Contact
- Documentation
- Underwriting
- Approved
- Funded
- Closed
- Lost

**Note**: Deals in "Funded", "Closed", or "Lost" stages are excluded from "Active Deals" count.

## How the Dashboard Calculates Metrics

1. **Total Pipeline**: Sum of all `Amount` values
2. **Active Deals**: Count of deals NOT in Funded/Closed/Lost stages
3. **Avg Close Time**: Average of `DaysInPipeline` for "Funded" deals
4. **Conversion Rate**: (Funded deals / Total deals) × 100
5. **By Stage**: Groups deals by `Stage` column
6. **By Tier**: Groups deals by `Tier` column

## Making Your Sheet Accessible

### Option 1: Public Access (Simplest)
1. Open your Google Sheet
2. Click "Share" button (top right)
3. Click "Change to anyone with the link"
4. Set to "Viewer"
5. Copy the link

### Option 2: Service Account (More Secure)
If you need private access, you'll need to set up a service account. Let me know if you need help with this!

## Customizing the Integration

### Change Sheet Name or Range

Edit `src/lib/googleSheets.ts`:

```typescript
// Line 52 - Change 'Sheet1' to your sheet name
const rows = await fetchSheetData('YourSheetName!A1:Z1000');
```

### Add Custom Column Mappings

If your columns have different names, update the `calculateMetrics` function in `src/lib/googleSheets.ts`:

```typescript
// Example: If your amount column is called "Deal Size"
const amount = parseFloat(
  String(deal['Deal Size'] || '0').replace(/[$,]/g, '')
) || 0;
```

## Troubleshooting

### "Failed to fetch sheet data" Error

**Check these:**
1. ✓ Sheet is publicly accessible (or shared with service account)
2. ✓ Google Sheets API is enabled in Google Cloud Console
3. ✓ API key is valid and has Sheets API permissions
4. ✓ Spreadsheet ID is correct
5. ✓ Sheet name in code matches actual sheet tab name

### "No data found" Error

- Make sure your sheet has data in rows (not empty)
- First row should contain column headers
- Data should start from row 2

### Data Not Updating

- Click the "Refresh Data" button in the dashboard
- Data is cached in browser - hard refresh (Ctrl+F5) if needed
- Check browser console (F12) for any errors

## Testing the Connection

1. Go to http://localhost:5174/huge-capital-mgmt/
2. Log in
3. Navigate to Funding Dashboard
4. You should see:
   - Loading indicator
   - Real data from your sheet
   - "Connected to Google Sheets" message at bottom

If you see an error, check:
- Browser console (F12) for detailed error messages
- The error message on screen for specific issues
- This guide for troubleshooting steps

## Next Steps

Once connected, you can:
- Update your sheet and click "Refresh Data" to see changes
- Add more deals to see metrics update
- Customize the column names and calculations
- Add charts and visualizations

Need help customizing the integration? Just ask! 🚀
