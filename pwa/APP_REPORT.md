# Vyapar Setu PWA — Complete Architecture Report

## 1. PROJECT STRUCTURE

```
pwa/src/
├── App.tsx                    (119 lines)   — State-based router (no React Router)
├── main.tsx                   (7 lines)     — Entry point
├── theme.ts                   (42 lines)    — Colors, Spacing, BorderRadius, Shadows
├── types.ts                   (105 lines)   — All TypeScript interfaces
│
├── pages/ (35 pages, ~3,700 lines)
│   ├── Login.tsx              — Onboarding (name + business)
│   ├── Dashboard.tsx          — KPI cards, 7-day chart, quick actions, due payments
│   ├── Ledger.tsx             — All party balances
│   ├── Billing.tsx            — Invoice creation, barcode scan, multi-unit, +/- qty
│   ├── Inventory.tsx          — Stock items with color-coded alerts
│   ├── Reports.tsx            — Summary cards
│   ├── InvoicesPage.tsx       — List with Pay/View/Remind/Delete
│   ├── Customers.tsx          — Customer list
│   ├── Suppliers.tsx          — Supplier list
│   ├── Expenses.tsx           — Expense CRUD + category filter
│   ├── EmployeesPage.tsx      — Employee CRUD
│   ├── Crm.tsx                — Lead pipeline management
│   ├── AddParty.tsx           — Party form (Customer/Supplier/Both)
│   ├── AddPayment.tsx         — Payment against invoice with mode chips
│   ├── AddEntry.tsx           — Quick income/expense entry
│   ├── AddItem.tsx            — 5-step item wizard (multi-unit, batch, etc.)
│   ├── Settings.tsx           — Profile + logout
│   ├── PartyLedger.tsx        — Single party ledger
│   ├── UnitsPage.tsx          — Measurement units CRUD
│   ├── InvoiceSettings.tsx    — Prefix, template, color, GST/bank toggles
│   ├── InvoiceThemeGallery.tsx — 6 template previews
│   ├── InvoiceView.tsx        — Print, share, 6 template styles
│   ├── StockAdjustment.tsx    — Add/remove stock with reason
│   ├── BusinessProfile.tsx    — Business info, GST, bank details
│   ├── SmartPurchase.tsx      — OCR bill scanning via Tesseract.js
│   ├── OrdersPage.tsx         — Sale/Purchase orders with Convert to Invoice
│   ├── EstimatesPage.tsx      — Estimates with Convert/Share/Valid-Until
│   ├── ReturnsPage.tsx        — Sale/Purchase returns with stock reversal
│   ├── ChallanPage.tsx        — Load Sheet from invoices, vehicle/driver, print
│   ├── DayBook.tsx            — Daily transaction summary
│   ├── ProfitLoss.tsx         — P&L with quick date ranges
│   ├── GstReports.tsx         — GSTR-1 item-level + GSTR-3B summary
│   ├── BankAccounts.tsx       — Bank/Cash/Wallet accounts + transactions
│   └── DataExport.tsx         — CSV/JSON export, JSON import, clear all data
│
├── store/
│   └── auth.ts                — useAuth() hook (login/logout/persist)
│
└── utils/
    ├── formatting.ts          — formatCurrency, formatDate, generateId, todayISO, greeting
    ├── Icons.tsx              — 35 inline SVG icon components (no dependency)
    ├── seed.ts                — Demo data (5 parties, 5 items, 3 invoices, etc.)
    ├── storage.ts             — Generic localStorage CRUD wrapper (DB object)
    └── styles.tsx             — Reusable CSS-in-JS presets, Field, StepIndicator, etc.
```

**Total: 41 source files, ~3,780 lines of TypeScript/TSX.**

---

## 2. DATA TYPES (types.ts)

### DocType

```ts
"SALE" |
  "PURCHASE" |
  "SALE_ORDER" |
  "PURCHASE_ORDER" |
  "ESTIMATE" |
  "SALE_RETURN" |
  "PURCHASE_RETURN" |
  "CHALLAN" |
  "PAYMENT_IN" |
  "PAYMENT_OUT";
```

### Party

