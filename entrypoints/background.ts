import { browser } from "wxt/browser";

export default defineBackground(() => {
  console.log("AFIP Helper background script loaded", {
    id: browser.runtime.id,
  });

  // Set up action click handler to open sidepanel/sidebar
  browser.action.onClicked.addListener(async (tab) => {
    try {
      await openSidePanel(tab);
    } catch (error) {
      console.error("Error opening sidepanel:", error);
    }
  });

  // Listen for messages from content script
  browser.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {
      if (
        message.command === "openSidebar" ||
        message.action === "openSidepanel"
      ) {
        try {
          const tab = sender.tab;
          if (tab) {
            await openSidePanel(tab);
            sendResponse({ success: true });
          } else {
            sendResponse({
              success: false,
              error: "Unable to open sidepanel - tab not found",
            });
          }
        } catch (error) {
          console.error("Error opening sidepanel:", error);
          sendResponse({ success: false, error: String(error) });
        }
      }

      return true; // Keep the message channel open for async response
    },
  );
});

async function openSidePanel(tab: Browser.tabs.Tab) {
  if (!tab.id) {
    throw new Error("Tab ID not available");
  }

  // Chrome: Use sidePanel API
  if (browser.sidePanel) {
    await browser.sidePanel.open({ tabId: tab.id });
    return;
  }

  // Firefox: Use sidebarAction API
  // TODO: not working
  // if (import.meta.env.FIREFOX && browser.sidebarAction) {
  //   await browser.sidebarAction.open({
  //     windowId: tab.windowId,
  //     tabId: tab.id,
  //     url: browser.runtime.getURL("sidepanel.html"),
  //   });
  //   return;
  // }

  throw new Error("Neither sidePanel nor sidebarAction API is available");
}
