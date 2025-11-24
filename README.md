# Chrome Profile Tab Transfer

Transfer tabs and tab groups between Chrome profiles locally - no cloud sync needed!

## 🎯 What This Does

- Move tabs from one Chrome profile to another (e.g., "Ben" → "Tom")
- Preserves tab groups with names, colors, and collapsed state
- Works 100% locally on your computer
- No internet required after setup

---

## 📋 Prerequisites

- **Google Chrome** (version 89+)
- **Node.js** (version 16+) - [Download here](https://nodejs.org/)

---

## 🚀 Setup Instructions

### Step 1: Install the Extension (in BOTH profiles)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to and select the `extension` folder
5. You should see "Tab Transfer Tool" appear with a 📋 icon

**Repeat this in your second Chrome profile:**
- Click your profile icon → Add profile or switch profiles
- Go to `chrome://extensions/` and load the extension again

### Step 2: Start the Server

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to the `server` folder:
   ```bash
   cd path/to/chrome-tab-transfer/server
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. You should see:
   ```
   🚀 Chrome Tab Transfer Server running!
   📍 URL: http://localhost:7878
   ```

**Keep this terminal window open** while transferring tabs.

---

## 🎮 How to Use

### Exporting Tabs (Source Profile - e.g., "Ben")

1. Open Chrome with the source profile
2. Click the 📋 extension icon in your toolbar
3. You'll see a list of all open windows
4. **Check the boxes** next to windows you want to transfer
5. Click **Export Selected**
6. Wait for "✅ Exported X tabs!" message

### Importing Tabs (Target Profile - e.g., "Tom")

1. Switch to the target Chrome profile
2. Click the 📋 extension icon
3. Click **Import Tabs**
4. A new window opens with all your tabs and groups recreated!

---

## 🛠️ Troubleshooting

### "❌ Server offline"
- Make sure `node server.js` is running
- Check the terminal for errors

### Extension not showing in toolbar
- Go to `chrome://extensions/`
- Make sure "Tab Transfer Tool" is enabled
- Click the puzzle piece icon, then pin the extension

### Tabs not importing
- Check the server terminal for error messages
- Make sure you exported tabs first
- Try exporting again

### Groups not preserving colors
- This is a Chrome API limitation - some colors may change slightly
- Names and collapsed state are always preserved

---

## 🔒 Privacy & Security

- ✅ All data stays on your computer
- ✅ No internet connection required (except for loading web pages)
- ✅ No data is sent to external servers
- ✅ Server only runs on `localhost` (only accessible by you)

---

## 📁 Project Structure

```
chrome-tab-transfer/
├── server/
│   └── server.js          # Local HTTP server
├── extension/
│   ├── manifest.json      # Extension config
│   ├── popup.html         # User interface
│   ├── popup.js           # UI logic
│   └── background.js      # Tab handling
└── README.md
```

---

## 💡 Tips

- You can transfer multiple windows at once
- Pinned tabs stay pinned
- Chrome system pages (chrome://) are skipped automatically
- Server can stay running in the background - use it anytime!

---

## 🐛 Known Limitations

- Cannot transfer Chrome system pages (chrome://, chrome-extension://)
- Server must be running for transfers to work
- Tab history is not preserved (new tabs start fresh)

---

## 📝 License

MIT - Feel free to modify and use however you like!
