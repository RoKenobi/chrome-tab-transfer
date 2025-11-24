const SERVER_URL = 'http://localhost:7878';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportTabs') {
    handleExport(request.windowIds).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'importTabs') {
    handleImport().then(sendResponse);
    return true;
  }
});

// Export tabs from selected windows
async function handleExport(windowIds) {
  try {
    const tabData = {
      windows: [],
      exportedAt: new Date().toISOString()
    };
    
    // Get all windows
    const allWindows = await chrome.windows.getAll({ populate: true });
    
    // Filter to selected windows
    const selectedWindows = allWindows.filter(w => windowIds.includes(w.id));
    
    // Process each window
    for (const window of selectedWindows) {
      const windowData = {
        tabs: [],
        groups: {}
      };
      
      // Get all tab groups in this window
      const groupIds = [...new Set(window.tabs.map(t => t.groupId).filter(id => id !== -1))];
      
      for (const groupId of groupIds) {
        try {
          const group = await chrome.tabGroups.get(groupId);
          windowData.groups[groupId] = {
            title: group.title || '',
            color: group.color,
            collapsed: group.collapsed
          };
        } catch (error) {
          console.warn('Could not get group info:', error);
        }
      }
      
      // Process each tab
      for (const tab of window.tabs) {
        // Skip Chrome system pages
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
          continue;
        }
        
        windowData.tabs.push({
          url: tab.url,
          title: tab.title,
          pinned: tab.pinned,
          groupId: tab.groupId,
          index: tab.index
        });
      }
      
      if (windowData.tabs.length > 0) {
        tabData.windows.push(windowData);
      }
    }
    
    // Send to server
    const response = await fetch(`${SERVER_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tabData)
    });
    
    if (!response.ok) {
      throw new Error('Server error: ' + response.status);
    }
    
    const result = await response.json();
    const totalTabs = tabData.windows.reduce((sum, w) => sum + w.tabs.length, 0);
    
    return {
      success: true,
      tabCount: totalTabs
    };
    
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Import tabs from server
async function handleImport() {
  try {
    // Fetch data from server
    const response = await fetch(`${SERVER_URL}/import`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'No data available');
    }
    
    const result = await response.json();
    const tabData = result.data;
    
    let totalTabs = 0;
    
    // Create windows
    for (const windowData of tabData.windows) {
      // Create new window with first tab
      const firstTab = windowData.tabs[0];
      const newWindow = await chrome.windows.create({
        url: firstTab.url,
        focused: false
      });
      
      const firstTabId = newWindow.tabs[0].id;
      totalTabs++;
      
      // Map old group IDs to new group IDs
      const groupIdMap = {};
      
      // Create tab groups first
      for (const [oldGroupId, groupInfo] of Object.entries(windowData.groups)) {
        if (oldGroupId !== '-1') {
          const newGroupId = await chrome.tabs.group({
            tabIds: [firstTabId]
          });
          
          await chrome.tabGroups.update(newGroupId, {
            title: groupInfo.title,
            color: groupInfo.color,
            collapsed: groupInfo.collapsed
          });
          
          groupIdMap[oldGroupId] = newGroupId;
          
          // Ungroup the first tab (we just needed it to create the group)
          await chrome.tabs.ungroup(firstTabId);
        }
      }
      
      // Add remaining tabs
      for (let i = 1; i < windowData.tabs.length; i++) {
        const tabInfo = windowData.tabs[i];
        
        const newTab = await chrome.tabs.create({
          windowId: newWindow.id,
          url: tabInfo.url,
          pinned: tabInfo.pinned,
          active: false
        });
        
        totalTabs++;
        
        // Add to group if needed
        if (tabInfo.groupId !== -1 && groupIdMap[tabInfo.groupId]) {
          await chrome.tabs.group({
            tabIds: [newTab.id],
            groupId: groupIdMap[tabInfo.groupId]
          });
        }
      }
      
      // Update first tab's group if needed
      const firstTabInfo = windowData.tabs[0];
      if (firstTabInfo.groupId !== -1 && groupIdMap[firstTabInfo.groupId]) {
        await chrome.tabs.group({
          tabIds: [firstTabId],
          groupId: groupIdMap[firstTabInfo.groupId]
        });
      }
      
      // Pin first tab if needed
      if (firstTabInfo.pinned) {
        await chrome.tabs.update(firstTabId, { pinned: true });
      }
    }
    
    return {
      success: true,
      tabCount: totalTabs
    };
    
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}