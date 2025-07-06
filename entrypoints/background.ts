export default defineBackground(() => {
  console.log('AFIP Helper background script loaded', { id: browser.runtime.id });
  
  // Listen for messages from content script
  browser.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
    if (message.action === 'openPopup') {
      try {
        // Get the current active tab
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        
        if (tab?.id) {
          // Open the popup programmatically
          await browser.action.openPopup();
          sendResponse({ success: true });
        }
      } catch (error) {
        console.error('Error opening popup:', error);
        sendResponse({ success: false, error: String(error) });
      }
    }
    
    return true; // Keep the message channel open for async response
  });
});