`id`, `name`, `phone`, `email?`, `gstin?`, `type` (CUSTOMER|SUPPLIER|BOTH), `openingBalance`, `balanceType` (DEBIT|CREDIT), `creditLimit`, `creditDays`, `group?`, `shippingAddress?`, `isActive`, `createdAt`

### ItemUnit

`unitId`, `unitName`, `conversionRate`, `sellingPrice`, `purchasePrice`

### Item

`id`, `name`, `sku`, `barcode?`, `hsnCode?`, `category?`, `unit`, `sellingPrice`, `purchasePrice`, `gstRate`, `mrp?`, `currentStock`, `minStockLevel`, `isActive`, `units?` (ItemUnit[]), `brand?`, `description?`, `warehouse?`, `rackLocation?`, `batchNo?`, `mfgDate?`, `expDate?`

### InvoiceItem

`itemId`, `itemName`, `sku`, `quantity`, `rate`, `unit`, `discountPercent`, `discountAmount`, `gstRate`, `amount`

### Invoice

`id`, `docType`, `invoiceNo`, `partyId`, `partyName`, `type` (SALE|PURCHASE), `items` (InvoiceItem[]), `subtotal`, `discountAmount`, `taxAmount`, `grandTotal`, `paymentStatus` (PENDING|PARTIAL|PAID|OVERDUE|DRAFT), `paidAmount`, `dueAmount`, `date`, `dueDate?`, `notes?`, `orderStatus?` (OPEN|CONFIRMED|CONVERTED|CANCELLED), `convertedTo?`, `shippingAddress?`, `transportDetails?`, `additionalCharges?`, `roundOff?`

### LedgerEntry

`id`, `partyId`, `partyName`, `type` (SALE|RECEIPT|PAYMENT), `amount`, `mode`, `reference`, `description`, `date`, `runningBalance`

### Expense

`id`, `category`, `amount`, `description`, `date`, `paymentMode`

### Employee

`id`, `name`, `phone`, `email?`, `role`, `salary`, `joiningDate`, `isActive`

### Unit

`id`, `name`, `shortName`, `isActive`

### InvoiceTemplate

`'STANDARD' | 'COMPACT' | 'DETAILED' | 'CLASSIC' | 'MODERN' | 'PREMIUM'`

### InvoiceSettings

`prefix`, `template`, `defaultTerms`, `enableGst`, `themeColor`, `showLogo`, `showBank`, `showSignature`, `paperSize`

### CrmLead

`id`, `name`, `phone`, `email?`, `source`, `status` (NEW|CONTACTED|QUALIFIED|NEGOTIATION|WON|LOST), `estimatedValue`, `notes?`, `createdAt`

### BusinessProfile

`businessName`, `ownerName`, `phone`, `email`, `address`, `gstin`, `pan`, `bankName`, `bankAccount`, `bankIfsc`, `signature`

### StockAdjustment

`id`, `itemId`, `itemName`, `type` (ADD|REMOVE), `quantity`, `reason`, `date`, `notes?`

### BankAccount

`id`, `name`, `type` (BANK|CASH|WALLET), `accountNo?`, `ifsc?`, `holderName?`, `balance`, `isDefault`, `isActive`

### BankTransaction

`id`, `accountId`, `type` (DEPOSIT|WITHDRAWAL|TRANSFER), `amount`, `description`, `date`, `reference?`, `category?`, `balance`

**16 types total (12 interfaces, 4 type aliases)**

---

## 3. ALL PAGES — Features & Key Interactions

### Login.tsx (56 lines)

- Name + business name → persists to localStorage via auth.ts
- No real authentication, local-only

### Dashboard.tsx (157 lines)

- 4 KPI cards: Today's Sales, Outstanding, Due Invoices, Low Stock
- 6 Quick Actions: New Invoice, Record Payment, Add Party, Add Item, Invoices, Load Sheet
- 7-day bar chart (sales trend)
- Due payments section (oldest unpaid sorted first)
- Recent invoices (last 5)
- All data from DB.invoices/DB.parties/DB.items, onNavigate for navigation

### Ledger.tsx (64 lines)

