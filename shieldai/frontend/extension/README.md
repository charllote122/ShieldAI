# ShieldAI Kenya Browser Extension

A Chrome/Chromium browser extension that provides real-time protection against digital harassment and toxic content on social media platforms.

## 📁 Files Overview

### Core Extension Files

- **`manifest.json`** - Extension configuration and permissions
- **`background.js`** - Service worker handling extension lifecycle
- **`content.js`** - Content script that monitors social media pages
- **`popup.html`** - Extension popup UI
- **`popup.js`** - Popup interaction logic
- **`styles.css`** - Styling for content warnings and popup

### Icons

- **`icons/icon16.svg`** - 16x16 icon (toolbar)
- **`icons/icon48.svg`** - 48x48 icon (management page)
- **`icons/icon128.svg`** - 128x128 icon (Chrome Web Store)

## 🚀 Features

### Real-time Content Analysis
- Scans posts, comments, and messages on social media
- Uses ShieldAI backend API to detect toxic content
- Kenya-focused cultural context for analysis

### Supported Platforms
- ✅ Facebook
- ✅ Twitter/X
- ✅ Instagram
- ✅ WhatsApp Web

### Protection Mechanisms
- **Automatic Detection**: Identifies toxic content without user intervention
- **Safe Display**: Hides harmful content behind a warning banner
- **User Control**: "Show Anyway" button allows reviewing flagged content
- **Error Reporting**: Users can report false positives
- **Live Stats**: Shows number of analyzed and blocked items

### Emergency Information
- Quick access to Kenya emergency contacts
- Mental health hotlines (1199, 0800 720 715)
- Links to support resources

## 📦 Installation

### For Development/Testing

1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `extension/` directory

### For Users (When Published)

- Will be available on Chrome Web Store
- One-click installation
- Automatic updates

## ⚙️ Configuration

The extension uses the ShieldAI API for analysis:

```javascript
// Default API endpoint
https://shieldai-31j7.onrender.com/analyze

// Or local development
http://localhost:8000/analyze
```

### Backend API Requirements

The extension requires the ShieldAI backend API to be running. It will fall back to local analysis if the API is unavailable.

## 🔒 Privacy & Security

- Content is only sent to the analysis API
- No personal data collection
- Runs entirely in browser when possible
- Respects Chrome security policies
- Minimum required permissions

### Requested Permissions

| Permission | Reason |
|-----------|--------|
| `activeTab` | Access current tab for analysis |
| `storage` | Save user settings and stats |
| `https://shieldai-31j7.onrender.com/*` | API communication |
| `*://*.facebook.com/*` | Monitor Facebook posts |
| `*://*.twitter.com/*` | Monitor Twitter posts |
| `*://*.instagram.com/*` | Monitor Instagram posts |
| `*://web.whatsapp.com/*` | Monitor WhatsApp messages |

## 📊 How It Works

### Detection Flow

```
1. User visits social media
   ↓
2. Content script loads and injects ShieldAI badge
   ↓
3. Monitors DOM for new posts/comments
   ↓
4. Extracts text content
   ↓
5. Sends to ShieldAI API for analysis
   ↓
6. If toxic: Display warning banner
   If safe: Add green checkmark
   ↓
7. Track stats (Protected, Blocked)
```

### Warning Banner

When toxic content is detected:
- Content is hidden by default
- Warning banner shows toxicity score
- Risk level displayed (low/medium/high)
- User can "Show Anyway" or "Report Error"

### Stats Tracking

The popup displays:
- **Content Analyzed**: Total items scanned
- **Safe Content**: Safe items detected
- **Blocked**: Toxic items hidden

## 🛠️ Development

### File Structure

```
extension/
├── manifest.json          # Extension config
├── background.js          # Service worker
├── content.js            # Content detection
├── popup.html            # Popup UI
├── popup.js              # Popup logic
├── styles.css            # All styling
├── icons/
│   ├── icon16.svg        # Toolbar icon
│   ├── icon48.svg        # Settings icon
│   └── icon128.svg       # Store icon
└── README.md             # This file
```

### Modifying Content Detection

Edit the selectors in `content.js` to support more platforms:

```javascript
const selectors = [
    '[data-testid="tweetText"]',  // Twitter
    '.userContent',                 // Facebook
    // Add more platform selectors here
];
```

### Customizing Styling

Edit `styles.css` to change:
- Warning banner appearance
- Safe content badge styling
- Popup colors and layout
- Dark mode support

## 🐛 Troubleshooting

### Extension not loading

- Verify all files exist in `extension/` directory
- Check `manifest.json` for syntax errors
- Ensure icons are SVG format
- Try re-loading extension in `chrome://extensions/`

### Content not being detected

- Check browser console for errors (F12)
- Verify social media selectors match current HTML
- Ensure API is accessible
- Check network tab for API calls

### API errors

- Verify backend is running
- Check API endpoint in `content.js`
- Test API manually: `curl https://shieldai-31j7.onrender.com/health`

### Popup not showing stats

- Ensure `popup.js` can communicate with content script
- Check for content security policy violations
- Verify `popup.html` elements have correct IDs

## 📈 Performance

- **Lazy Loading**: Only analyzes visible content
- **Caching**: Prevents duplicate API calls for same content
- **Debouncing**: Limits frequency of DOM scans
- **Lightweight**: ~50KB total size

## 🔄 Updates & Maintenance

### Version History

- **1.0.0** (Current)
  - Initial release
  - Support for 4 platforms
  - Kenya emergency contacts
  - Real-time analysis

### Planned Features

- [ ] Email integration
- [ ] More language support
- [ ] Advanced reporting dashboard
- [ ] Community reporting
- [ ] API offline mode
- [ ] Custom word lists

## 📞 Support

For issues or feature requests:

- **Website**: https://shieldai-kenya.web.app
- **Resources**: https://shieldai-kenya.web.app/resources
- **Report Bug**: https://shieldai-kenya.web.app/report
- **Kenya Emergency**: 1199 or 0800 720 715

## 📄 License

This extension is part of ShieldAI Kenya project.
All rights reserved.

---

**Made with 🇰🇪 for Kenyan women's digital safety**
