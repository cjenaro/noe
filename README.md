# WXT + SolidJS

This template should help get you started developing with SolidJS in WXT.

# AFIP Invoice Helper 🇦🇷

A cross-browser extension to streamline electronic invoice creation on the AFIP (Administración Federal de Ingresos Públicos) platform. This tool helps users store and auto-fill invoice data, making the process of creating electronic invoices (facturas electrónicas) faster and more efficient.

## 🎯 Purpose

This extension works specifically with the AFIP electronic invoice system at `https://fe.afip.gob.ar/rcel/jsp/index_bis.jsp` and helps users:

- **Store invoice templates**: Save frequently used invoice data (client information, product descriptions, etc.)
- **Auto-fill forms**: Quickly populate invoice forms with saved data
- **Manage client database**: Store client information for quick reuse
- **Template system**: Create reusable invoice templates for different types of transactions

## 🚀 Features

- ✅ **Cross-browser compatibility**: Works on Chrome, Firefox, and other Chromium-based browsers
- ✅ **Local storage**: All data stored locally using IndexedDB (no server required)
- ✅ **Form auto-detection**: Automatically detects AFIP invoice forms
- ✅ **Data persistence**: Invoice data and templates saved between sessions
- ✅ **Privacy-focused**: No data leaves your browser
- ✅ **Easy import/export**: Backup and restore your data

## 📋 What Data Can Be Stored

### Client Information

- **Business details**: Company name, tax ID (CUIT), address
- **Contact information**: Phone, email, representative name
- **Tax category**: IVA status, responsibility type
- **Invoice preferences**: Default currency, payment terms

### Invoice Data

- **Product/Service descriptions**: Detailed item descriptions
- **Pricing information**: Unit prices, quantities, discounts
- **Tax calculations**: IVA rates, tax exemptions
- **Invoice metadata**: Invoice types (A, B, C), concepts

### Templates

- **Invoice templates**: Pre-configured invoice structures
- **Client templates**: Frequently used client combinations
- **Product catalogs**: Standard products/services with pricing

## 🛠️ Technical Stack

- **Framework**: [WXT](https://wxt.dev/) - Modern extension development
- **Storage**: IndexedDB for robust local data storage
- **Manifest**: V3 for maximum browser compatibility
- **Languages**: TypeScript, HTML, CSS

## 🏗️ Project Structure

```
afip-invoice-helper/
├── entrypoints/
│   ├── background.ts          # Background service worker
│   ├── content.ts             # Content script for form detection
│   └── popup/
│       ├── index.html         # Extension popup UI
│       ├── main.ts            # Popup logic
│       └── style.css          # Popup styling
├── components/
│   ├── InvoiceForm.ts         # Invoice data management
│   ├── ClientManager.ts       # Client database
│   └── TemplateManager.ts     # Template system
├── utils/
│   ├── storage.ts             # IndexedDB wrapper
│   ├── afip-detector.ts       # AFIP form detection
│   └── data-validator.ts      # Data validation utilities
├── assets/
│   ├── icon-16.png           # Extension icons
│   ├── icon-48.png
│   └── icon-128.png
├── wxt.config.ts             # WXT configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd afip-invoice-helper
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Load extension in browser**

   **For Chrome:**

   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `.output/chrome-mv3` folder

   **For Firefox:**

   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from `.output/firefox-mv3`

## 🔧 Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Build for specific browser
npm run build:chrome
npm run build:firefox

# Type checking
npm run type-check

# Linting
npm run lint
```

### Key Configuration

The extension is configured to work specifically with AFIP's electronic invoice system:

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: {
    permissions: ["storage", "activeTab"],
    host_permissions: ["https://fe.afip.gob.ar/*"],
  },
});
```

## 💾 Data Storage

### IndexedDB Schema

The extension uses IndexedDB for robust local storage

## 🔍 Form Detection

The extension automatically detects AFIP invoice forms using:

- **URL patterns**: Matches `https://fe.afip.gob.ar/rcel/jsp/*`
- **DOM selectors**: Identifies invoice form fields
- **Dynamic content**: Handles JavaScript-rendered forms

## 🎨 User Interface

### Popup Interface

- **Quick access**: One-click access to saved data
- **Template selection**: Choose from saved invoice templates
- **Client search**: Find clients quickly with search/filter
- **Data management**: Add, edit, delete stored information

