# Specification Mining Report: Export and Print Channels & Dotted Invoice Compatibility

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Browser Print | Invoice Print Dialog | Opens dedicated print window containing `#invoice-preview` with all document styles and `@media print` rules | Invoice object, DOM `#invoice-preview` element | New browser window triggering `window.print()` | Falls back to `window.print()` in parent window if popup blocked | `src/pages/InvoiceView.tsx:47-57` |
| 2 | Browser Print | Share as PDF Modal | Opens standalone printable page with prompt to save as PDF via `Ctrl+P` | Invoice object, DOM styles, `#invoice-preview` | Printable HTML page with `Ctrl+P` instructions | Falls back to `window.print()` if popup blocked | `src/pages/InvoiceView.tsx:59-70` |
| 3 | Browser Print | Global Print Styles | Print media stylesheet ensuring zero margin, white background, and exact color preservation | Browser print action | CSS applied to printed page | Hides all elements with `.no-print` class | `src/App.tsx:287-290`, `src/pages/InvoiceView.tsx:153-160` |
| 4 | Browser Print | Barcode Label Print | Printable label layout unhiding `#barcode-labels` with flexbox flow and 5mm margins | Selected items, barcode label size (`small`, `medium`, `large`) | Barcode SVG grid layout for thermal/A4 sticker printing | Slices overflow; invalid barcodes log error in console | `src/pages/BarcodePrint.tsx:93-111` |
| 5 | Browser Print | Party Account Statement Print | Generates printable account ledger table with debit/credit totals and opening/closing balances | Party ID, date range filters, ledger records | Dedicated popup window with `PRINT_STYLE` and print dialog | Falls back to `window.print()` if popup blocked | `src/pages/PartyLedger.tsx:70-107` |
| 6 | Browser Print | Report Document Export | Standalone HTML report generator with styled header, summary cards, and table | Report title, header columns, data rows, subtitle | Formatted A4 portrait report in new window | Returns void if popup blocked | `src/utils/ExportBar.tsx:75-128` |
| 7 | Browser Print | Delivery Load Sheet Print | Delivery challan and load sheet print preview with signature lines | Delivery / Challan Invoice object | Browser print dialog | Hidden `.no-print` action buttons | `src/pages/ChallanPage.tsx:99-102` |
| 8 | Thermal Printing | ESC/POS Command Encoder | Binary command builder implementing standard ESC/POS control bytes | Text strings, alignment enums, bold/doubleSize flags | `Uint8Array` binary byte buffer | None (pure in-memory buffer builder) | `src/utils/thermalPrinter.ts:9-72` |
| 9 | Thermal Printing | Thermal Receipt Generator | Formats invoice metadata, item lines, totals, and business profile for 58mm/80mm receipts | Invoice object, `widthMm: 58 \| 80` (default 58) | ESC/POS byte sequence dispatched over Web Bluetooth | Catches Bluetooth errors and falls back to `window.print()` | `src/utils/thermalPrinter.ts:74-162` |
| 10 | Thermal Printing | Web Bluetooth GATT Client | Connects to Bluetooth thermal printers and sends chunked ESC/POS payloads | Bluetooth Service UUID `000018f0...`, Characteristic `00002af1...`, 512-byte chunks | Transmitted bytes over GATT characteristic | Catches connection/write failures, logs warning, invokes `window.print()` | `src/utils/thermalPrinter.ts:125-157` |
| 11 | Thermal Printing | POS Auto-Print | Automatically triggers 58mm thermal receipt printing upon POS sale completion | Completed POS Invoice object, `autoPrintThermal` boolean | Bluetooth GATT print job | Catches errors and skips gracefully | `src/pages/PosBilling.tsx:212-220` |
| 12 | WhatsApp Share | Invoice WhatsApp Share | Generates formatted WhatsApp summary with invoice number, date, party, item list, total, and terms | Invoice object, business settings | `https://wa.me/?text=...` URI opened in new tab | URI encoded; empty fields omitted | `src/pages/InvoiceView.tsx:72-77` |
| 13 | WhatsApp Share | Quick Invoice Share | Concise invoice confirmation message generated immediately after billing | Saved Invoice object | `https://wa.me/?text=...` URI | Standard URL encoding | `src/pages/Billing.tsx:211-214` |
| 14 | WhatsApp Share | Order Confirmation Share | Structured order summary with item breakdown, advance paid, remaining due, and dashed dividers | Order Invoice object, customer phone | `https://wa.me/{phone}?text=...` URI | Falls back to unaddressed `wa.me/?text=` if phone missing | `src/pages/OrdersPage.tsx:415-431` |
| 15 | WhatsApp Share | Instant Payment Receipt | Instant payment receipt message for field sales and collection workflows | Order/Invoice, collected amount, payment mode, salesman name | `https://wa.me/{phone}?text=...` URI | Strips non-numeric characters; prepends country code 91 if 10 digits | `src/pages/OrdersPage.tsx:247-256`, `src/pages/CollectionsPage.tsx:115-125` |
| 16 | WhatsApp Share | Payment Due Reminders | Formatted payment reminder message for single or batch outstanding invoices | Single invoice or array of overdue invoices | `https://wa.me/{phone}?text=...` URI | Concatenates bulk messages with `\n\n---\n\n` dividers | `src/pages/RemindersPage.tsx:25-47`, `src/pages/PartyLedger.tsx:122` |
| 17 | WhatsApp Share | CA Monthly Report Share | Formatted monthly financial summary for Chartered Accountants | Aggregated monthly sales, purchases, expenses, outstanding | `https://wa.me/?text=...` URI | Calculates date boundaries dynamically | `src/utils/ExportBar.tsx:34-73` |
| 18 | WhatsApp Share | Estimate Share | Formatted quote / estimate summary | Estimate Invoice object | `https://wa.me/?text=...` URI | URL encoded text | `src/pages/EstimatesPage.tsx:84-87` |
| 19 | WhatsApp Share | Product Catalog Share | Formatted product catalog message with items and prices | Items list | Web Share API `navigator.share()` with fallback to `wa.me` | Falls back to `wa.me` if `navigator.share` fails or is unsupported | `src/pages/OnlineStore.tsx:20-27` |
| 20 | Image/PDF Export | High-Res PNG Share | Captures invoice DOM node using `html2canvas` at 2x scale and shares via Web Share API or download | DOM `#invoice-preview` element | PNG Blob / File | Catches canvas errors and logs to console; revokes URL after 30s | `src/pages/InvoicesPage.tsx:121-140` |
| 21 | Spreadsheet Export | Excel XLSX Export | Generates multi-sheet styled XLSX spreadsheets with header fills and currency formatting | Sheet configs, headers, 2D row arrays, column widths | Downloadable `.xlsx` file | Auto-adjusts column widths and numeric formats | `src/utils/ExportBar.tsx:10-32`, `src/pages/DataExport.tsx:8-9` |

