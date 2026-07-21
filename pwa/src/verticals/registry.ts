import type { VerticalConfig } from './types'
import { defaultConfig } from './default'

const mu = (b?: VerticalConfig['itemFields']['batchExpiry'], w?: VerticalConfig['itemFields']['warehouseRack'], br?: VerticalConfig['itemFields']['brand'], m?: VerticalConfig['itemFields']['mrp']) => ({ batchExpiry: b || 'hidden', warehouseRack: w || 'hidden', brand: br || 'hidden', mrp: m || 'hidden' })
const pu = (g?: VerticalConfig['partyFields']['gstin'], c?: VerticalConfig['partyFields']['creditTerms']) => ({ gstin: g || 'hidden', creditTerms: c || 'hidden' })

export const RETAIL: VerticalConfig = defaultConfig

export const GROCERY: VerticalConfig = {
  ...defaultConfig, id: 'GROCERY', label: 'Grocery / Kirana',
  itemFields: mu('optional', 'hidden', 'required', 'required'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill', ledgerEntry: 'Udhari' },
  defaultCategories: ['Rice', 'Dal', 'Oil', 'Spice', 'Snacks', 'Sweets', 'Beverage', 'Soap', 'Detergent'], defaultGstRate: 5,
}

export const AGRI: VerticalConfig = {
  ...defaultConfig, id: 'AGRI', label: 'Agri-Input Store',
  itemFields: mu('optional', 'hidden', 'required', 'optional'),
  partyFields: pu('optional', 'required'),
  enableGst: true,
  terms: { party: 'Farmer', invoice: 'Sale', ledgerEntry: 'Udhari Entry' },
  defaultCategories: ['Seeds', 'Fertilizer', 'Pesticide', 'Equipment', 'Tools', 'Feed'], defaultGstRate: 5,
}

export const MEDICAL: VerticalConfig = {
  ...defaultConfig, id: 'MEDICAL', label: 'Medical Store',
  itemFields: mu('required', 'optional', 'required', 'optional'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Medicine', 'Surgical', 'Vitamin', 'Ayurvedic', 'Baby Care', 'Personal Care', 'First Aid'], defaultGstRate: 12,
}

export const PHARMA: VerticalConfig = {
  ...defaultConfig, id: 'PHARMA', label: 'Pharma Distributor',
  itemFields: mu('required', 'required', 'required', 'hidden'),
  partyFields: pu('required', 'required'),
  enableGst: true,
  terms: { party: 'Party', invoice: 'Invoice', ledgerEntry: 'Credit' },
  defaultCategories: ['Tablet', 'Syrup', 'Injection', 'Ointment', 'Medical Equipment', 'Surgical'], defaultGstRate: 12,
}

export const HARDWARE: VerticalConfig = {
  ...defaultConfig, id: 'HARDWARE', label: 'Hardware Store',
  itemFields: mu('hidden', 'required', 'optional', 'hidden'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Tiles', 'Sanitary', 'Fittings', 'Tools', 'Electrical', 'Plumbing', 'Cement'], defaultGstRate: 18,
}

export const DISTRIBUTOR: VerticalConfig = {
  ...defaultConfig, id: 'DISTRIBUTOR', label: 'Distributor / Wholesaler',
  itemFields: mu('optional', 'required', 'hidden', 'hidden'),
  partyFields: pu('required', 'required'),
  enableGst: true,
  terms: { party: 'Buyer', invoice: 'Invoice', ledgerEntry: 'Credit Entry' },
  defaultCategories: ['Consumer Goods', 'Packaging', 'Bulk Items', 'Promotional', 'FMCG'], defaultGstRate: 12,
}

export const AGENCY: VerticalConfig = {
  ...defaultConfig, id: 'AGENCY', label: 'Agency / Service Provider',
  itemFields: mu(),
  partyFields: pu('optional', 'optional'),
  enableGst: false,
  terms: { party: 'Client', invoice: 'Invoice', item: 'Service', ledgerEntry: 'Transaction' },
  defaultCategories: ['Service', 'Consultation', 'Maintenance', 'Subscription', 'Commission'], defaultGstRate: 18,
  enabledModules: defaultConfig.enabledModules.filter(m => m !== 'stock-adjustment' && m !== 'gst-reports' && m !== 'units'),
}

export const RESTAURANT: VerticalConfig = {
  ...defaultConfig, id: 'RESTAURANT', label: 'Restaurant / Food',
  itemFields: mu('optional', 'hidden', 'hidden', 'hidden'),
  partyFields: pu(),
  enableGst: false,
  terms: { party: 'Guest', invoice: 'Bill', item: 'Item' },
  defaultCategories: ['Starters', 'Main Course', 'Beverages', 'Desserts', 'Chinese', 'South Indian', 'Punjabi'], defaultGstRate: 5,
  enabledModules: defaultConfig.enabledModules.filter(m => m !== 'stock-adjustment' && m !== 'gst-reports'),
}

export const SALON: VerticalConfig = {
  ...defaultConfig, id: 'SALON', label: 'Salon / Parlour',
  itemFields: mu(),
  partyFields: pu(),
  enableGst: false,
  terms: { party: 'Client', invoice: 'Bill', item: 'Service' },
  defaultCategories: ['Hair Cut', 'Facial', 'Manicure', 'Pedicure', 'Coloring', 'Styling', 'Massage'], defaultGstRate: 18,
  enabledModules: defaultConfig.enabledModules.filter(m => m !== 'stock-adjustment' && m !== 'gst-reports'),
}

export const TAILOR: VerticalConfig = {
  ...defaultConfig, id: 'TAILOR', label: 'Tailor / Garments',
  itemFields: mu('hidden', 'optional', 'required', 'hidden'),
  partyFields: pu(),
  enableGst: false,
  terms: { party: 'Customer', invoice: 'Bill', item: 'Garment' },
  defaultCategories: ['Shirt', 'Pant', 'Suit', 'Kurta', 'Saree', 'Blouse', 'Alteration', 'Stitching'], defaultGstRate: 5,
}

export const ELECTRONICS: VerticalConfig = {
  ...defaultConfig, id: 'ELECTRONICS', label: 'Electronics / Mobile',
  itemFields: mu('optional', 'optional', 'required', 'required'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Mobile', 'Laptop', 'Accessories', 'TV', 'Audio', 'Gaming', 'Charger', 'Watch'], defaultGstRate: 18,
}

export const STATIONERY: VerticalConfig = {
  ...defaultConfig, id: 'STATIONERY', label: 'Stationery / Book Shop',
  itemFields: mu('hidden', 'optional', 'required', 'optional'),
  partyFields: pu(),
  enableGst: false,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Books', 'Pen', 'Paper', 'Office Supply', 'Art Supply', 'Notebook', 'Card'], defaultGstRate: 12,
}

export const AUTO: VerticalConfig = {
  ...defaultConfig, id: 'AUTO', label: 'Auto / Garage',
  itemFields: mu('hidden', 'optional', 'required', 'hidden'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill', item: 'Part / Service' },
  defaultCategories: ['Spare Parts', 'Engine Oil', 'Tyre', 'Battery', 'Service', 'Repair', 'AC Gas'], defaultGstRate: 18,
}

export const JEWELLERY: VerticalConfig = {
  ...defaultConfig, id: 'JEWELLERY', label: 'Jewellery Shop',
  itemFields: mu('hidden', 'hidden', 'required', 'required'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill', item: 'Article' },
  defaultCategories: ['Gold', 'Silver', 'Diamond', 'Platinum', 'Gemstone', 'Chain', 'Ring', 'Bangle', 'Earring'], defaultGstRate: 3,
}

export const TEXTILE: VerticalConfig = {
  ...defaultConfig, id: 'TEXTILE', label: 'Textile / Fabric',
  itemFields: mu('hidden', 'required', 'required', 'hidden'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill', item: 'Fabric' },
  defaultCategories: ['Cotton', 'Silk', 'Linen', 'Polyester', 'Wool', 'Velvet', 'Printed', 'Chiffon'], defaultGstRate: 5,
}

export const FURNITURE: VerticalConfig = {
  ...defaultConfig, id: 'FURNITURE', label: 'Furniture Shop',
  itemFields: mu('hidden', 'required', 'required', 'hidden'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Sofa', 'Bed', 'Table', 'Chair', 'Wardrobe', 'Dining', 'Office', 'Mattress'], defaultGstRate: 18,
}

export const DAIRY: VerticalConfig = {
  ...defaultConfig, id: 'DAIRY', label: 'Dairy / Milk',
  itemFields: mu('required', 'hidden', 'required', 'hidden'),
  partyFields: pu('optional', 'required'),
  enableGst: false,
  terms: { party: 'Customer', invoice: 'Bill', ledgerEntry: 'Dues' },
  defaultCategories: ['Milk', 'Curd', 'Butter', 'Paneer', 'Ghee', 'Lassi', 'Cheese', 'Cream', 'Buttermilk'], defaultGstRate: 5,
}

export const POULTRY: VerticalConfig = {
  ...defaultConfig, id: 'POULTRY', label: 'Poultry / Animal Feed',
  itemFields: mu('optional', 'optional', 'required', 'hidden'),
  partyFields: pu('optional', 'required'),
  enableGst: false,
  terms: { party: 'Farmer', invoice: 'Bill', ledgerEntry: 'Credit' },
  defaultCategories: ['Chicken Feed', 'Cattle Feed', 'Fish Feed', 'Supplement', 'Medicine', 'Equipment', 'Broiler'], defaultGstRate: 5,
}

export const CONSTRUCTION: VerticalConfig = {
  ...defaultConfig, id: 'CONSTRUCTION', label: 'Construction Material',
  itemFields: mu('hidden', 'required', 'hidden', 'hidden'),
  partyFields: pu('optional', 'required'),
  enableGst: true,
  terms: { party: 'Contractor', invoice: 'Invoice', ledgerEntry: 'Credit' },
  defaultCategories: ['Cement', 'Steel', 'Sand', 'Brick', 'Aggregate', 'Tiles', 'Paint', 'Pipe', 'Rod'], defaultGstRate: 18,
}

export const TENT: VerticalConfig = {
  ...defaultConfig, id: 'TENT', label: 'Tent House / Events',
  itemFields: mu('hidden', 'required', 'hidden', 'hidden'),
  partyFields: pu('optional', 'required'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Tent', 'Chair', 'Table', 'Sound', 'Light', 'Decoration', 'Catering', 'Generator'], defaultGstRate: 18,
}

export const REAL_ESTATE: VerticalConfig = {
  ...defaultConfig, id: 'REAL_ESTATE', label: 'Real Estate Agency',
  itemFields: mu(),
  partyFields: pu('hidden', 'optional'),
  enableGst: false,
  terms: { party: 'Client', invoice: 'Invoice', item: 'Property', ledgerEntry: 'Transaction' },
  defaultCategories: ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Land'], defaultGstRate: 18,
  enabledModules: defaultConfig.enabledModules.filter(m => m !== 'stock-adjustment' && m !== 'gst-reports' && m !== 'units'),
}

export const COURIER: VerticalConfig = {
  ...defaultConfig, id: 'COURIER', label: 'Courier / Logistics',
  itemFields: mu('hidden', 'required', 'hidden', 'hidden'),
  partyFields: pu('optional', 'required'),
  enableGst: true,
  terms: { party: 'Sender', invoice: 'Waybill', item: 'Parcel' },
  defaultCategories: ['Document', 'Parcel', 'Fragile', 'Express', 'Standard', 'Oversize'], defaultGstRate: 18,
}

export const PAINT: VerticalConfig = {
  ...defaultConfig, id: 'PAINT', label: 'Paint & Chemical',
  itemFields: mu('optional', 'required', 'required', 'hidden'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Paint', 'Polish', 'Thinner', 'Brush', 'Roller', 'Chemical', 'Color', 'Primer'], defaultGstRate: 18,
}

export const BAKERY: VerticalConfig = {
  ...defaultConfig, id: 'BAKERY', label: 'Bakery / Confectionery',
  itemFields: mu('required', 'hidden', 'required', 'hidden'),
  partyFields: pu(),
  enableGst: false,
  terms: { party: 'Customer', invoice: 'Bill', item: 'Product' },
  defaultCategories: ['Bread', 'Cake', 'Pastry', 'Cookie', 'Bun', 'Puff', 'Biscuit', 'Muffin'], defaultGstRate: 5,
  enabledModules: defaultConfig.enabledModules.filter(m => m !== 'gst-reports'),
}

export const PLUMBING: VerticalConfig = {
  ...defaultConfig, id: 'PLUMBING', label: 'Plumbing / Electrical',
  itemFields: mu('hidden', 'required', 'required', 'optional'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Pipe', 'Fitting', 'Tap', 'Valve', 'Wire', 'Switch', 'MCB', 'Fan', 'Light', 'Socket'], defaultGstRate: 18,
}

export const GARMENT_SHOP: VerticalConfig = {
  ...defaultConfig, id: 'GARMENT_SHOP', label: 'Garment / Readymade',
  itemFields: mu('hidden', 'optional', 'required', 'required'),
  partyFields: pu('optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill', item: 'Item' },
  defaultCategories: ['T-Shirt', 'Shirt', 'Jeans', 'Trouser', 'Kurta', 'Western', 'Ethnic', 'Kurti'], defaultGstRate: 5,
}

export const OPTICAL: VerticalConfig = {
  ...defaultConfig, id: 'OPTICAL', label: 'Optical Store',
  itemFields: mu('hidden', 'hidden', 'required', 'required'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Frame', 'Lens', 'Sunglass', 'Contact Lens', 'Solution', 'Accessory', 'Goggles'], defaultGstRate: 12,
}

export const SPORTS: VerticalConfig = {
  ...defaultConfig, id: 'SPORTS', label: 'Sports / Fitness',
  itemFields: mu('hidden', 'optional', 'required', 'required'),
  partyFields: pu('optional', 'optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Cricket', 'Football', 'Badminton', 'Gym', 'Cycling', 'Swimming', 'Accessory', 'Shoe'], defaultGstRate: 12,
}

export const PET: VerticalConfig = {
  ...defaultConfig, id: 'PET', label: 'Pet Shop',
  itemFields: mu('optional', 'optional', 'required', 'optional'),
  partyFields: pu('optional'),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Dog Food', 'Cat Food', 'Pet Toy', 'Pet Accessory', 'Pet Medicine', 'Grooming', 'Collar'], defaultGstRate: 5,
}

export const FLORIST: VerticalConfig = {
  ...defaultConfig, id: 'FLORIST', label: 'Florist / Nursery',
  itemFields: mu(),
  partyFields: pu(),
  enableGst: false,
  terms: { party: 'Customer', invoice: 'Bill', item: 'Plant' },
  defaultCategories: ['Flower', 'Plant', 'Pot', 'Soil', 'Seed', 'Fertilizer', 'Tool', 'Bouquet'], defaultGstRate: 5,
  enabledModules: defaultConfig.enabledModules.filter(m => m !== 'gst-reports'),
}

export const GIFT: VerticalConfig = {
  ...defaultConfig, id: 'GIFT', label: 'Gift / Novelty Shop',
  itemFields: mu('hidden', 'optional', 'hidden', 'required'),
  partyFields: pu(),
  enableGst: true,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Toy', 'Gift', 'Novelty', 'Party Supply', 'Craft', 'Decor', 'Soft Toy'], defaultGstRate: 12,
}

export const MEAT: VerticalConfig = {
  ...defaultConfig, id: 'MEAT', label: 'Meat / Fish Shop',
  itemFields: mu('required', 'hidden', 'hidden', 'hidden'),
  partyFields: pu(),
  enableGst: false,
  terms: { party: 'Customer', invoice: 'Bill' },
  defaultCategories: ['Chicken', 'Mutton', 'Fish', 'Prawn', 'Egg', 'Marinated', 'Seafood'], defaultGstRate: 0,
  enabledModules: defaultConfig.enabledModules.filter(m => m !== 'gst-reports'),
}

export const ALL_VERTICALS: VerticalConfig[] = [
  GROCERY, RETAIL, AGRI, MEDICAL, PHARMA, HARDWARE, DISTRIBUTOR, AGENCY,
  RESTAURANT, SALON, TAILOR, ELECTRONICS, STATIONERY, AUTO, JEWELLERY,
  TEXTILE, FURNITURE, DAIRY, POULTRY, CONSTRUCTION, TENT, REAL_ESTATE,
  COURIER, PAINT, BAKERY, PLUMBING, GARMENT_SHOP, OPTICAL, SPORTS,
  PET, FLORIST, GIFT, MEAT,
]

export const VERTICAL_MAP: Record<string, VerticalConfig> = {}
ALL_VERTICALS.forEach(v => { VERTICAL_MAP[v.id] = v })