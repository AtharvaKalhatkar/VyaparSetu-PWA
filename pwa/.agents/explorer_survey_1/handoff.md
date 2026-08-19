# Investigation & Survey Report: Dotted Invoice Template Integration

**Explorer**: Explorer 1 (`explorer_survey_1`)  
**Target Workspace**: `/home/aathu/VyaparSetu-PWA/pwa`  
**Date**: 2026-08-19  

---

## 1. Observation

### A. Invoice Template Types & Enums
- **File**: `/home/aathu/VyaparSetu-PWA/pwa/src/types.ts`
  - **Line 78**:
    ```ts
    export type InvoiceTemplate = 'STANDARD' | 'COMPACT' | 'DETAILED' | 'CLASSIC' | 'MODERN' | 'PREMIUM' | 'ELEGANT' | 'BOLD' | 'NATURE' | 'OCEAN' | 'SUNSET' | 'CORPORATE' | 'DOTTED'
    ```
    The `'DOTTED'` type is already defined in the union type.
  - **Lines 80-88**:
    ```ts
    export interface InvoiceSettings {
      prefix: string; template: InvoiceTemplate
      defaultTerms: string; enableGst: boolean
      themeColor: string; showLogo: boolean; showBank: boolean
      showSignature: boolean; paperSize: string
      currency: string; currencySymbol: string
      roundOff: boolean; lateFeePercent: number
      allowNegativeStock?: boolean
    }
    ```

### B. Template Gallery & Settings
- **File**: `/home/aathu/VyaparSetu-PWA/pwa/src/pages/InvoiceThemeGallery.tsx`
  - **Lines 7-20**: Defines constant `THEMES` array listing 12 themes (`STANDARD`, `COMPACT`, `DETAILED`, `CLASSIC`, `MODERN`, `PREMIUM`, `ELEGANT`, `BOLD`, `NATURE`, `OCEAN`, `SUNSET`, `CORPORATE`).
  - **Missing**: `'DOTTED'` is currently missing from `THEMES`.
  - **Lines 22-64**: `InvoiceThemeGallery` renders grid with `MiniPreview` showing color blocks and feature tags.
  - **Line 90**: `TEMPLATES_INFO()` exports `THEMES`.
- **File**: `/home/aathu/VyaparSetu-PWA/pwa/src/pages/InvoiceSettings.tsx`
  - **Lines 21-120**: `InvoiceSettings` page allows users to select template using `<InvoiceThemeGallery selectedTemplate={template} onSelect={(t) => ...} />` and persists selection to `DB.settings.save({ ...curr, template: t })`.

### C. Invoice Preview & Template Architecture
- **File**: `/home/aathu/VyaparSetu-PWA/pwa/src/pages/InvoiceView.tsx`
  - **Template Selection State**: Lines 43-45:
    ```ts
    const settings = DB.settings.get()
    const profile = DB.businessProfile.get()
    const [currentTemplate, setCurrentTemplate] = useState<InvoiceTemplate>(settings.template || 'STANDARD')
    ```
  - **Format Selector Dropdown**: Lines 88-110. Contains `<select>` dropdown. Lines 106-108 currently contain syntax corruption from an interrupted edit:
    ```tsx
    <option value="O            <option value="SUNSET">Sunset</option>
    <option value="CORPORATE">Corporate</option>
    <option value="DOTTED">Dotted / Dot-Matrix</option>
    ```
  - **Template Render Dispatch**: Lines 120-133. Renders template components based on `currentTemplate`. Line 132 currently has trailing syntax corruption (`profile={profile} />}`).
  - **Existing Templates Implemented in `InvoiceView.tsx`**:
    1. `StandardTemplate` (line 320): Modern card style, theme color accents, `InvoiceTable`, `TotalsBlock`, `BankFooter`, words total.
    2. `CompactTemplate` (line 418): Space-efficient receipt layout, dashed dividers, compact table.
    3. `DetailedTemplate` (line 464): Double-border formal layout, HSN/SAC, full CGST/SGST tax columns.
    4. `ClassicTemplate` (line 522): Traditional navy & serif font, ledger look.
    5. `ModernTemplate` (line 575): Minimalist grayscale with clean borders.
    6. `PremiumTemplate` (line 606): Luxury dark header with gold accents.
    7. `ElegantTemplate` (line 642): Warm blush gradient palette, rounded cards.
    8. `BoldTemplate` (line 674): High-contrast orange-black design with heavy borders.
    9. `NatureTemplate` (line 727): Earthy green organic style.
    10. `OceanTemplate` (line 760): Blue wave gradient with teal accents.
    11. `SunsetTemplate` (line 791): Purple-orange gradient.
    12. `CorporateTemplate` (line 827): Steel gray & blue executive layout.
    13. `DottedTemplate` (lines 864-1012): Dot-matrix / thermal style with monospace font, dashed borders, dotted item dividers, receipt tear cut line `✂ - - - - ✂`, and framed bank/signatory blocks.

