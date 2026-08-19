import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'parties',
      columns: [
        { name: 'business_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // CUSTOMER, SUPPLIER, BOTH
        { name: 'opening_balance', type: 'number' },
        { name: 'balance_type', type: 'string' },
        { name: 'credit_limit', type: 'number' },
        { name: 'gstin', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'items',
      columns: [
        { name: 'business_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'sku', type: 'string' },
        { name: 'barcode', type: 'string', isOptional: true },
        { name: 'hsn_code', type: 'string', isOptional: true },
        { name: 'selling_price', type: 'number' },
        { name: 'purchase_price', type: 'number' },
        { name: 'gst_rate', type: 'number' },
        { name: 'current_stock', type: 'number' },
        { name: 'min_stock_level', type: 'number' },
        { name: 'unit_name', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'invoices',
      columns: [
        { name: 'business_id', type: 'string' },
        { name: 'invoice_no', type: 'string' },
        { name: 'party_id', type: 'string' },
        { name: 'party_name', type: 'string' },
        { name: 'type', type: 'string' }, // SALE, PURCHASE
        { name: 'doc_type', type: 'string' },
        { name: 'subtotal', type: 'number' },
        { name: 'tax_amount', type: 'number' },
        { name: 'discount_amount', type: 'number' },
        { name: 'grand_total', type: 'number' },
        { name: 'payment_status', type: 'string' },
        { name: 'paid_amount', type: 'number' },
        { name: 'due_amount', type: 'number' },
        { name: 'date', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