---

## Edge Cases

| # | Feature | Input / Condition | Observed Behavior |
|---|---------|-------------------|-------------------|
| 1 | Browser Print Popup | Popup blocker enabled in browser (`window.open` returns `null`) | Directly calls `window.print()` in parent context; prints active page with `.no-print` elements hidden. |
| 2 | Thermal Bluetooth | Device lacks Web Bluetooth API (`'bluetooth' in navigator === false`) or user cancels device picker | Catches exception, logs warning, and gracefully executes `window.print()` as fallback. |
| 3 | Thermal Bluetooth Payload | Payload length > 512 bytes | Chunked into 512-byte slices (`chunkSize = 512`) to prevent Bluetooth buffer overflow on low-memory microcontrollers. |
| 4 | Thermal Receipt Truncation | Item name > 18 characters on 58mm printer | Truncates to 17 characters + `.` (`item.itemName.slice(0, 17) + '.'`) to preserve 32-column alignment. |
| 5 | WhatsApp Phone Number | 10-digit Indian mobile number vs formatted phone `+91 98765-43210` | Non-digit characters stripped (`phone.replace(/[^0-9]/g, '')`); prepends `91` if exactly 10 digits; falls back to unaddressed `https://wa.me/?text=...` if no phone. |
| 6 | Bulk WhatsApp Reminders | Multiple overdue invoices selected | Combines messages separated by `\n\n---\n\n` and opens single WhatsApp compose URL with full multi-invoice text. |
| 7 | Print Media Styles | Colors/backgrounds on invoice preview | Explicit `-webkit-print-color-adjust: exact; print-color-adjust: exact;` forces browsers to render borders, header background fills, and badges without stripping colors. |
| 8 | HTML2Canvas Image Render | Cross-origin images (e.g. external QR code or logo) | `useCORS: true` and `scale: 2` configured to prevent canvas tainting and produce sharp high-DPI output. |
| 9 | Dotted Template Overflow | Long item names or wide tables in `DOTTED` template | Monospace font with fixed padding and `box-sizing: border-box` inside `#invoice-preview` prevents horizontal page clipping within `@page { margin: 10mm; }`. |

---

## 1. Observation

### 1.1 Print & Export Code Artifacts
- **`src/pages/InvoiceView.tsx`**:
  - Contains invoice viewer and template switcher supporting 13 templates (`STANDARD`, `COMPACT`, `DETAILED`, `CLASSIC`, `MODERN`, `PREMIUM`, `ELEGANT`, `BOLD`, `NATURE`, `OCEAN`, `SUNSET`, `CORPORATE`, `DOTTED`).
  - Implements `printInvoice()` (lines 47–57), `shareAsPdf()` (lines 59–70), `shareWhatsApp()` (lines 72–77), and Bluetooth thermal print trigger (line 83).
  - Print stylesheet (lines 153–160) specifies `@media print` with `.no-print { display: none !important; }`, `body { background: white; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`, `#invoice-preview { box-shadow: none; border-radius: 0; padding: 15px; max-width: 100%; }`, `@page { margin: 10mm; }`.
