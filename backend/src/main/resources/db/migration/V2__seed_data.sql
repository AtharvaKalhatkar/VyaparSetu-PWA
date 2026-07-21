-- ============================================================
-- Migration V2: Seed Data
-- Vyapar Setu - PostgreSQL 15+ Compatible
-- ============================================================

-- ============================================================
-- DEFAULT ROLES
-- ============================================================

INSERT INTO roles (id, name, description)
SELECT gen_random_uuid(), v.name, v.description
FROM (VALUES
    ('OWNER',          'Full system access – business owner'),
    ('ADMIN',          'Administrative access with most permissions'),
    ('MANAGER',        'Can manage day-to-day operations'),
    ('SALESMAN',       'Can create invoices and manage sales'),
    ('CASHIER',        'Can handle payments and receipts'),
    ('ACCOUNTANT',     'Can manage ledger, expenses, and reports'),
    ('DELIVERY_BOY',   'Can view delivery-related information'),
    ('WAREHOUSE_STAFF','Can manage inventory and stock movements'),
    ('SUPERVISOR',     'Can oversee operations and approve requests'),
    ('VIEWER',         'Read-only access to reports and data')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.name = v.name);

-- ============================================================
-- DEFAULT PERMISSIONS
-- ============================================================

-- Resources: business, user, party, item, invoice, ledger, expense,
--            employee, report, setting, crm, notification

-- Action types: CREATE, READ, UPDATE, DELETE, EXPORT, REPORTS, SETTINGS

INSERT INTO permissions (id, name, resource, action, description)
SELECT gen_random_uuid(), v.name, v.resource, v.action, v.description
FROM (VALUES
    -- Business
    ('BUSINESS_CREATE',  'business', 'CREATE',  'Create business'),
    ('BUSINESS_READ',    'business', 'READ',    'View business details'),
    ('BUSINESS_UPDATE',  'business', 'UPDATE',  'Update business details'),
    ('BUSINESS_DELETE',  'business', 'DELETE',  'Delete business'),
    ('BUSINESS_EXPORT',  'business', 'EXPORT',  'Export business data'),
    ('BUSINESS_SETTINGS','business', 'SETTINGS','Configure business settings'),

    -- User
    ('USER_CREATE',  'user', 'CREATE',  'Create users'),
    ('USER_READ',    'user', 'READ',    'View users'),
    ('USER_UPDATE',  'user', 'UPDATE',  'Update users'),
    ('USER_DELETE',  'user', 'DELETE',  'Delete users'),
    ('USER_EXPORT',  'user', 'EXPORT',  'Export user data'),

    -- Party (Customer/Supplier)
    ('PARTY_CREATE',  'party', 'CREATE',  'Create parties'),
    ('PARTY_READ',    'party', 'READ',    'View parties'),
    ('PARTY_UPDATE',  'party', 'UPDATE',  'Update parties'),
    ('PARTY_DELETE',  'party', 'DELETE',  'Delete parties'),
    ('PARTY_EXPORT',  'party', 'EXPORT',  'Export party data'),

    -- Item
    ('ITEM_CREATE',  'item', 'CREATE',  'Create items'),
    ('ITEM_READ',    'item', 'READ',    'View items'),
    ('ITEM_UPDATE',  'item', 'UPDATE',  'Update items'),
    ('ITEM_DELETE',  'item', 'DELETE',  'Delete items'),
    ('ITEM_EXPORT',  'item', 'EXPORT',  'Export item data'),

    -- Invoice
    ('INVOICE_CREATE',  'invoice', 'CREATE',  'Create invoices'),
    ('INVOICE_READ',    'invoice', 'READ',    'View invoices'),
    ('INVOICE_UPDATE',  'invoice', 'UPDATE',  'Update invoices'),
    ('INVOICE_DELETE',  'invoice', 'DELETE',  'Delete invoices'),
    ('INVOICE_EXPORT',  'invoice', 'EXPORT',  'Export invoices'),

    -- Ledger
    ('LEDGER_CREATE',  'ledger', 'CREATE',  'Create ledger entries'),
    ('LEDGER_READ',    'ledger', 'READ',    'View ledger'),
    ('LEDGER_UPDATE',  'ledger', 'UPDATE',  'Update ledger entries'),
    ('LEDGER_DELETE',  'ledger', 'DELETE',  'Delete ledger entries'),
    ('LEDGER_EXPORT',  'ledger', 'EXPORT',  'Export ledger data'),

    -- Expense
    ('EXPENSE_CREATE',  'expense', 'CREATE',  'Create expenses'),
    ('EXPENSE_READ',    'expense', 'READ',    'View expenses'),
    ('EXPENSE_UPDATE',  'expense', 'UPDATE',  'Update expenses'),
    ('EXPENSE_DELETE',  'expense', 'DELETE',  'Delete expenses'),
    ('EXPENSE_EXPORT',  'expense', 'EXPORT',  'Export expenses'),

    -- Employee
    ('EMPLOYEE_CREATE',  'employee', 'CREATE',  'Create employees'),
    ('EMPLOYEE_READ',    'employee', 'READ',    'View employees'),
    ('EMPLOYEE_UPDATE',  'employee', 'UPDATE',  'Update employees'),
    ('EMPLOYEE_DELETE',  'employee', 'DELETE',  'Delete employees'),
    ('EMPLOYEE_EXPORT',  'employee', 'EXPORT',  'Export employee data'),

    -- Report
    ('REPORT_READ',    'report', 'READ',    'View reports'),
    ('REPORT_EXPORT',  'report', 'EXPORT',  'Export reports'),

    -- Setting
    ('SETTING_READ',    'setting', 'READ',    'View settings'),
    ('SETTING_UPDATE',  'setting', 'UPDATE',  'Update settings'),

    -- CRM
    ('CRM_CREATE',  'crm', 'CREATE',  'Create leads'),
    ('CRM_READ',    'crm', 'READ',    'View leads'),
    ('CRM_UPDATE',  'crm', 'UPDATE',  'Update leads'),
    ('CRM_DELETE',  'crm', 'DELETE',  'Delete leads'),
    ('CRM_EXPORT',  'crm', 'EXPORT',  'Export CRM data'),

    -- Notification
    ('NOTIFICATION_READ',   'notification', 'READ',   'View notifications'),
    ('NOTIFICATION_SEND',   'notification', 'SEND',   'Send notifications'),
    ('NOTIFICATION_CONFIG', 'notification', 'SETTINGS','Configure notifications')
) AS v(name, resource, action, description)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.name = v.name);