- All parties with non-zero balance
- Search by name or phone
- Shows "To Receive" (debit) or "To Pay" (credit) — click opens PartyLedger

### Billing.tsx (192 lines)

- Sale/Purchase toggle
- Party selector, date picker
- "Add Product" button opens a searchable picker (name/SKU/barcode)
- Each line: qty +/- buttons, unit dropdown (if multi-unit), rate, line total
- Auto-calculated subtotal, 12% GST, grand total
- Barcode scanning (camera + manual input)
- Saves invoice + ledger entry, reduces stock using conversion rate for multi-unit

### Inventory.tsx (55 lines)

- Search, color-coded stock level (red/amber/green)
- FAB to add item → navigates to add-item

### InvoicesPage.tsx (60 lines)

- Search by invoice no or party name
- Sort by date descending
- Each card: status badge, "Pay" button, "View" button, WhatsApp reminder, delete
- FAB → billing

### Customers.tsx (50 lines) | Suppliers.tsx (48 lines)

- Search, list, FAB → add-party with edit

### Expenses.tsx (82 lines)

- Total display, category filter chips (Office/Travel/Utilities/Salary/Marketing/Rent/Other)
- Inline add/edit form, delete with confirm

### EmployeesPage.tsx (84 lines)

- Search, count, inline add/edit form, delete

### Crm.tsx (74 lines)

- Lead list, status badge, inline form, delete

### Reports.tsx (34 lines)

- Card summary: Sales, Purchases, Expenses, Outstanding, Low Stock, Invoices count

### AddParty.tsx (57 lines)

- Customer/Supplier/Both toggle
- Name, phone, email, GSTIN, opening balance
- Delete (if editing), success animation

### AddPayment.tsx (71 lines)

- Select unpaid SALE invoice → shows summary (total, paid, due)
- Amount input with real-time excess warning
- Payment mode chips: CASH/UPI/BANK/CHEQUE/CARD
- Updates invoice paidAmount/dueAmount/status, creates ledger RECEIPT entry

### AddEntry.tsx (48 lines)

- Income/Expense toggle, category chips, amount + description → saves to expenses

### AddItem.tsx (263 lines) — 5-step wizard

- Step 1: Product/Service toggle, name, SKU, category, brand, description, image placeholder
- Step 2: Unit selector, purchase/selling price, MRP, discount %, tax included, **multi-unit definitions** (name / conversion / SP / PP per unit)
- Step 3: Opening/current stock, min stock alert, warehouse, rack, barcode
- Step 4: GST rate (0/5/12/18/28), HSN, supplier, batch no, mfg/exp dates, notes
- Step 5: Review with editable sections → save

### Settings.tsx (42 lines)

- Profile card, Business Profile link, My Account, Notifications, Theme, About, Logout

### PartyLedger.tsx (51 lines)

- Party info + WhatsApp reminder button
- Chronological ledger entries with description/amount/mode

### UnitsPage.tsx (79 lines)

- List with name + shortName, inline add/edit, delete

### InvoiceSettings.tsx (67 lines)

- Prefix, template (opens InvoiceThemeGallery), theme color, default terms, GST/bank/signature toggles

### InvoiceThemeGallery.tsx (84 lines)

- 6 themes with mini preview, features, color dots, active indicator

### InvoiceView.tsx (~393 lines)

- Renders invoice in 1 of 6 templates (STANDARD / COMPACT / DETAILED / CLASSIC / MODERN / PREMIUM)
- Print with @media print CSS, WhatsApp share with formatted message

### StockAdjustment.tsx (86 lines)

- Item selector with current stock, ADD/REMOVE toggle, qty, date, reason
- History list with delete (reverses stock change)

### BusinessProfile.tsx (53 lines)

- Sections: Business Details, Tax Info (GSTIN/PAN), Bank Details (name/account/IFSC)
- Save → onBack

### SmartPurchase.tsx (201 lines)

- Upload/take photo → Tesseract.js OCR → parse items (name/qty/rate/amount)
- Edit parsed items, add manual items, supplier select, purchase date
- Saves purchase invoice + increases stock

### OrdersPage.tsx (164 lines)

