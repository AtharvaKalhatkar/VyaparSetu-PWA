export interface LoginRequest {
  username: string;
  password: string;
  deviceToken?: string;
}

export interface RegisterRequest {
  name: string;
  phone: string;
  email?: string;
  password: string;
  businessName: string;
  businessType: string;
  gstin?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  business: Business;
  expiresIn: number;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SendOtpRequest {
  phone?: string;
  email?: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'ACCOUNTANT';

export interface Business {
  id: string;
  name: string;
  legalName: string;
  gstin?: string;
  pan?: string;
  address: Address;
  phone: string;
  email?: string;
  logo?: string;
  website?: string;
  businessType: BusinessType;
  currency: string;
  timezone: string;
  fiscalYearStart: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BusinessType = 'RETAIL' | 'WHOLESALE' | 'MANUFACTURING' | 'SERVICE' | 'OTHER';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface BusinessSettings {
  id: string;
  businessId: string;
  invoicePrefix: string;
  invoiceTemplate: InvoiceTemplate;
  defaultTerms: string;
  enableGst: boolean;
  enableInventory: boolean;
  enableMultiWarehouse: boolean;
  enableBatchTracking: boolean;
  enableSerialTracking: boolean;
  enableCrm: boolean;
  enableEmployeeManagement: boolean;
  defaultPaymentTerms: number;
  taxSettings: TaxSettings;
  notificationSettings: NotificationSettings;
  printerSettings?: PrinterSettings;
}

export type InvoiceTemplate = 'STANDARD' | 'COMPACT' | 'DETAILED';

export interface TaxSettings {
  isInterState: boolean;
  defaultGstRate: number;
  enableReverseCharge: boolean;
  enableTds: boolean;
  tdsRate: number;
  enableTcs: boolean;
  tcsRate: number;
}

export interface NotificationSettings {
  enableSms: boolean;
  enableEmail: boolean;
  enablePush: boolean;
  lowStockAlert: boolean;
  paymentReminder: boolean;
  invoiceReminder: boolean;
}

export interface PrinterSettings {
  printerType: 'BLUETOOTH' | 'NETWORK' | 'USB';
  printerAddress?: string;
  paperSize: '58MM' | '80MM';
  copies: number;
}

export interface BusinessConfig {
  id: string;
  businessId: string;
  key: string;
  value: string;
}

export interface Party {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  gstin?: string;
  pan?: string;
  address?: Address;
  type: PartyType;
  creditLimit: number;
  creditDays: number;
  openingBalance: number;
  balanceType: 'DEBIT' | 'CREDIT';
  isActive: boolean;
  tags: string[];
  notes?: string;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';

export interface PartyBalance {
  partyId: string;
  partyName: string;
  phone: string;
  outstandingAmount: number;
  balanceType: 'DEBIT' | 'CREDIT';
  lastTransactionDate?: string;
  totalSales: number;
  totalPurchases: number;
  totalPayments: number;
}

export interface PartyLedger {
  partyId: string;
  partyName: string;
  entries: LedgerEntry[];
  summary: LedgerSummary;
}

export interface LedgerEntry {
  id: string;
  businessId: string;
  partyId: string;
  type: LedgerEntryType;
  amount: number;
  balanceType: 'DEBIT' | 'CREDIT';
  mode: PaymentMode;
  reference: string;
  description: string;
  invoiceId?: string;
  date: string;
  runningBalance: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType = 'SALE' | 'PURCHASE' | 'PAYMENT' | 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'OPENING_BALANCE' | 'ADJUSTMENT';

export type PaymentMode = 'CASH' | 'BANK' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CHEQUE' | 'ONLINE' | 'OTHER';

export interface LedgerSummary {
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  balanceType: 'DEBIT' | 'CREDIT';
}

export interface Item {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode?: string;
  hsnCode?: string;
  categoryId?: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
  unitId: string;
  unit?: Unit;
  sellingPrice: number;
  purchasePrice: number;
  mrp: number;
  gstRate: number;
  taxPreference: TaxPreference;
  isActive: boolean;
  isService: boolean;
  isBatchTracked: boolean;
  isSerialTracked: boolean;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  description?: string;
  imageUrl?: string;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type TaxPreference = 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED' | 'NIL_RATED';

export interface Category {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

export interface Brand {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  businessId: string;
  name: string;
  shortName: string;
  isActive: boolean;
}

export interface Inventory {
  id: string;
  businessId: string;
  itemId: string;
  item?: Item;
  warehouseId: string;
  warehouse?: Warehouse;
  quantity: number;
  batchNo?: string;
  expiryDate?: string;
  mfgDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  businessId: string;
  itemId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  reference: string;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type StockMovementType = 'PURCHASE' | 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'RETURN' | 'OPENING_STOCK';

export interface Warehouse {
  id: string;
  businessId: string;
  name: string;
  address?: Address;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNo: string;
  partyId: string;
  party?: Party;
  type: InvoiceType;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxAmount: number;
  total: number;
  roundOff: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  dueAmount: number;
  dueDate?: string;
  notes?: string;
  terms?: string;
  irn?: string;
  qrCode?: string;
  isIrnGenerated: boolean;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceType = 'SALE' | 'PURCHASE' | 'SALE_RETURN' | 'PURCHASE_RETURN';
export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'PARTIALLY_PAID' | 'PAID';
export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemId: string;
  itemName: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  unit: string;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  amount: number;
}

export interface Expense {
  id: string;
  businessId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMode: PaymentMode;
  reference?: string;
  billImage?: string;
  createdBy: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  salary: number;
  salaryType: SalaryType;
  joiningDate: string;
  isActive: boolean;
  address?: Address;
  documents?: string[];
  createdAt: string;
}

export type SalaryType = 'MONTHLY' | 'DAILY' | 'WEEKLY' | 'HOURLY';

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY';

export interface Salary {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentStatus: 'PENDING' | 'PAID';
  paidDate?: string;
}

export interface CrmLead {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  assignedTo?: string;
  estimatedValue: number;
  followUpDate?: string;
  createdAt: string;
}

export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'SOCIAL_MEDIA' | 'WALK_IN' | 'PHONE' | 'OTHER';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface FollowUp {
  id: string;
  leadId: string;
  notes: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduledAt: string;
  completedAt?: string;
  createdBy: string;
}

export type FollowUpType = 'CALL' | 'EMAIL' | 'MEETING' | 'VISIT' | 'OTHER';
export type FollowUpStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface SalesReport {
  totalSales: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  dailySales: { date: string; amount: number; count: number }[];
  monthlySales: { month: string; amount: number; count: number }[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  paymentModeBreakdown: Record<string, number>;
}

export interface OutstandingReport {
  totalOutstanding: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  overdueAmount: number;
  agingBuckets: AgingBucket[];
  topOutstandingParties: PartyBalance[];
}

export interface AgingBucket {
  label: string;
  fromDays: number;
  toDays: number;
  amount: number;
  count: number;
}

export interface StockReport {
  totalItems: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoryWiseStock: { category: string; count: number; value: number }[];
  warehouseWiseStock: { warehouse: string; count: number; value: number }[];
  slowMovingItems: Item[];
  fastMovingItems: Item[];
}

export interface GstReport {
  period: string;
  totalSales: number;
  totalPurchases: number;
  outputGst: GstBreakdown;
  inputGst: GstBreakdown;
  netPayable: number;
  gstReturnFiled: boolean;
  gstReturnStatus?: string;
}

export interface GstBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface TopProduct {
  itemId: string;
  itemName: string;
  quantity: number;
  amount: number;
}

export interface TopCustomer {
  partyId: string;
  partyName: string;
  amount: number;
  invoiceCount: number;
}

export interface Dashboard {
  todaySales: number;
  todaySalesCount: number;
  outstandingAmount: number;
  monthlySales: number;
  monthlySalesCount: number;
  recentTransactions: LedgerEntry[];
  lowStockItems: Item[];
  salesTrend: { date: string; amount: number }[];
  topProducts: TopProduct[];
}

export interface SyncPayload {
  entityType: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityId: string;
  data: Record<string, unknown>;
  timestamp: string;
  deviceId: string;
}

export interface SyncBatchRequest {
  businessId: string;
  lastSyncTimestamp?: string;
  changes: SyncPayload[];
}

export interface SyncResult {
  success: boolean;
  processedIds: string[];
  errors: SyncError[];
  serverChanges: SyncPayload[];
  newSyncTimestamp: string;
}

export interface SyncError {
  entityType: string;
  entityId: string;
  action: string;
  error: string;
  retryCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}