-- ============================================================
-- ROLE-PERMISSION MAPPING
-- ============================================================

-- Helper: assign all permissions to a role
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'OWNER'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- ADMIN: all permissions
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'ADMIN'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- MANAGER: all except DELETE on core entities, full on business ops
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'MANAGER'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE p.name NOT IN (
    'BUSINESS_DELETE', 'USER_DELETE', 'USER_CREATE',
    'SETTING_UPDATE', 'SETTING_READ', 'NOTIFICATION_CONFIG'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- SALESMAN: party + item + invoice (CRUD), basic ledger read, notification read
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'SALESMAN'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE p.name IN (
    'PARTY_CREATE', 'PARTY_READ', 'PARTY_UPDATE',
    'ITEM_READ',
    'INVOICE_CREATE', 'INVOICE_READ', 'INVOICE_UPDATE',
    'LEDGER_READ',
    'NOTIFICATION_READ', 'NOTIFICATION_SEND'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- CASHIER: invoice read/update, ledger read/create, notification read
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'CASHIER'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE p.name IN (
    'INVOICE_READ', 'INVOICE_UPDATE',
    'LEDGER_CREATE', 'LEDGER_READ',
    'PARTY_READ',
    'NOTIFICATION_READ'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- ACCOUNTANT: full ledger, expense, report, invoice read, party read
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'ACCOUNTANT'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE p.name IN (
    'LEDGER_CREATE', 'LEDGER_READ', 'LEDGER_UPDATE', 'LEDGER_DELETE', 'LEDGER_EXPORT',
    'EXPENSE_CREATE', 'EXPENSE_READ', 'EXPENSE_UPDATE', 'EXPENSE_DELETE', 'EXPENSE_EXPORT',
    'REPORT_READ', 'REPORT_EXPORT',
    'INVOICE_READ', 'INVOICE_EXPORT',
    'PARTY_READ', 'PARTY_EXPORT',
    'NOTIFICATION_READ'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- DELIVERY_BOY: party read, invoice read, notification read
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'DELIVERY_BOY'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE p.name IN (
    'PARTY_READ',
    'INVOICE_READ',
    'NOTIFICATION_READ'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- WAREHOUSE_STAFF: item CRUD, inventory/stock, notification read
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'WAREHOUSE_STAFF'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE p.name IN (
    'ITEM_CREATE', 'ITEM_READ', 'ITEM_UPDATE', 'ITEM_EXPORT',
    'PARTY_READ',
    'INVOICE_READ',
    'NOTIFICATION_READ'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- SUPERVISOR: read on most entities, approve expenses, report read
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'SUPERVISOR'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE p.name IN (
    'BUSINESS_READ', 'BUSINESS_EXPORT',
    'USER_READ',
    'PARTY_READ', 'PARTY_EXPORT',
    'ITEM_READ', 'ITEM_EXPORT',
    'INVOICE_READ', 'INVOICE_EXPORT',
    'LEDGER_READ', 'LEDGER_EXPORT',
    'EXPENSE_READ', 'EXPENSE_EXPORT',
    'EMPLOYEE_READ',
    'REPORT_READ', 'REPORT_EXPORT',
    'CRM_READ', 'CRM_EXPORT',
    'NOTIFICATION_READ'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- VIEWER: read-only access to key entities and reports
WITH role_cte AS (
    SELECT id FROM roles WHERE name = 'VIEWER'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_cte r
CROSS JOIN permissions p
WHERE p.name IN (
    'BUSINESS_READ',
    'PARTY_READ',
    'ITEM_READ',
    'INVOICE_READ',
    'LEDGER_READ',
    'REPORT_READ',
    'NOTIFICATION_READ'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
