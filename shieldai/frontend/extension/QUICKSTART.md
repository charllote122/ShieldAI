# 🚀 ShieldAI Kenya Extension - Quick Start

## ⚡ Get Started in 5 Minutes

### Prerequisites
- Chrome or Chromium browser
- ShieldAI backend running on `http://localhost:8000`

### Step 1: Start Backend (Terminal 1)
```bash
cd /workspaces/ShieldAI/shieldai/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
**Wait for**: `Uvicorn running on http://0.0.0.0:8000`

### Step 2: Open Extension (Chrome)
1. Open Chrome
2. Go to: `chrome://extensions/`
3. Toggle "Developer mode" (top-right)
4. Click "Load unpacked"
5. Select: `/workspaces/ShieldAI/shieldai/frontend/extension/`

### Step 3: Verify Installation
1. Check toolbar - you should see the ShieldAI icon (🛡️)
2. Click icon - popup should appear with stats
3. Protection toggle should be ON

### Step 4: Test on Twitter
1. Open: `https://twitter.com`
2. Look for 🇰🇪 **ShieldAI Kenya Active** badge in top-right
3. Post/view content with word "stupid"
4. You should see a warning banner appear

### Step 5: Check Stats
Click the extension icon again → Stats should show:
- Protected: 1+
- Safe: 0
- Blocked: 1+

## 📝 Test Cases

### Test 1: Safe Content
```
Input: "This is wonderful!"
Result: Green ✅ badge
```

### Test 2: Toxic Content
```
Input: "You are so stupid"
Result: Yellow/Red warning banner
       Toxicity: 30-50%
```

### Test 3: Harassment
```
Input: "Women belong in kitchen"
Result: Red warning banner
       Toxicity: 40-60%
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No icon in toolbar | Reload extension (↻ on extensions page) |
| Popup shows 0 stats | Refresh Twitter tab |
| Content not detected | Check backend running: `curl http://localhost:8000/health` |
| API errors in console | Ensure backend is on `http://localhost:8000` |

## 📚 Full Documentation

- **Features**: See `README.md`
- **Installation**: See `INSTALLATION.md`
- **Implementation**: See `SUMMARY.md`
- **Checklist**: See `CHECKLIST.md`

## 🎯 What Should Work

✅ Real-time content scanning  
✅ Toxicity detection  
✅ Warning banners  
✅ Stats tracking  
✅ Kenya hotline display  
✅ On/off toggle  

## 🆘 Need Help?

**Backend Issues:**
```bash
# Check if running
curl http://localhost:8000/health
```

**Extension Issues:**
1. Open DevTools (F12 on the social media page)
2. Go to Console tab
3. Look for ShieldAI messages
4. Report any errors

**Still stuck?**
- Review INSTALLATION.md for detailed steps
- Check extension README.md for full features

---

**That's it! Extension is ready to protect Kenyan women online! 🇰🇪🛡️**
