# Original User Request

## Initial Request — 2026-08-19T15:28:16Z

Implement a professional Dotted / Dot-Matrix invoice format and conduct comprehensive end-to-end quality validation across the VyaparSetu PWA codebase.

Working directory: /home/aathu/VyaparSetu-PWA/pwa
Integrity mode: development

## Requirements

### R1. Dotted / Dot-Matrix Invoice Template
Implement a complete Dotted invoice theme (`DOTTED`) selectable in the invoice format selector and theme gallery. The template must feature:
- Clean dotted and dashed borders (`border: 1.5px dashed #000`, `border-top: 1px dotted #666`) separating headers, line item rows, tax breakdowns, and payment summaries.
- A distinctive dot-matrix / thermal-receipt visual style with high readability and printable monochrome contrast.
- Visual receipt divider lines and signature/terms sections styled with dashed perimeter frames.

### R2. Print, PDF, WhatsApp & Thermal Compatibility
Ensure the `DOTTED` template renders consistently across all distribution channels:
- Standard Browser Print / Save as PDF (`@media print` rules without clipping or overflowing margins).
- ESC/POS Thermal Bluetooth print generation (`58mm` and `80mm` widths).
- WhatsApp summary message generation.

### R3. Quality Assurance & Regression Verification
Verify full application stability:
- Clean TypeScript compilation with zero errors (`npx tsc -b`).
- Production Vite build completion (`npm run build`).
- Verify backward compatibility with existing invoice records in local and cloud storage.

## Acceptance Criteria

### Invoice Template Functionality
- [ ] `DOTTED` template is available in `InvoiceTemplate` type and invoice format dropdown.
- [ ] Selecting `DOTTED` renders the invoice preview with clear dotted/dashed structural borders and aligned tabular data.
- [ ] Thermal Bluetooth and browser print previews render the dotted invoice cleanly without formatting corruption.

### Code Integrity & Build
- [ ] `npx tsc -b` passes with 0 type errors.
- [ ] `npm run build` succeeds without build warnings or bundle breakage.