- Tab: Sale Orders / Purchase Orders
- Search, status badges (OPEN/CONFIRMED/CONVERTED/CANCELLED)
- Inline create form with party/date/items/notes
- "Convert to Invoice" → creates SALE invoice, marks order CONVERTED

### EstimatesPage.tsx (157 lines)

- Search + list with status (DRAFT/SENT/ACCEPTED/CONVERTED)
- Create form with valid-until date
- Convert to Sale, WhatsApp share, View, Delete

### ReturnsPage.tsx (147 lines)

- Tab: Sale Returns / Purchase Returns (SRET-/PRET-)
- Create with party/date/items/reason, saves return invoice, reverses stock

### ChallanPage.tsx (196 lines) — Load Sheet

- **Pick**: Select date → shows SALE invoices → checkboxes to select, vehicle no, driver name, notes
- **Create**: Merge items from selected invoices, editable qty with +/- steppers, remove items
- **Save**: Creates CHALLAN doc
- **Print**: Formatted load sheet with #, Item, Qty, Delivered (blank column), driver + shopkeeper signature lines
- **Mark Delivered**: Sets orderStatus = CONVERTED

### DayBook.tsx (115 lines)

- Date picker, sections: Sales/Purchases/Expenses/Payments, summary (income/expense/net), Export placeholder

### ProfitLoss.tsx (125 lines)

- Quick date range chips (This Month/Last Month/This Quarter/This Year) + custom range
- Collapsible Income/Expenses sections with per-invoice drill-down
- Net profit/loss highlighted in green/red

### GstReports.tsx (113 lines)

- Month picker, tab: GSTR-1 / GSTR-3B
- GSTR-1: item-level table with HSN/Qty/Rate/Taxable/Tax, B2B vs B2C breakdown
- GSTR-3B: Sales/Purchases summary with IGST/CGST/SGST, Net Tax Payable

### BankAccounts.tsx (198 lines)

- Total balance summary, account cards with type badge + balance
- Default accounts: Cash in Hand (₹25K), SBI Current (₹1.5L)
- Click to expand → show transactions + "Add Transaction" button
- Add account form (BANK/CASH/WALLET), delete with confirm

### DataExport.tsx (233 lines)

- CSV export: Invoices, Parties, Items
- JSON export: All data with file size estimate
- JSON import: file upload → preview counts per entity → restore button
- Clear All Data: 2-step confirmation, clears all vs\_\* localStorage keys

---

## 4. STORAGE SYSTEM (utils/storage.ts)

All localStorage under `vs_` prefix. Synchronous, no IndexedDB, no backend.

| Entity          | Key            | list() | save() | byId() | delete() | Special Methods            |
| --------------- | -------------- | ------ | ------ | ------ | -------- | -------------------------- |
| Party           | `parties`      | ✓      | ✓      | ✓      | ✓        |                            |
| Item            | `items`        | ✓      | ✓      | ✓      | ✓        |                            |
| Invoice         | `invoices`     | ✓      | ✓      | ✓      | ✓        |                            |
| LedgerEntry     | `ledger`       | ✓      | ✓      | ✗      | ✗        | `forParty(id)` filter+sort |
| Expense         | `expenses`     | ✓      | ✓      | ✓      | ✓        |                            |
| Employee        | `employees`    | ✓      | ✓      | ✓      | ✓        |                            |
| CrmLead         | `crm`          | ✓      | ✓      | ✓      | ✓        |                            |
| Unit            | `units`        | ✓      | ✓      | ✓      | ✓        |                            |
| InvoiceSettings | `settings`     | get()  | set()  | —      | —        | Single object              |
| BusinessProfile | `bizProfile`   | get()  | set()  | —      | —        | Single object              |
| StockAdjustment | `stockAdj`     | ✓      | ✓      | ✗      | ✓        |                            |
| BankAccount     | `bankAccounts` | ✓      | ✓      | ✓      | ✓        |                            |
| BankTransaction | `bankTxns`     | ✓      | ✓      | ✗      | ✗        | `forAccount(id)` filter    |

**Total: 13 entity blocks, all CRUD operations synchronous.**

