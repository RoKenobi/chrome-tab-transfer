const SERVER_URL = 'http://localhost:7878';

// Check if server is running
async function checkServer() {
  const statusDiv = document.getElementById('serverStatus');
  try {
    const response = await fetch(`${SERVER_URL}/status`);
    if (response.ok) {
      statusDiv.textContent = '✅ Server connected';
      statusDiv.className = 'server-status online';
      return true;
    }
  } catch (error) {
    statusDiv.textContent = '❌ Server offline - Start server.js first';
    statusDiv.className = 'server-status';
    return false;
  }
}

// Load all windows and their tabs
async function loadWindows() {
  const windows = await chrome.windows.getAll({ populate: true });
  const windowList = document.getElementById('windowList');
  const exportBtn = document.getElementById('exportBtn');
  
  if (windows.length === 0) {
    windowList.innerHTML = '<div class="empty-state">No windows found</div>';
    return;
  }
  
  windowList.innerHTML = '';
  
  windows.forEach((window, index) => {
    const tabs = window.tabs || [];
    const tabCount = tabs.length;
    const groupCount = new Set(tabs.map(t => t.groupId).filter(id => id !== -1)).size;
    
    const windowItem = document.createElement('div');
    windowItem.className = 'window-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `window-${window.id}`;
    checkbox.dataset.windowId = window.id;
    
    checkbox.addEventListener('change', () => {
      const anyChecked = document.querySelectorAll('.window-item input:checked').length > 0;
      exportBtn.disabled = !anyChecked;
    });
    
    const windowInfo = document.createElement('div');
    windowInfo.className = 'window-info';
    
    const title = document.createElement('div');
    title.className = 'window-title';
    title.textContent = `Window ${index + 1}`;
    
    const meta = document.createElement('div');
    meta.className = 'window-meta';
    meta.textContent = `${tabCount} tab${tabCount !== 1 ? 's' : ''}`;
    if (groupCount > 0) {
      meta.textContent += `, ${groupCount} group${groupCount !== 1 ? 's' : ''}`;
    }
    
    windowInfo.appendChild(title);
    windowInfo.appendChild(meta);
    
    windowItem.appendChild(checkbox);
    windowItem.appendChild(windowInfo);
    
    windowItem.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
    
    windowList.appendChild(windowItem);
  });
}

// Show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Export selected windows
document.getElementById('exportBtn').addEventListener('click', async () => {
  const checkedBoxes = document.querySelectorAll('.window-item input:checked');
  
  if (checkedBoxes.length === 0) {
    showStatus('Please select at least one window', 'error');
    return;
  }
  
  const windowIds = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.windowId));
  
  try {
    showStatus('Exporting tabs...', 'info');
    
    // Send message to background script to collect tab data
    const response = await chrome.runtime.sendMessage({
      action: 'exportTabs',
      windowIds: windowIds
    });
    
    if (response.success) {
      showStatus(`✅ Exported ${response.tabCount} tabs!`, 'success');
    } else {
      showStatus('❌ Export failed: ' + response.error, 'error');
    }
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
  }
});

// Import tabs
document.getElementById('importBtn').addEventListener('click', async () => {
  try {
    showStatus('Importing tabs...', 'info');
    
    const response = await chrome.runtime.sendMessage({
      action: 'importTabs'
    });
    
    if (response.success) {
      showStatus(`✅ Imported ${response.tabCount} tabs!`, 'success');
      setTimeout(() => window.close(), 1500);
    } else {
      showStatus('❌ Import failed: ' + response.error, 'error');
    }
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
  }
});

// Initialize
checkServer();
loadWindows();