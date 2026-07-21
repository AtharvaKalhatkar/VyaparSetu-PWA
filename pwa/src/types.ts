export type DocType = 'SALE' | 'PURCHASE' | 'SALE_ORDER' | 'PURCHASE_ORDER' | 'ESTIMATE' | 'SALE_RETURN' | 'PURCHASE_RETURN' | 'CHALLAN' | 'PAYMENT_IN' | 'PAYMENT_OUT'

export interface Party {
  id: string; name: string; phone: string; email?: string
  gstin?: string; type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH'
  openingBalance: number; balanceType: 'DEBIT' | 'CREDIT'
  creditLimit: number; creditDays: number; group?: string
  shippingAddress?: string; isActive: boolean; createdAt: string
}

export interface ItemUnit {
  unitId: string; unitName: string; conversionRate: number
  sellingPrice: number; purchasePrice: number
}

export interface Item {
  id: string; name: string; sku: string; barcode?: string
  hsnCode?: string; category?: string; unit: string
  sellingPrice: number; purchasePrice: number; gstRate: number; mrp?: number
  currentStock: number; minStockLevel: number; isActive: boolean
  units?: ItemUnit[]; brand?: string; description?: string
  warehouse?: string; rackLocation?: string
  batchNo?: string; mfgDate?: string; expDate?: string
  supplier?: string; notes?: string; discountPercent?: number
  priceLists?: { name: string; price: number }[]
  imageUrl?: string
  customFields?: CustomFieldValue[]
}

export interface InvoiceItem {
  itemId: string; itemName: string; sku: string
  quantity: number; rate: number; unit: string
  discountPercent: number; discountAmount: number
  gstRate: number; amount: number
}

export interface Invoice {
  id: string; docType: DocType
  invoiceNo: string; partyId: string; partyName: string
  type: 'SALE' | 'PURCHASE'
  items: InvoiceItem[]
  subtotal: number; discountAmount: number; taxAmount: number; grandTotal: number
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'DRAFT'
  paidAmount: number; dueAmount: number
  date: string; dueDate?: string; notes?: string
  orderStatus?: 'OPEN' | 'CONFIRMED' | 'CONVERTED' | 'CANCELLED'
  convertedTo?: string
  shippingAddress?: string; transportDetails?: string
  additionalCharges?: number; roundOff?: number
  gstr2Matched?: boolean
}

export interface LedgerEntry {
  id: string; partyId: string; partyName: string
  type: 'SALE' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT'
  amount: number; mode: string; reference: string
  description: string; date: string; runningBalance: number
}

export interface Expense {
  id: string; category: string; amount: number
  description: string; date: string; paymentMode: string
}

export type EmployeeRole = 'ADMIN' | 'SALES' | 'VIEWER'
export interface Employee {
  id: string; name: string; phone: string; email?: string
  role: EmployeeRole; salary: number; joiningDate: string; isActive: boolean
  pin?: string
}

export interface Unit {
  id: string; name: string; shortName: string; isActive: boolean
}

export type InvoiceTemplate = 'STANDARD' | 'COMPACT' | 'DETAILED' | 'CLASSIC' | 'MODERN' | 'PREMIUM' | 'ELEGANT' | 'BOLD' | 'NATURE' | 'OCEAN' | 'SUNSET' | 'CORPORATE'

export interface InvoiceSettings {
  prefix: string; template: InvoiceTemplate
  defaultTerms: string; enableGst: boolean
  themeColor: string; showLogo: boolean; showBank: boolean
  showSignature: boolean; paperSize: string
  currency: string; currencySymbol: string
  roundOff: boolean; lateFeePercent: number
}

export interface CrmLead {
  id: string; name: string; phone: string; email?: string
  source: string; status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NEGOTIATION' | 'WON' | 'LOST'
  estimatedValue: number; notes?: string; createdAt: string
}

export interface BusinessProfile {
  businessName: string; ownerName: string; phone: string; email: string
  address: string; gstin: string; pan: string
  bankName: string; bankAccount: string; bankIfsc: string; signature: string
  businessType?: string
}

export interface StockAdjustment {
  id: string; itemId: string; itemName: string; type: 'ADD' | 'REMOVE'
  quantity: number; reason: string; date: string; notes?: string
}

export interface BankAccount {
  id: string; name: string; type: 'BANK' | 'CASH' | 'WALLET'
  accountNo?: string; ifsc?: string; holderName?: string
  balance: number; isDefault: boolean; isActive: boolean
}

export interface BankTransaction {
  id: string; accountId: string; type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  amount: number; description: string; date: string; reference?: string
  category?: string; balance: number
}

export interface Subscription {
  id: string; name: string; partyId: string; partyName: string
  items: { itemId: string; itemName: string; quantity: number; rate: number; unit: string }[]
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  startDate: string; nextDate: string; endDate?: string
  totalAmount: number; isActive: boolean
}

export interface ProductionBatch {
  id: string; productId: string; productName: string; productUnit: string
  quantity: number; components: { itemId: string; itemName: string; quantityUsed: number; unit: string }[]
  date: string; notes?: string
}

export interface Delivery {
  id: string; invoiceId: string; invoiceNo: string; partyId: string; partyName: string
  address: string; pincode?: string; area?: string
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  date: string; deliveryDate?: string; notes?: string
}

export interface ReminderLog {
  id: string; invoiceId: string; partyName: string; invoiceNo: string
  amount: number; dueAmount: number; sentDate: string; type: 'WHATSAPP' | 'SMS'
}

export interface FixedAsset {
  id: string; name: string; category: string
  purchaseDate: string; purchasePrice: number
  depreciationMethod: 'SLM' | 'WDV'
  depreciationRate: number; usefulLife: number
  currentValue: number; salvageValue: number
  location?: string; notes?: string; isActive: boolean
}

export interface AuditLog {
  id: string; entity: string; entityId: string; action: string
  field?: string; oldValue?: string; newValue?: string
  user: string; timestamp: string; description: string
}

export interface Warehouse {
  id: string; name: string; address?: string; isActive: boolean
}

export interface CustomFieldDef {
  id: string; entity: 'ITEM' | 'PARTY' | 'INVOICE'
  label: string; type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT'
  options?: string[]; isRequired: boolean; isActive: boolean
}

export interface CustomFieldValue {
  fieldId: string; value: string
}

export interface StockTransfer {
  id: string; itemId: string; itemName: string
  fromWarehouse: string; toWarehouse: string
  quantity: number; date: string; notes?: string
}

export interface PriceListDef {
  id: string; name: string; isDefault: boolean
}