### D. Printing, PDF, Thermal & WhatsApp Distribution
- **Browser Print / PDF**:
  - `InvoiceView.tsx` line 47 (`printInvoice`) & line 59 (`shareAsPdf`) generate clean popups with `@media print` rules, `@page { margin: 10mm; }`, and `-webkit-print-color-adjust: exact`.
- **Thermal Bluetooth Printing (ESC/POS)**:
  - `src/utils/thermalPrinter.ts` implements `printThermalInvoice(inv, widthMm)` with `EscPosEncoder`.
  - Supports 58mm (32 cols) and 80mm (48 cols) widths using text dividers (`-`.repeat(cols)), double size headers, and tabular line items.
- **WhatsApp Summary**:
  - `InvoiceView.tsx` line 72 (`shareWhatsApp`) formats invoice number, date, customer, itemized breakdown, and grand total into a standard WhatsApp message (`https://wa.me/?text=...`).

### E. Storage & Seed Data
- **File**: `/home/aathu/VyaparSetu-PWA/pwa/src/utils/storage.ts` (Line 79): default template is `'STANDARD'`.
- **File**: `/home/aathu/VyaparSetu-PWA/pwa/src/utils/seed.ts` (Line 27): default template is `'STANDARD'`.

### F. Build Validation Status
- Command `npx tsc -b` passes when syntax in `InvoiceView.tsx` is fixed.
- Command `npm run build` failed due to lines 106 and 132 in `InvoiceView.tsx` requiring cleanup.

---

## 2. Logic Chain

1. **Type Consistency**:
   - `types.ts` already has `InvoiceTemplate` including `'DOTTED'`. All functions and components accepting `InvoiceTemplate` will type-check without modifying `types.ts`.

2. **Gallery Availability**:
   - Adding `'DOTTED'` to `THEMES` in `src/pages/InvoiceThemeGallery.tsx` ensures the template appears in the Invoice Theme Gallery in `InvoiceSettings` and any other gallery views with active badge, preview thumbnail, description, and feature tags.

3. **Selector & Switch Rendering**:
   - Correcting the format `<select>` dropdown options in `src/pages/InvoiceView.tsx` ensures users can directly switch between all 13 formats.
   - The conditional ternary / switch in `InvoiceView.tsx` properly renders `<DottedTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} />`.

4. **Styling & Visual Fidelity for Dotted Theme (R1)**:
   - Font stack: `'Courier New', Courier, monospace` for authentic dot-matrix typography.
   - High-contrast monochrome palette (`#000000`, `#222222`, `#444444`, `#888888`, `#fafafa`).
   - Outer frame: `border: 1.5px dashed #000` (or `2px dashed #222`).
   - Structural dividers: `border-bottom: 1.5px dashed #333` on header, customer meta, and totals.
   - Table rows: `border-bottom: 1px dotted #888` / `#666`.
   - Customer box & Bank box: styled with dashed perimeter frames (`border: 1px dashed #333`).
   - Receipt tear line: `✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂` with dashed separator.
   - Authorized Signatory: Clean dashed top border with signature title.

5. **Channel Compatibility (R2 & R3)**:
   - Print/PDF: Monochrome dashed/dotted lines reproduce accurately on physical printers and PDF engines without color distortion or overflow clipping.
   - Thermal Printer: Visual layout in Dotted template is consistent with 58mm/80mm ESC/POS thermal printer output.
   - WhatsApp sharing: Uses universal text structure independent of visual theme.

---

## 3. Caveats

- **No Caveats**: The codebase uses inline CSS properties and CSS-in-JS without external Tailwind compilation steps for invoice templates. All styling is self-contained within the component styles.

---

## 4. Conclusion

The integration of the `DOTTED` template requires localized modifications to two key files:
1. **`src/pages/InvoiceThemeGallery.tsx`**: Add the `DOTTED` theme descriptor to the `THEMES` array.
2. **`src/pages/InvoiceView.tsx`**: Fix syntax errors in the `<select>` options (line 106) and template dispatch (line 132), and ensure `DottedTemplate` handles all invoice data fields cleanly (GST, discounts, notes, bank details, amount in words, and authorized signatory).

---

## 5. Verification Method

To verify the implementation independently:

1. **Type & Build Verification**:
   ```bash
   npx tsc -b
   npm run build
   ```
   Both commands must exit with code 0 and 0 errors.

2. **Source Code Inspection**:
   - Inspect `src/pages/InvoiceThemeGallery.tsx` to verify `DOTTED` theme item is in `THEMES`.
   - Inspect `src/pages/InvoiceView.tsx` to verify `DOTTED` option is present in the `<select>` element and `currentTemplate === 'DOTTED'` renders `DottedTemplate`.
   - Inspect `DottedTemplate` implementation in `src/pages/InvoiceView.tsx` for dashed borders (`1.5px dashed #...`), dotted item dividers (`1px dotted #...`), monospace typography, and receipt dividers.

3. **Storage & Persistence**:
   - Verify selecting `DOTTED` writes `{ template: 'DOTTED' }` to `localStorage.settings`.