- **`src/utils/thermalPrinter.ts`**:
  - Implements `EscPosEncoder` class (lines 9–72) generating binary ESC/POS byte sequences: `ESC @` (0x1B, 0x40), `ESC a n` (align), `ESC E n` (bold), `GS ! n` (double size), `ESC d n` (feed), `GS V 66 0` (cut).
  - Implements `printThermalInvoice(inv: Invoice, widthMm: 58 | 80 = 58)` (lines 74–162).
  - Configures standard Bluetooth UUIDs: Service `000018f0-0000-1000-8000-00805f9b34fb`, Characteristic `00002af1-0000-1000-8000-00805f9b34fb`.
  - Transmits in 512-byte chunks; falls back to `window.print()` if Bluetooth connection fails.
- **`src/pages/PosBilling.tsx`**:
  - Imports `printThermalInvoice` and includes toggle `autoPrintThermal` (lines 38, 212–220, 403–410).
- **`src/pages/InvoicesPage.tsx`**:
  - Uses `html2canvas` (lines 121–140) to render `#invoice-preview` at 2x scale, exporting PNG via `navigator.share()` or blob URL.
- **`src/utils/ExportBar.tsx`**:
  - Provides `openPrintableReport` (lines 75–128) creating printable report documents with `@page { margin: 15mm 10mm; size: A4 portrait; }`.
  - Provides `downloadXLSX` (lines 10–32) using SheetJS for structured spreadsheet downloads.
  - Provides `shareOnWhatsApp` / `generateMonthlySummary` (lines 34–73) for monthly financial reports.
- **`src/pages/BarcodePrint.tsx`**:
  - Configures print layout (lines 93–111) for thermal/sticker barcode label sheets with `@page { margin: 5mm; size: auto; }`.
- **`src/pages/PartyLedger.tsx`**:
  - Implements `printStatement` (lines 70–107) with dedicated ledger `PRINT_STYLE` (lines 9–23).
- **`src/pages/OrdersPage.tsx`**, **`src/pages/RemindersPage.tsx`**, **`src/pages/CollectionsPage.tsx`**, **`src/pages/Billing.tsx`**, **`src/pages/EstimatesPage.tsx`**:
  - WhatsApp share text builders formatting line items, currency, balances, and receipt text with clean phone normalization.

### 1.2 Identified Syntax / Build Anomalies
- Running `npx tsc -b` revealed syntax errors in `src/pages/InvoiceView.tsx` around lines 104–106 (`<option value= <option value="NATURE">...`) and line 132 (`}profile={profile} />}`). These must be resolved during the implementation phase to achieve clean TypeScript compilation.

---

## 2. Logic Chain

### 2.1 Specification for `@media print` and Dotted Template Browser Rendering
1. **Container Dimensions**: `#invoice-preview` has `max-width: 800px` for desktop screen viewing and resets to `max-width: 100%`, `box-shadow: none`, `border-radius: 0`, and `padding: 15px` under `@media print`.
2. **Page Boundaries**: `@page { margin: 10mm; }` provides 10mm printable margins on standard A4 (210mm x 297mm) and US Letter paper, leaving ~190mm printable width.
3. **Monochrome Dotted Aesthetic**:
   - Monospace font: `'Courier New', Courier, 'Lucida Console', Monaco, monospace, sans-serif`.
   - Borders:
     - Outer frame: `2px dashed #222`
     - Major headers & dividers: `1.5px dashed #333`
     - Table rows: `1px dotted #888`
     - Tear cut simulator: `1.5px dashed #999` with centered `✂ - - - - - - - - - - - - - ✂`
     - Terms & signatory: `1px dotted #888` / `1.5px dashed #333`
   - High Contrast: Pure black/charcoal text (`#111111`) on pure white background (`#ffffff`) ensures ink-saving efficiency and sharp dot-matrix legibility.
4. **Color Adjustments**: `-webkit-print-color-adjust: exact; print-color-adjust: exact;` ensures dashed borders and background badges do not get stripped by print drivers.

### 2.2 Specification for ESC/POS Thermal Printing (58mm & 80mm)
1. **Column Geometry**:
   - `58mm` paper: 32 columns standard (Font A, 12x24 dots per char on 384 dot head).
   - `80mm` paper: 48 columns standard (Font A on 576 dot head).
