-- ============================================================
-- Migration V4: Add missing `deleted` column to tables
-- These tables have entities extending TenantEntity with
-- @SQLRestriction("deleted = false") but DDL was missing the column.
-- ============================================================

ALTER TABLE parties ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE ledger_balances ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE units ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Add sync_status and device_id columns where missing (TenantEntity fields)
ALTER TABLE parties ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE items ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE ledger_balances ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE units ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';

-- Add indexes for deleted columns
CREATE INDEX IF NOT EXISTS idx_parties_deleted ON parties(business_id, deleted);
CREATE INDEX IF NOT EXISTS idx_items_deleted ON items(business_id, deleted);
CREATE INDEX IF NOT EXISTS idx_invoices_deleted ON invoices(business_id, deleted);
CREATE INDEX IF NOT EXISTS idx_inventory_deleted ON inventory(business_id, deleted);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_deleted ON ledger_entries(business_id, deleted);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(business_id, deleted);
CREATE INDEX IF NOT EXISTS idx_employees_deleted ON employees(business_id, deleted);
