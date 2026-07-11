export type BusinessType =
  | 'RETAIL' | 'GROCERY' | 'AGRI' | 'MEDICAL' | 'PHARMA' | 'HARDWARE'
  | 'DISTRIBUTOR' | 'AGENCY' | 'RESTAURANT' | 'SALON' | 'TAILOR'
  | 'ELECTRONICS' | 'STATIONERY' | 'AUTO' | 'JEWELLERY' | 'TEXTILE'
  | 'FURNITURE' | 'DAIRY' | 'POULTRY' | 'CONSTRUCTION' | 'TENT'
  | 'REAL_ESTATE' | 'COURIER' | 'PAINT' | 'BAKERY' | 'PLUMBING'
  | 'GARMENT_SHOP' | 'OPTICAL' | 'SPORTS' | 'PET' | 'FLORIST'
  | 'GIFT' | 'MEAT';

export interface VerticalConfig {
  id: BusinessType;
  label: string;
  enabledModules: string[];
  enableGst: boolean;
  itemFields: {
    batchExpiry: 'hidden' | 'optional' | 'required';
    warehouseRack: 'hidden' | 'optional' | 'required';
    brand: 'hidden' | 'optional' | 'required';
    mrp: 'hidden' | 'optional' | 'required';
  };
  partyFields: {
    gstin: 'hidden' | 'optional' | 'required';
    creditTerms: 'hidden' | 'optional' | 'required';
  };
  terms: Partial<{
    party: string;
    item: string;
    invoice: string;
    ledgerEntry: string;
  }>;
  defaultCategories: string[];
  defaultGstRate: number;
  dashboardWidgets: string[];
}