## 🔒 Privacy & Security

- **Local-only storage**: No data transmitted to external servers
- **Secure contexts**: Only operates on HTTPS pages
- **No tracking**: No analytics or user tracking

## 🐛 Debugging

### Common Issues

1. **Form not detected**

   - Check URL matches pattern
   - Verify DOM structure hasn't changed
   - Check console for detection errors

2. **Data not saving**

   - Verify IndexedDB permissions
   - Check browser storage limits
   - Review console errors

3. **Auto-fill not working**
   - Confirm form fields are properly identified
   - Check data format compatibility
   - Verify field selectors

### Debug Mode

Enable debug logging:

```typescript
// In content script
const DEBUG = true;
if (DEBUG) {
  console.log("AFIP form detected:", formElements);
}
```

### Code Standards

- Use TypeScript for type safety
- Use Biome for linting and formatting

## 📦 Publishing to Browser Stores

### Chrome Web Store

1. **Prepare for submission**
   ```bash
   bun run build
   ```

2. **Create store assets**
   - Screenshots (1280x800 or 640x400)
   - Store icon (128x128)
   - Promotional images (optional)

3. **Submit to Chrome Web Store**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Upload the `chrome-mv3.zip` file from `.output/`
   - Fill in store listing details
   - Set privacy policy URL
   - Submit for review

4. **Required information**
   - Extension name: "AFIP Invoice Helper"
   - Category: Productivity
   - Description: Brief description of AFIP invoice automation
   - Privacy policy: Required for extensions that handle user data

### Firefox Add-ons (AMO)

1. **Build Firefox version**
   ```bash
   bun run build:firefox
   ```

2. **Submit to Firefox Add-ons**
   - Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
   - Upload the `firefox-mv3.zip` file from `.output/`
   - Complete the submission form
   - Submit for review

3. **Firefox-specific requirements**
   - Source code may be requested for review
   - Ensure manifest.json is Firefox-compatible
   - Test on Firefox before submission

### Microsoft Edge Add-ons

1. **Use Chrome build**
   ```bash
   bun run build
   ```

2. **Submit to Edge Add-ons**
   - Go to [Microsoft Edge Add-ons Developer Dashboard](https://partner.microsoft.com/dashboard/microsoftedge/)
   - Upload the same `chrome-mv3.zip` file
   - Complete store listing
   - Submit for review

### Store Listing Content

**Title**: AFIP Invoice Helper 🇦🇷

**Short Description**: Automate AFIP electronic invoice form filling with saved client data and payment methods.

**Detailed Description**:
```
Streamline your AFIP electronic invoice creation process with this productivity extension.

Features:
• Store and manage client information (CUIT, company details, addresses)
• Auto-fill AFIP invoice forms with one click
• Payment method selection with autocomplete
• Country selection with AFIP codes
• Export/import client data for backup
• Works on fe.afip.gob.ar

Perfect for Argentine businesses, accountants, and freelancers who regularly create electronic invoices through AFIP's platform.

Privacy: All data stored locally in your browser. No external servers or data transmission.
```

**Keywords**: AFIP, Argentina, invoice, factura electronica, tax, productivity, automation

**Privacy Policy**: Required - create a simple policy stating that all data is stored locally and no data is transmitted to external servers.

### Pre-submission Checklist

- [ ] Test extension in target browser
- [ ] Verify all features work correctly
- [ ] Check permissions are minimal and justified
- [ ] Prepare store screenshots
- [ ] Write clear store description
- [ ] Create privacy policy
- [ ] Test installation from zip file
- [ ] Verify manifest.json compliance

### Review Process

- **Chrome**: Usually 1-3 business days
- **Firefox**: Can take 1-2 weeks for new extensions
- **Edge**: Usually 1-7 business days

Extensions may be rejected for policy violations, so ensure compliance with each store's guidelines before submission.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🇦🇷 Argentina-Specific Notes

This extension is specifically designed for the Argentine tax system:

- **AFIP Integration**: Works with official AFIP electronic invoice system
- **Tax Compliance**: Supports Argentine tax categories and calculations
- **Invoice Types**: Supports Type E invoices as per AFIP requirements
- **Spanish Language**: UI optimized for Spanish-speaking users

---

**Made with ❤️ for Argentine businesses and accountants**
