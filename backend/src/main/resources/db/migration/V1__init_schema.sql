-- ============================================================
-- Migration V1: Initial Schema
-- Vyapar Setu - PostgreSQL 15+ Compatible
-- ============================================================

-- ============================================================
-- CORE TABLES: roles, permissions, role_permissions
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    version     BIGINT      DEFAULT 0
);

CREATE TABLE IF NOT EXISTS permissions (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    resource    VARCHAR(100),
    action      VARCHAR(50),
    description TEXT,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    version     BIGINT      DEFAULT 0
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- USERS: users, user_roles
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    email             VARCHAR(255) UNIQUE,
    phone             VARCHAR(20)  UNIQUE,
    password          VARCHAR(255),
    full_name         VARCHAR(255) NOT NULL,
    display_name      VARCHAR(255),
    avatar            VARCHAR(500),
    language          VARCHAR(10)  DEFAULT 'en',
    is_active         BOOLEAN      DEFAULT true,
    is_email_verified BOOLEAN      DEFAULT false,
    is_phone_verified BOOLEAN      DEFAULT false,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    version           BIGINT       DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================
-- BUSINESS: businesses, business_users, financial_years
-- ============================================================

CREATE TABLE IF NOT EXISTS businesses (
    id                  UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    business_type       VARCHAR(100),
    gstin               VARCHAR(15)  UNIQUE,
    pan                 VARCHAR(10),
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    country             VARCHAR(100) DEFAULT 'India',
    phone               VARCHAR(20),
    email               VARCHAR(255),
    website             VARCHAR(255),
    logo                VARCHAR(500),
    financial_year_start VARCHAR(10),
    financial_year_end  VARCHAR(10),
    is_active           BOOLEAN      DEFAULT true,
    is_gst_enabled      BOOLEAN      DEFAULT false,
    config              JSONB        DEFAULT '{}',
    settings            JSONB        DEFAULT '{}',
    business_id         UUID         NOT NULL,
    sync_status         VARCHAR(20)  DEFAULT 'SYNCED'
        CHECK (sync_status IN ('SYNCED','PENDING','SYNCING','FAILED')),
    device_id           VARCHAR(255),
    deleted             BOOLEAN      DEFAULT false,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    version             BIGINT       DEFAULT 0
);

CREATE TABLE IF NOT EXISTS device_registrations (
    id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id     VARCHAR(255),
    device_type   VARCHAR(20)
        CHECK (device_type IN ('ANDROID','IOS','WEB','DESKTOP')),
    device_name   VARCHAR(255),
    fcm_token     TEXT,
    is_active     BOOLEAN     DEFAULT true,
    last_synced_at TIMESTAMP,
    app_version   VARCHAR(20),
    created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    token       VARCHAR(500) NOT NULL UNIQUE,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID         REFERENCES businesses(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      DEFAULT false,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_users (
    id          UUID       DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID       NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    role_id     UUID       REFERENCES roles(id) ON DELETE SET NULL,
    is_active   BOOLEAN    DEFAULT true,
    joined_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_years (
    id          UUID       DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID       NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year_start  DATE,
    year_end    DATE,
    name        VARCHAR(50),
    is_current  BOOLEAN    DEFAULT false,
    is_closed   BOOLEAN    DEFAULT false,
    created_at  TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    version     BIGINT     DEFAULT 0
);

-- ============================================================
-- PARTIES: parties, party_documents
-- ============================================================

CREATE TABLE IF NOT EXISTS parties (
    id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id      UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name             VARCHAR(255)  NOT NULL,
    phone            VARCHAR(20),
    email            VARCHAR(255),
    gstin            VARCHAR(15),
    pan              VARCHAR(10),
    address_line1    VARCHAR(255),
    address_line2    VARCHAR(255),
    city             VARCHAR(100),
    state            VARCHAR(100),
    pincode          VARCHAR(10),
    country          VARCHAR(100)  DEFAULT 'India',
    type             VARCHAR(20)   NOT NULL
        CHECK (type IN ('CUSTOMER','SUPPLIER','BOTH')),
    party_type       VARCHAR(50),
    opening_balance  DECIMAL(15,2) DEFAULT 0,
    balance_type     VARCHAR(10)   DEFAULT 'DEBIT'
        CHECK (balance_type IN ('DEBIT','CREDIT')),
    credit_limit     DECIMAL(15,2),
    credit_days      INT,
    price_category   VARCHAR(20),
    notes            TEXT,
    tags             VARCHAR(500),
    is_active        BOOLEAN       DEFAULT true,
    shipping_address TEXT,
    gps_latitude     DECIMAL(10,7),
    gps_longitude    DECIMAL(10,7),
    custom_fields    JSONB         DEFAULT '{}',
    photo_url        VARCHAR(500),
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),
    version          BIGINT        DEFAULT 0
);

CREATE TABLE IF NOT EXISTS party_documents (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    party_id       UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    document_type  VARCHAR(50),
    file_name      VARCHAR(255),
    file_url       VARCHAR(500),
    uploaded_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    created_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- LEDGER: ledger_entries, ledger_balances
-- ============================================================

CREATE TABLE IF NOT EXISTS ledger_entries (
    id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id      UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id         UUID          REFERENCES parties(id) ON DELETE SET NULL,
    invoice_id       UUID,
    transaction_type VARCHAR(50),
    entry_type       VARCHAR(10)
        CHECK (entry_type IN ('DEBIT','CREDIT')),
    amount           DECIMAL(15,2) NOT NULL,
    balance_after    DECIMAL(15,2),
    mode             VARCHAR(20),
    reference        VARCHAR(255),
    note             TEXT,
    entry_date       DATE          NOT NULL,
    due_date         DATE,
    is_reconciled    BOOLEAN       DEFAULT false,
    reconciled_at    TIMESTAMP,
    invoice_no       VARCHAR(100),
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),
    version          BIGINT        DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ledger_balances (
    id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id       UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id          UUID          NOT NULL REFERENCES parties(id) ON DELETE CASCADE UNIQUE,
    current_balance   DECIMAL(15,2) DEFAULT 0,
    balance_type      VARCHAR(10)
        CHECK (balance_type IN ('DEBIT','CREDIT')),
    last_entry_date   TIMESTAMP,
    total_due         DECIMAL(15,2) DEFAULT 0,
    total_overdue     DECIMAL(15,2) DEFAULT 0,
    credit_limit      DECIMAL(15,2),
    as_of_date        DATE,
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CATALOGUE: categories, brands, units
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id   UUID         REFERENCES categories(id) ON DELETE SET NULL,
    image_url   VARCHAR(500),
    sort_order  INT          DEFAULT 0,
    is_active   BOOLEAN      DEFAULT true,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    version     BIGINT       DEFAULT 0
);

CREATE TABLE IF NOT EXISTS brands (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    image_url   VARCHAR(500),
    is_active   BOOLEAN      DEFAULT true,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    version     BIGINT       DEFAULT 0
);

CREATE TABLE IF NOT EXISTS units (
    id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id       UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name              VARCHAR(100)  NOT NULL,
    short_name        VARCHAR(20)   NOT NULL,
    base_unit_id      UUID          REFERENCES units(id) ON DELETE SET NULL,
    conversion_factor DECIMAL(15,4) DEFAULT 1,
    unit_type         VARCHAR(20),
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    version           BIGINT        DEFAULT 0
);

-- ============================================================
-- ITEMS: items
-- ============================================================

CREATE TABLE IF NOT EXISTS items (
    id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id       UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name              VARCHAR(255)  NOT NULL,
    sku               VARCHAR(100),
    barcode           VARCHAR(100),
    hsn_code          VARCHAR(10),
    gst_rate          DECIMAL(5,2)  DEFAULT 0,
    category_id       UUID          REFERENCES categories(id) ON DELETE SET NULL,
    brand_id          UUID          REFERENCES brands(id) ON DELETE SET NULL,
    unit_id           UUID          REFERENCES units(id) ON DELETE SET NULL,
    purchase_price    DECIMAL(15,2) DEFAULT 0,
    selling_price     DECIMAL(15,2) DEFAULT 0,
    mrp               DECIMAL(15,2) DEFAULT 0,
    min_stock_level   DECIMAL(15,2) DEFAULT 0,
    max_stock_level   DECIMAL(15,2),
    current_stock     DECIMAL(15,2) DEFAULT 0,
    stock_location    VARCHAR(255),
    is_batch_tracked  BOOLEAN       DEFAULT false,
    has_expiry        BOOLEAN       DEFAULT false,
    is_active         BOOLEAN       DEFAULT true,
    tax_type          VARCHAR(20)   DEFAULT 'GST',
    cess              DECIMAL(5,2)  DEFAULT 0,
    description       TEXT,
    image_url         VARCHAR(500),
    tags              VARCHAR(500),
    custom_fields     JSONB         DEFAULT '{}',
    weight            DECIMAL(15,4),
    weight_unit       VARCHAR(20),
    is_service        BOOLEAN       DEFAULT false,
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    version           BIGINT        DEFAULT 0
);

-- ============================================================
-- INVENTORY: warehouses, inventory, stock_movements
-- ============================================================

CREATE TABLE IF NOT EXISTS warehouses (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50),
    address     TEXT,
    city        VARCHAR(100),
    state       VARCHAR(100),
    is_active   BOOLEAN      DEFAULT true,
    is_primary  BOOLEAN      DEFAULT false,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    version     BIGINT       DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
    id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id    UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    item_id        UUID          NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    warehouse_id   UUID          NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity       DECIMAL(15,2) DEFAULT 0,
    batch_no       VARCHAR(100),
    expiry_date    DATE,
    mfg_date       DATE,
    purchase_price DECIMAL(15,2),
    selling_price  DECIMAL(15,2),
    location       VARCHAR(255),
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),
    updated_by     VARCHAR(100),
    version        BIGINT        DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id     UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    item_id         UUID          NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    warehouse_id    UUID          REFERENCES warehouses(id) ON DELETE SET NULL,
    movement_type   VARCHAR(50),
    quantity        DECIMAL(15,2) NOT NULL,
    batch_no        VARCHAR(100),
    expiry_date     DATE,
    mfg_date        DATE,
    reference_type  VARCHAR(100),
    reference_id    UUID,
    note            TEXT,
    unit_price      DECIMAL(15,2),
    total_amount    DECIMAL(15,2),
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    version         BIGINT        DEFAULT 0
);

-- ============================================================
-- INVOICES: invoices, invoice_items, invoice_sequences
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id         UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_no          VARCHAR(100)  NOT NULL,
    invoice_type        VARCHAR(50),
    party_id            UUID          REFERENCES parties(id) ON DELETE SET NULL,
    invoice_date        DATE          NOT NULL,
    due_date            DATE,
    reference           VARCHAR(255),
    status              VARCHAR(50)   DEFAULT 'DRAFT',
    subtotal            DECIMAL(15,2) DEFAULT 0,
    discount_percent    DECIMAL(5,2)  DEFAULT 0,
    discount_amount     DECIMAL(15,2) DEFAULT 0,
    taxable_amount      DECIMAL(15,2) DEFAULT 0,
    cgst                DECIMAL(15,2) DEFAULT 0,
    sgst                DECIMAL(15,2) DEFAULT 0,
    igst                DECIMAL(15,2) DEFAULT 0,
    cess                DECIMAL(15,2) DEFAULT 0,
    total_gst           DECIMAL(15,2) DEFAULT 0,
    round_off           DECIMAL(5,2)  DEFAULT 0,
    grand_total         DECIMAL(15,2) DEFAULT 0,
    paid_amount         DECIMAL(15,2) DEFAULT 0,
    balance_due         DECIMAL(15,2) DEFAULT 0,
    payment_status      VARCHAR(20)   DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID','PAID','PARTIAL','OVERDUE','CANCELLED')),
    payment_mode        VARCHAR(20),
    terms_and_conditions TEXT,
    notes               TEXT,
    irn                 VARCHAR(100),
    irn_generated_at    TIMESTAMP,
    eway_bill_no        VARCHAR(50),
    qr_code_url         VARCHAR(500),
    pdf_url             VARCHAR(500),
    is_gst_invoice      BOOLEAN       DEFAULT false,
    place_of_supply     VARCHAR(100),
    reverse_charge      BOOLEAN       DEFAULT false,
    tally_voucher_id    VARCHAR(100),
    tally_guid          VARCHAR(100),
    invoice_sequence_id UUID,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    version             BIGINT        DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id      UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id       UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id          UUID          REFERENCES items(id) ON DELETE SET NULL,
    description      TEXT,
    quantity         DECIMAL(15,2) NOT NULL,
    unit             VARCHAR(50),
    rate             DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2)  DEFAULT 0,
    discount_amount  DECIMAL(15,2) DEFAULT 0,
    taxable_amount   DECIMAL(15,2) DEFAULT 0,
    gst_rate         DECIMAL(5,2)  DEFAULT 0,
    cgst             DECIMAL(15,2) DEFAULT 0,
    sgst             DECIMAL(15,2) DEFAULT 0,
    igst             DECIMAL(15,2) DEFAULT 0,
    cess             DECIMAL(15,2) DEFAULT 0,
    total_amount     DECIMAL(15,2) DEFAULT 0,
    batch_no         VARCHAR(100),
    expiry_date      DATE,
    hsn_code         VARCHAR(10),
    serial_no        INT,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_sequences (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id     UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    prefix          VARCHAR(20),
    suffix          VARCHAR(20),
    sequence        BIGINT      DEFAULT 0,
    format          VARCHAR(100),
    invoice_type    VARCHAR(50),
    financial_year  VARCHAR(20),
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EXPENSES: expenses
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id   UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    expense_no    VARCHAR(100),
    expense_date  DATE,
    category      VARCHAR(50),
    amount        DECIMAL(15,2) NOT NULL,
    payment_mode  VARCHAR(20),
    paid_to       VARCHAR(255),
    description   TEXT,
    reference     VARCHAR(255),
    receipt_url   VARCHAR(500),
    is_billable   BOOLEAN       DEFAULT false,
    approved_by_id UUID,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by    VARCHAR(100),
    updated_by    VARCHAR(100),
    version       BIGINT        DEFAULT 0
);

-- ============================================================
-- HR: employees, attendance, leaves, salaries
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id                 UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id        UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id            UUID         REFERENCES users(id) ON DELETE SET NULL,
    employee_code      VARCHAR(50),
    full_name          VARCHAR(255) NOT NULL,
    phone              VARCHAR(20),
    email              VARCHAR(255),
    department         VARCHAR(100),
    designation        VARCHAR(100),
    joining_date       DATE,
    salary             DECIMAL(15,2),
    commission_percent DECIMAL(5,2),
    work_type          VARCHAR(20),
    documents          JSONB        DEFAULT '{}',
    is_active          BOOLEAN      DEFAULT true,
    created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100),
    version            BIGINT       DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attendance (
    id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id   UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id   UUID          NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date          DATE          NOT NULL,
    check_in      TIMESTAMP,
    check_out     TIMESTAMP,
    status        VARCHAR(20),
    gps_latitude  DECIMAL(10,7),
    gps_longitude DECIMAL(10,7),
    note          TEXT,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaves (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id     UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id     UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type      VARCHAR(20),
    start_date      DATE,
    end_date        DATE,
    total_days      INT,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'PENDING',
    approved_by_id  UUID,
    approved_at     TIMESTAMP,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salaries (
    id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id     UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id     UUID          NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month           INT
        CHECK (month BETWEEN 1 AND 12),
    year            INT,
    basic_salary    DECIMAL(15,2),
    allowances      JSONB         DEFAULT '{}',
    deductions      JSONB         DEFAULT '{}',
    gross_pay       DECIMAL(15,2),
    net_pay         DECIMAL(15,2),
    status          VARCHAR(20)   DEFAULT 'PENDING',
    paid_date       DATE,
    payment_mode    VARCHAR(20),
    transaction_ref VARCHAR(255),
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- NOTIFICATIONS: notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id    UUID        REFERENCES businesses(id) ON DELETE CASCADE,
    user_id        UUID        REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(255),
    message        TEXT,
    type           VARCHAR(20),
    channel        VARCHAR(20),
    reference_type VARCHAR(100),
    reference_id   VARCHAR(100),
    is_read        BOOLEAN     DEFAULT false,
    read_at        TIMESTAMP,
    sent_at        TIMESTAMP,
    delivered_at   TIMESTAMP,
    scheduled_at   TIMESTAMP,
    status         VARCHAR(20) DEFAULT 'PENDING',
    created_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SYNC: sync_logs, sync_queue
-- ============================================================

CREATE TABLE IF NOT EXISTS sync_logs (
    id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id       UUID,
    entity_type       VARCHAR(100) NOT NULL,
    entity_id         UUID,
    operation         VARCHAR(20),
    device_id         VARCHAR(255),
    payload           JSONB,
    synced_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    conflict_resolved BOOLEAN     DEFAULT false,
    status            VARCHAR(20) DEFAULT 'PENDING',
    error_message     TEXT,
    created_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id       UUID,
    entity_type       VARCHAR(100),
    entity_id         UUID,
    operation         VARCHAR(20),
    payload           JSONB,
    device_id         VARCHAR(255),
    status            VARCHAR(20) DEFAULT 'PENDING',
    retry_count       INT         DEFAULT 0,
    max_retries       INT         DEFAULT 5,
    error_message     TEXT,
    next_retry_at     TIMESTAMP,
    queued_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    processed_at      TIMESTAMP,
    created_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AUDIT: audit_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID,
    actor_id    UUID,
    action      VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id   UUID,
    field_name  VARCHAR(100),
    old_value   TEXT,
    new_value   TEXT,
    ip_address  VARCHAR(50),
    user_agent  TEXT,
    timestamp   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CRM: crm_leads, followups
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_leads (
    id                   UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id          UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id             UUID          REFERENCES parties(id) ON DELETE SET NULL,
    company_name         VARCHAR(255),
    contact_person       VARCHAR(255),
    phone                VARCHAR(20),
    email                VARCHAR(255),
    lead_source          VARCHAR(50),
    status               VARCHAR(50),
    priority             VARCHAR(20),
    assigned_to_id       UUID          REFERENCES users(id) ON DELETE SET NULL,
    expected_value       DECIMAL(15,2),
    probability          INT,
    notes                TEXT,
    custom_fields        JSONB         DEFAULT '{}',
    converted_at         TIMESTAMP,
    converted_to_party_id UUID,
    created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),
    updated_by           VARCHAR(100),
    version              BIGINT        DEFAULT 0
);

CREATE TABLE IF NOT EXISTS followups (
    id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id      UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    lead_id          UUID        REFERENCES crm_leads(id) ON DELETE CASCADE,
    party_id         UUID        REFERENCES parties(id) ON DELETE CASCADE,
    follow_up_date   DATE,
    follow_up_time   TIME,
    type             VARCHAR(20),
    status           VARCHAR(20) DEFAULT 'PENDING',
    notes            TEXT,
    completed_at     TIMESTAMP,
    completed_by_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Tenant + soft-delete indexes on all main tables
CREATE INDEX IF NOT EXISTS idx_businesses_business_id_deleted ON businesses(business_id, deleted);
CREATE INDEX IF NOT EXISTS idx_parties_business_id_deleted ON parties(business_id, deleted);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_business_id_deleted ON ledger_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_ledger_balances_business_id ON ledger_balances(business_id);
CREATE INDEX IF NOT EXISTS idx_categories_business_id ON categories(business_id);
CREATE INDEX IF NOT EXISTS idx_brands_business_id ON brands(business_id);
CREATE INDEX IF NOT EXISTS idx_units_business_id ON units(business_id);
CREATE INDEX IF NOT EXISTS idx_items_business_id ON items(business_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_business_id ON warehouses(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_id ON stock_movements(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_business_id ON invoice_items(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_business_id ON employees(business_id);
CREATE INDEX IF NOT EXISTS idx_attendance_business_id ON attendance(business_id);
CREATE INDEX IF NOT EXISTS idx_leaves_business_id ON leaves(business_id);
CREATE INDEX IF NOT EXISTS idx_salaries_business_id ON salaries(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_business_id ON crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_followups_business_id ON followups(business_id);

-- Parties indexes
CREATE INDEX IF NOT EXISTS idx_parties_business_id_phone ON parties(business_id, phone);
CREATE INDEX IF NOT EXISTS idx_parties_business_id_type ON parties(business_id, type);
CREATE INDEX IF NOT EXISTS idx_parties_business_id_name ON parties(business_id, name);

-- Ledger entries indexes
CREATE INDEX IF NOT EXISTS idx_ledger_entries_business_id_party ON ledger_entries(business_id, party_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_business_id_date ON ledger_entries(business_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_business_id_txn_type ON ledger_entries(business_id, transaction_type);

-- Ledger balances unique index on business + party
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_balances_business_party ON ledger_balances(business_id, party_id);

-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_business_id_sku ON items(business_id, sku);
CREATE INDEX IF NOT EXISTS idx_items_business_id_barcode ON items(business_id, barcode);
CREATE INDEX IF NOT EXISTS idx_items_business_id_category ON items(business_id, category_id);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_business_item_warehouse ON inventory(business_id, item_id, warehouse_id);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_id_item ON stock_movements(business_id, item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(business_id, reference_type, reference_id);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_business_id_invoice_no ON invoices(business_id, invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id_party ON invoices(business_id, party_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id_date ON invoices(business_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id_status ON invoices(business_id, status);

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Salaries indexes
CREATE INDEX IF NOT EXISTS idx_salaries_business_employee_month_year ON salaries(business_id, employee_id, month, year);

-- Sync indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_business_entity_status ON sync_logs(business_id, entity_type, status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_device_status ON sync_logs(device_id, status);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_entity ON audit_logs(business_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_actor ON audit_logs(business_id, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_timestamp ON audit_logs(business_id, timestamp);

-- Refresh tokens index
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Business users index
CREATE INDEX IF NOT EXISTS idx_business_users_user_business ON business_users(user_id, business_id);

-- Unique indexes for catalogue
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_business_id_name ON categories(business_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_business_id_name ON brands(business_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_business_id_short_name ON units(business_id, short_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_business_id_code ON warehouses(business_id, code);