2. **Line Item Tabular Structure**:
   - Header: `"ITEM                 QTY   AMT"` (32 chars total for 58mm).
   - Item name: Left-aligned, max 18 chars (truncated with `.` if longer, e.g. `Fresh Cow Milk 1L.`).
   - Qty: Right-aligned 5 chars (e.g. `  2kg` or ` 10pc`).
   - Amount: Right-aligned 7 chars (e.g. ` ₹120.00` or ` ₹1500`).
   - For 80mm (48 chars): Item 26 chars, Qty 8 chars, Rate 6 chars, Amount 8 chars.
3. **Divider Encoding**:
   - `divider(cols)` outputs `'-'.repeat(cols)` or `'. '.repeat(cols/2)` followed by LF (`0x0A`).
4. **Paper Handling**:
   - Feed 3 lines (`ESC d 3`) to clear thermal printhead tear bar.
   - Partial cut (`GS V 66 0` / `0x1D, 0x56, 0x42, 0x00`).

### 2.3 Specification for WhatsApp Message Generation
1. **Message Structure**:
   - Header: Emoji + bold title (e.g. `📄 *Invoice: INV-1001*`).
   - Meta: Date `📅 19/08/2026`, Customer `👤 Party Name`.
   - Item list: Bullet list `• Item Name xQty Unit = ₹Amount`.
   - Divider / Summary: `💰 *Total: ₹GrandTotal*`.
   - Footer: Default terms & conditions or thank-you note.
2. **Phone Number Sanitization**:
   - Regex `phone.replace(/[^0-9]/g, '')`.
   - If 10 digits, prepend India country code `91`.
   - Encode message URI using `encodeURIComponent(msg)`.
   - Dispatch via `https://wa.me/${phone}?text=${encodedMsg}`.

### 2.4 Specification for PDF Export Channels
1. **Browser Print to PDF**: Handled via `window.open` + `window.print()` allowing native OS PDF rendering.
2. **Canvas/Image Share**: Handled via `html2canvas` with 2x resolution scale, generating a PNG blob that integrates with Web Share API (`navigator.share({ files: [...] })`).

---

## 3. Caveats

1. **Web Bluetooth API Availability**: Web Bluetooth is supported on Chromium-based browsers (Chrome on Android/Desktop, Edge) but is unavailable on iOS Safari. The codebase handles this by catching exceptions and falling back to `window.print()`.
2. **Popup Blocker Interception**: Modern mobile browsers may block `window.open('', '_blank')` if triggered outside immediate user touch events. The fallback in `InvoiceView.tsx` (`if (!printWindow) window.print()`) mitigates this.
3. **Non-ASCII Characters in ESC/POS**: UTF-8 bytes sent directly to legacy ESC/POS printers may print unexpected characters for Unicode symbols like `₹`. ASCII formatting or code page 437/hex fallback should be used where necessary.
4. **Current Compile Errors in InvoiceView.tsx**: The syntax corruption in `src/pages/InvoiceView.tsx` lines 104-106 and 132 must be cleaned up to ensure `tsc -b` and `npm run build` pass cleanly.

---

## 4. Conclusion

All print and export mechanisms across the VyaparSetu PWA codebase have been fully surveyed and cataloged:
1. **Browser Print / PDF**: Standardized on `@media print` with `.no-print` suppression, `@page { margin: 10mm; }`, and color preservation.
2. **Thermal ESC/POS**: Managed via `EscPosEncoder` and Web Bluetooth GATT characteristic chunking (512 bytes) with 32-col (58mm) and 48-col (80mm) widths.
3. **WhatsApp Sharing**: Managed through sanitized `wa.me` links with emoji headers, bullet lists, markdown bold formatting, and dashed separators.
4. **PDF / Image Generation**: Dual-track implementation using native print-to-PDF and `html2canvas` image export.
5. **Dotted Template Integration**: The `DOTTED` template has been mapped into the `InvoiceTemplate` type, `InvoiceThemeGallery`, format dropdown, and rendering engine with complete specifications for dotted/dashed borders, monospace dot-matrix receipt styling, and thermal print fidelity.

---

## 5. Verification Method

To independently verify these findings:
1. Inspect `src/utils/thermalPrinter.ts` for ESC/POS byte sequence generation, 58mm/80mm column math, and Web Bluetooth GATT chunking.
2. Inspect `src/pages/InvoiceView.tsx` for `printInvoice()`, `shareAsPdf()`, `shareWhatsApp()`, template selector, and print styles.
3. Inspect `src/pages/InvoiceThemeGallery.tsx` for `DOTTED` theme definition.
4. Inspect `src/pages/InvoicesPage.tsx` lines 121–140 for `html2canvas` export.
5. Inspect `src/utils/ExportBar.tsx` for `openPrintableReport` and `downloadXLSX`.
6. Run `npx tsc -b` and `npm run build` from `/home/aathu/VyaparSetu-PWA/pwa` to verify build targets and identify any pending syntax fixes.
