-- ============================================================
-- Migration V3: Triggers and Functions
-- Vyapar Setu - PostgreSQL 15+ Compatible
-- ============================================================

-- ============================================================
-- FUNCTION: update_updated_at_column()
-- Sets updated_at = CURRENT_TIMESTAMP on row modification
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: update_updated_at on all auditable tables
-- ============================================================

DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'roles', 'permissions',
        'users',
        'businesses', 'device_registrations', 'refresh_tokens',
        'business_users', 'financial_years',
        'parties',
        'ledger_entries', 'ledger_balances',
        'categories', 'brands', 'units',
        'items',
        'warehouses', 'inventory', 'stock_movements',
        'invoices', 'invoice_items', 'invoice_sequences',
        'expenses',
        'employees', 'attendance', 'leaves', 'salaries',
        'notifications',
        'crm_leads', 'followups'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS trg_%1$I_updated_at ON %1$I;',
                tbl
            );
            EXECUTE format(
                'CREATE TRIGGER trg_%1$I_updated_at
                 BEFORE UPDATE ON %1$I
                 FOR EACH ROW
                 EXECUTE FUNCTION update_updated_at_column();',
                tbl
            );
        END IF;
    END LOOP;
END;
$$;

-- ============================================================
-- FUNCTION: update_ledger_balance()
-- Recalculates balance_after for the current party
-- when a new ledger entry is inserted.
-- Uses running balance from the last entry + the new amount.
-- ============================================================

CREATE OR REPLACE FUNCTION update_ledger_balance()
RETURNS TRIGGER AS $$
DECLARE
    last_balance DECIMAL(15,2);
BEGIN
    -- Get the balance from the most recent entry for this party & business
    SELECT balance_after INTO last_balance
    FROM ledger_entries
    WHERE business_id = NEW.business_id
      AND party_id = NEW.party_id
      AND id != NEW.id
    ORDER BY entry_date DESC, created_at DESC, id DESC
    LIMIT 1;

    -- If no prior entry, start at 0
    IF last_balance IS NULL THEN
        last_balance := 0;
    END IF;

    -- Calculate new balance based on entry type
    IF NEW.entry_type = 'DEBIT' THEN
        NEW.balance_after := last_balance + NEW.amount;
    ELSIF NEW.entry_type = 'CREDIT' THEN
        NEW.balance_after := last_balance - NEW.amount;
    ELSE
        NEW.balance_after := last_balance;
    END IF;

    -- Also update/insert the ledger_balances summary
    INSERT INTO ledger_balances (business_id, party_id, current_balance, balance_type, last_entry_date, as_of_date)
    VALUES (
        NEW.business_id,
        NEW.party_id,
        CASE WHEN NEW.entry_type = 'DEBIT' THEN NEW.balance_after ELSE -NEW.balance_after END,
        CASE WHEN NEW.balance_after >= 0 THEN 'DEBIT' ELSE 'CREDIT' END,
        CURRENT_TIMESTAMP,
        NEW.entry_date
    )
    ON CONFLICT (business_id, party_id)
    DO UPDATE SET
        current_balance = EXCLUDED.current_balance,
        balance_type    = EXCLUDED.balance_type,
        last_entry_date = EXCLUDED.last_entry_date,
        as_of_date      = EXCLUDED.as_of_date,
        updated_at      = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: trg_ledger_entries_balance on ledger_entries
-- ============================================================

DROP TRIGGER IF EXISTS trg_ledger_entries_balance ON ledger_entries;

CREATE TRIGGER trg_ledger_entries_balance
BEFORE INSERT ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION update_ledger_balance();
