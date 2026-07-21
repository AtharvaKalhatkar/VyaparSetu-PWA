export interface GstResult {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export function calculateGst(amount: number, rate: number, isInterState: boolean): GstResult {
  const taxableAmount = amount;
  const taxAmount = (taxableAmount * rate) / 100;
  if (isInterState) {
    return {
      igst: taxAmount,
      cgst: 0,
      sgst: 0,
      totalTax: taxAmount,
    };
  }
  const half = taxAmount / 2;
  return {
    cgst: half,
    sgst: half,
    igst: 0,
    totalTax: taxAmount,
  };
}

export function getGstRate(item: { gstRate?: number; hsnCode?: string; category?: { name?: string } }): number {
  if (item.gstRate != null) return item.gstRate;
  const hsn = item.hsnCode || '';
  const category = item.category?.name || '';
  if (hsn.startsWith('04')) return 0;
  if (hsn.startsWith('10') || category === 'Food Grains') return 5;
  if (hsn.startsWith('15') || category === 'Edible Oils') return 5;
  if (hsn.startsWith('0713') || hsn.startsWith('1001')) return 0;
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('grocery') || lowerCategory.includes('food')) return 5;
  if (lowerCategory.includes('electronic') || lowerCategory.includes('appliance')) return 18;
  if (lowerCategory.includes('luxury') || lowerCategory.includes('automobile')) return 28;
  return 18;
}

const hsnCodeMap: Record<string, string> = {
  'Electronics': '8542',
  'Clothing': '6204',
  'Food': '2106',
  'Furniture': '9403',
  'Books': '4901',
  'Cosmetics': '3304',
  'Auto Parts': '8708',
  'Machinery': '8479',
  'Plastic': '3926',
  'Chemicals': '3824',
  'Pharmaceuticals': '3004',
  'Stationery': '4820',
  'Footwear': '6403',
  'Toys': '9503',
  'Sports': '9506',
  'Jewelry': '7113',
  'Glass': '7013',
  'Paper': '4802',
  'Leather': '4202',
  'Wood': '4409',
};

export function getHsnCode(item: { hsnCode?: string; category?: { name?: string } }): string {
  if (item.hsnCode) return item.hsnCode;
  const categoryName = item.category?.name || '';
  return hsnCodeMap[categoryName] || '9999';
}

export function isGstApplicable(business: { gstin?: string }, party: { gstin?: string }): boolean {
  if (!business.gstin) return false;
  if (!party.gstin) return true;
  const businessStateCode = business.gstin.substring(0, 2);
  const partyStateCode = party.gstin.substring(0, 2);
  return businessStateCode !== partyStateCode;
}

export function isInterState(business: { gstin?: string }, party: { gstin?: string }): boolean {
  if (!business.gstin || !party.gstin) return false;
  return business.gstin.substring(0, 2) !== party.gstin.substring(0, 2);
}

export const GST_RATES = [0, 0.25, 1, 3, 5, 12, 18, 28] as const;

export function getGstRateOptions(): { label: string; value: number }[] {
  return GST_RATES.map(rate => ({
    label: rate === 0 ? 'Exempt (0%)' : `${rate}%`,
    value: rate,
  }));
}