---

## 5. UTILITIES

### formatting.ts — `formatCurrency`, `formatDate`, `formatPhone`, `generateId`, `todayISO`, `greeting`

### Icons.tsx — 35 inline SVG icons (zero dependencies)

### seed.ts — Runs once, seeds: 5 parties, 5 items, 3 invoices, 5 ledger entries, 3 expenses, 2 employees, 2 leads, 10 units, settings, profile, 2 barcode items, 2 stock adjustments

### styles.tsx — Reusable style presets:

- `s.card`, `s.row`, `s.spaceBetween`, `s.input`, `s.select`, `s.textarea`
- `s.primaryBtn`, `s.primaryBtnDisabled`, `s.outlineBtn`, `s.searchBox`
- `s.toggleGroup`, `s.toggle()`, `s.chip()`, `s.avatar()`, `s.badge()`
- `statusColor()` — maps status strings to colors
- Components: `Field`, `StepIndicator`, `SectionCard`, `SummaryRow`

### auth.ts — `useAuth()` hook: loggedIn, userName, businessName, login(), logout() — stored in localStorage

### theme.ts — 27 color tokens, 8 spacing tokens, 6 border-radius tokens, 3 shadow presets

---

## 6. ROUTING SYSTEM (App.tsx)

**Simple state-based routing** (no React Router):

- `page` state + `history` stack + `params` parsed from `?` query string
- `navigate(p)` → splits by `?`, parses params, pushes to history
- `goBack()` — pops from history
- **35 route entries** mapped to 35 page components via switch statement

**Tab pages** (no back button): dashboard, ledger, billing, inventory
**Misc pages**: 31 additional routes like orders, estimates, returns, challans, daybook, profitloss, gst-reports, bank-accounts, data-export, plus detail pages like invoice-view, add-party, add-item, add-payment, party-ledger

**Layout.tsx** — Header (with back arrow) + TabBar (5 bottom tabs) + MoreMenu (22 menu items)

---

## 7. COMPLETE FEATURE INVENTORY

### Core Transactions

- Sale Invoice with multi-unit pricing, barcode scan, qty steppers
- Purchase Invoice
- Sale Orders → Convert to Invoice
- Purchase Orders → Convert to Invoice
- Estimates/Quotations → Convert to Sale, WhatsApp share
- Sale Returns (stock reversal)
- Purchase Returns (stock reversal)
- Load Sheets from multiple invoices with vehicle/driver/print/signatures
- OCR-based purchase bill scanning (Tesseract.js)

### Financials

- Payment collection against invoices (mode, partial, excess warning)
- Expense tracking with categories
- Bank & Cash account management + transactions
- Day Book (daily summary)
- Profit & Loss (month/quarter/year/custom)
- GST Reports (GSTR-1 item-level, GSTR-3B summary with ITC)
- Party-wise Ledger with running balance

### Inventory

- 5-step item creation wizard
- Multi-unit pricing (e.g., Pcs + Box + Outer with conversion)
- Barcode/SKU/HSN tracking
- Batch & expiry tracking
- Warehouse & rack location
- Stock adjustments with reason
- Low stock alerts

### Parties

- Customer, Supplier, Both types
- GSTIN, credit limit, credit days, opening balance
- WhatsApp payment reminders

### CRM

- Lead pipeline: NEW → CONTACTED → QUALIFIED → NEGOTIATION → WON/LOST

### HR

- Employee CRUD with role, salary, joining date

### Documents & Printing

- 6 invoice templates (Standard, Compact, Detailed, Classic, Modern, Premium)
- Invoice print with @media print CSS
- Invoice WhatsApp sharing
- Load Sheet print with delivery/signature columns

### Settings & Data

- Business profile (GST, bank, address)
- Invoice settings (prefix, template, theme color, toggles)
- Units management
- Full backup/restore (JSON)
- CSV export (invoices, parties, items)
- Clear all data

### Architecture

- Zero backend, 100% local storage
- Offline-capable PWA
- Mobile-first responsive design
- No external UI library (all custom)
- No React Router (custom state-based routing)
- 35 inline SVG icons (zero icon dependency)
