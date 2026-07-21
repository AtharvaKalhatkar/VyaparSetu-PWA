import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Config } from '../constants/config';
import { AuthService } from './auth';
import type {
  LoginRequest, RegisterRequest, AuthResponse, TokenRefreshResponse,
  SendOtpRequest, VerifyOtpRequest, Business, BusinessSettings,
  Party, PartyBalance, PartyLedger, LedgerEntry,
  Item, Inventory, StockMovement,
  Invoice, InvoiceItem,
  Expense, Employee, Attendance, Salary,
  CrmLead, FollowUp,
  Dashboard, SalesReport, OutstandingReport, StockReport, GstReport,
  ApiResponse, PaginatedResponse, LedgerSummary, SyncPayload, SyncBatchRequest, SyncResult,
} from '../types';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

const api: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AuthService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await AuthService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const { data } = await axios.post<TokenRefreshResponse>(
          `${Config.API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );
        await AuthService.setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AuthService.clearAll();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

const handleResponse = <T>(response: { data: ApiResponse<T> }): T => {
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Request failed');
};

const handlePaginatedResponse = <T>(response: { data: PaginatedResponse<T> }): PaginatedResponse<T> => {
  return response.data;
};

export const ApiService = {
  // Auth
  auth: {
    login: (payload: LoginRequest) =>
      api.post<ApiResponse<AuthResponse>>('/auth/login', payload).then(handleResponse),
    register: (payload: RegisterRequest) =>
      api.post<ApiResponse<AuthResponse>>('/auth/register', payload).then(handleResponse),
    refreshToken: (refreshToken: string) =>
      api.post<ApiResponse<TokenRefreshResponse>>('/auth/refresh', { refreshToken }).then(handleResponse),
    sendOtp: (payload: SendOtpRequest) =>
      api.post<ApiResponse<null>>('/auth/send-otp', payload).then(handleResponse),
    verifyOtp: (payload: VerifyOtpRequest) =>
      api.post<ApiResponse<AuthResponse>>('/auth/verify-otp', payload).then(handleResponse),
    logout: () =>
      api.post<ApiResponse<null>>('/auth/logout').then(handleResponse),
  },

  // Business
  business: {
    getBusinesses: () =>
      api.get<ApiResponse<Business[]>>('/businesses').then(handleResponse),
    getBusiness: (id: string) =>
      api.get<ApiResponse<Business>>(`/businesses/${id}`).then(handleResponse),
    updateBusiness: (id: string, data: Partial<Business>) =>
      api.put<ApiResponse<Business>>(`/businesses/${id}`, data).then(handleResponse),
    updateSettings: (businessId: string, settings: Partial<BusinessSettings>) =>
      api.put<ApiResponse<BusinessSettings>>(`/businesses/${businessId}/settings`, settings).then(handleResponse),
  },

  // Party
  party: {
    getParties: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<Party>>('/parties', { params }).then(handlePaginatedResponse),
    createParty: (data: Partial<Party>) =>
      api.post<ApiResponse<Party>>('/parties', data).then(handleResponse),
    updateParty: (id: string, data: Partial<Party>) =>
      api.put<ApiResponse<Party>>(`/parties/${id}`, data).then(handleResponse),
    deleteParty: (id: string) =>
      api.delete<ApiResponse<null>>(`/parties/${id}`).then(handleResponse),
    getParty: (id: string) =>
      api.get<ApiResponse<Party>>(`/parties/${id}`).then(handleResponse),
    searchParties: (query: string, params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<Party>>('/parties/search', { params: { q: query, ...params } }).then(handlePaginatedResponse),
    getOutstanding: () =>
      api.get<ApiResponse<PartyBalance[]>>('/parties/outstanding').then(handleResponse),
    getPartyLedger: (partyId: string, params?: Record<string, unknown>) =>
      api.get<ApiResponse<PartyLedger>>(`/parties/${partyId}/ledger`, { params }).then(handleResponse),
  },

  // Ledger
  ledger: {
    createEntry: (data: Partial<LedgerEntry>) =>
      api.post<ApiResponse<LedgerEntry>>('/ledger-entries', data).then(handleResponse),
    getEntries: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<LedgerEntry>>('/ledger-entries', { params }).then(handlePaginatedResponse),
    getSummary: (partyId: string) =>
      api.get<ApiResponse<LedgerSummary>>(`/ledger-entries/summary/${partyId}`).then(handleResponse),
    getOutstanding: () =>
      api.get<ApiResponse<PartyBalance[]>>('/ledger-entries/outstanding').then(handleResponse),
  },

  // Item
  item: {
    getItems: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<Item>>('/items', { params }).then(handlePaginatedResponse),
    createItem: (data: Partial<Item>) =>
      api.post<ApiResponse<Item>>('/items', data).then(handleResponse),
    updateItem: (id: string, data: Partial<Item>) =>
      api.put<ApiResponse<Item>>(`/items/${id}`, data).then(handleResponse),
    deleteItem: (id: string) =>
      api.delete<ApiResponse<null>>(`/items/${id}`).then(handleResponse),
    searchItems: (query: string, params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<Item>>('/items/search', { params: { q: query, ...params } }).then(handlePaginatedResponse),
    getByBarcode: (barcode: string) =>
      api.get<ApiResponse<Item>>(`/items/barcode/${barcode}`).then(handleResponse),
  },

  // Inventory
  inventory: {
    getInventory: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<Inventory>>('/inventory', { params }).then(handlePaginatedResponse),
    addStock: (data: { itemId: string; warehouseId: string; quantity: number; batchNo?: string; expiryDate?: string }) =>
      api.post<ApiResponse<StockMovement>>('/inventory/add', data).then(handleResponse),
    removeStock: (data: { itemId: string; warehouseId: string; quantity: number }) =>
      api.post<ApiResponse<StockMovement>>('/inventory/remove', data).then(handleResponse),
    transferStock: (data: { itemId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number }) =>
      api.post<ApiResponse<StockMovement>>('/inventory/transfer', data).then(handleResponse),
    getMovements: (itemId: string, params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<StockMovement>>(`/inventory/${itemId}/movements`, { params }).then(handlePaginatedResponse),
  },

  // Invoice
  invoice: {
    getInvoices: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<Invoice>>('/invoices', { params }).then(handlePaginatedResponse),
    createInvoice: (data: Partial<Invoice> & { items: Partial<InvoiceItem>[] }) =>
      api.post<ApiResponse<Invoice>>('/invoices', data).then(handleResponse),
    updateInvoice: (id: string, data: Partial<Invoice> & { items?: Partial<InvoiceItem>[] }) =>
      api.put<ApiResponse<Invoice>>(`/invoices/${id}`, data).then(handleResponse),
    deleteInvoice: (id: string) =>
      api.delete<ApiResponse<null>>(`/invoices/${id}`).then(handleResponse),
    cancelInvoice: (id: string, reason?: string) =>
      api.post<ApiResponse<Invoice>>(`/invoices/${id}/cancel`, { reason }).then(handleResponse),
    getInvoicePdf: (id: string) =>
      api.get<Blob>(`/invoices/${id}/pdf`, { responseType: 'blob' }).then(r => r.data),
    generateIrn: (id: string) =>
      api.post<ApiResponse<Invoice>>(`/invoices/${id}/generate-irn`).then(handleResponse),
  },

  // Report
  report: {
    getSalesReport: (params?: Record<string, unknown>) =>
      api.get<ApiResponse<SalesReport>>('/reports/sales', { params }).then(handleResponse),
    getPurchaseReport: (params?: Record<string, unknown>) =>
      api.get<ApiResponse<SalesReport>>('/reports/purchases', { params }).then(handleResponse),
    getOutstandingReport: (params?: Record<string, unknown>) =>
      api.get<ApiResponse<OutstandingReport>>('/reports/outstanding', { params }).then(handleResponse),
    getStockReport: (params?: Record<string, unknown>) =>
      api.get<ApiResponse<StockReport>>('/reports/stock', { params }).then(handleResponse),
    getGstReport: (params?: Record<string, unknown>) =>
      api.get<ApiResponse<GstReport>>('/reports/gst', { params }).then(handleResponse),
  },

  // Dashboard
  dashboard: {
    getDashboard: (params?: Record<string, unknown>) =>
      api.get<ApiResponse<Dashboard>>('/dashboard', { params }).then(handleResponse),
  },

  // Sync
  sync: {
    syncBatch: (data: SyncBatchRequest) =>
      api.post<ApiResponse<SyncResult>>('/sync/batch', data).then(handleResponse),
    getChangesSince: (timestamp: string) =>
      api.get<ApiResponse<SyncPayload[]>>('/sync/changes', { params: { since: timestamp } }).then(handleResponse),
    resolveConflict: (data: { entityType: string; entityId: string; resolution: 'CLIENT' | 'SERVER' }) =>
      api.post<ApiResponse<null>>('/sync/resolve', data).then(handleResponse),
  },

  // Settings
  settings: {
    getSettings: () =>
      api.get<ApiResponse<Record<string, string>>>('/settings').then(handleResponse),
    updateSettings: (settings: Record<string, string>) =>
      api.put<ApiResponse<Record<string, string>>>('/settings', settings).then(handleResponse),
  },

  // Payment
  payment: {
    createPayment: (data: { partyId: string; amount: number; type: 'RECEIVED' | 'PAID'; mode: string; reference?: string; notes?: string; date: string }) =>
      api.post<ApiResponse<unknown>>('/payments', data).then(handleResponse),
    getPayments: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<unknown>>('/payments', { params }).then(handlePaginatedResponse),
  },

  // Transaction
  transaction: {
    createTransaction: (data: { type: string; amount: number; category?: string; description?: string; partyId?: string; date: string }) =>
      api.post<ApiResponse<unknown>>('/transactions', data).then(handleResponse),
    getTransactions: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<unknown>>('/transactions', { params }).then(handlePaginatedResponse),
  },

  // Expense
  expense: {
    getExpenses: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<Expense>>('/expenses', { params }).then(handlePaginatedResponse),
    createExpense: (data: Partial<Expense>) =>
      api.post<ApiResponse<Expense>>('/expenses', data).then(handleResponse),
    updateExpense: (id: string, data: Partial<Expense>) =>
      api.put<ApiResponse<Expense>>(`/expenses/${id}`, data).then(handleResponse),
    deleteExpense: (id: string) =>
      api.delete<ApiResponse<null>>(`/expenses/${id}`).then(handleResponse),
  },

  // Employee
  employee: {
    getEmployees: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<Employee>>('/employees', { params }).then(handlePaginatedResponse),
    createEmployee: (data: Partial<Employee>) =>
      api.post<ApiResponse<Employee>>('/employees', data).then(handleResponse),
    updateEmployee: (id: string, data: Partial<Employee>) =>
      api.put<ApiResponse<Employee>>(`/employees/${id}`, data).then(handleResponse),
    deleteEmployee: (id: string) =>
      api.delete<ApiResponse<null>>(`/employees/${id}`).then(handleResponse),
  },

  // CRM
  crm: {
    getLeads: (params?: Record<string, unknown>) =>
      api.get<PaginatedResponse<CrmLead>>('/crm/leads', { params }).then(handlePaginatedResponse),
    createLead: (data: Partial<CrmLead>) =>
      api.post<ApiResponse<CrmLead>>('/crm/leads', data).then(handleResponse),
    updateLead: (id: string, data: Partial<CrmLead>) =>
      api.put<ApiResponse<CrmLead>>(`/crm/leads/${id}`, data).then(handleResponse),
    deleteLead: (id: string) =>
      api.delete<ApiResponse<null>>(`/crm/leads/${id}`).then(handleResponse),
    getFollowUps: (leadId: string) =>
      api.get<ApiResponse<FollowUp[]>>(`/crm/leads/${leadId}/follow-ups`).then(handleResponse),
    createFollowUp: (data: Partial<FollowUp>) =>
      api.post<ApiResponse<FollowUp>>('/crm/follow-ups', data).then(handleResponse),
  },
};

export default api;
