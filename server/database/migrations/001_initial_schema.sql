

BEGIN;

-- =====================================================
-- 1. USERS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,

    preferred_language VARCHAR(5) NOT NULL DEFAULT 'vi'
        CHECK (preferred_language IN ('vi', 'en', 'th', 'lo')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email_lower
ON users (LOWER(email));


-- =====================================================
-- 2. CATEGORIES
-- =====================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,

    type VARCHAR(10) NOT NULL
        CHECK (type IN ('income', 'expense')),

    color VARCHAR(7),
    icon VARCHAR(50),

    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_categories_user_id
        UNIQUE (user_id, id)
);

CREATE UNIQUE INDEX idx_categories_user_name_type
ON categories (user_id, LOWER(name), type);


-- =====================================================
-- 3. PAYMENT METHODS
-- =====================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,

    type VARCHAR(30) NOT NULL
        CHECK (type IN (
            'cash',
            'bank_transfer',
            'credit_card',
            'debit_card',
            'e_wallet',
            'other'
        )),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_methods_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_payment_methods_user_id
        UNIQUE (user_id, id)
);

CREATE UNIQUE INDEX idx_payment_methods_user_name
ON payment_methods (user_id, LOWER(name));


-- =====================================================
-- 4. RECURRING TRANSACTIONS
-- =====================================================

CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    payment_method_id UUID,

    type VARCHAR(10) NOT NULL
        CHECK (type IN ('income', 'expense')),

    amount NUMERIC(15,2) NOT NULL
        CHECK (amount > 0),

    description TEXT,

    frequency VARCHAR(20) NOT NULL
        CHECK (frequency IN (
            'daily',
            'weekly',
            'monthly',
            'yearly'
        )),

    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_recurring_dates
        CHECK (end_date IS NULL OR end_date >= start_date),

    CONSTRAINT fk_recurring_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recurring_category
        FOREIGN KEY (user_id, category_id)
        REFERENCES categories(user_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_recurring_payment_method
        FOREIGN KEY (user_id, payment_method_id)
        REFERENCES payment_methods(user_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_recurring_user_id
        UNIQUE (user_id, id)
);

CREATE INDEX idx_recurring_next_due
ON recurring_transactions (next_due_date)
WHERE is_active = TRUE;


-- =====================================================
-- 5. TRANSACTIONS
-- =====================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    payment_method_id UUID,

    type VARCHAR(10) NOT NULL
        CHECK (type IN ('income', 'expense')),

    amount NUMERIC(15,2) NOT NULL
        CHECK (amount > 0),

    description TEXT,

    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

    recurring_id UUID,
    recurring_occurrence_date DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_transaction_recurring
        CHECK (
            (recurring_id IS NULL AND recurring_occurrence_date IS NULL)
            OR
            (recurring_id IS NOT NULL AND recurring_occurrence_date IS NOT NULL)
        ),

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transactions_category
        FOREIGN KEY (user_id, category_id)
        REFERENCES categories(user_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transactions_payment_method
        FOREIGN KEY (user_id, payment_method_id)
        REFERENCES payment_methods(user_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transactions_recurring
        FOREIGN KEY (user_id, recurring_id)
        REFERENCES recurring_transactions(user_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_recurring_occurrence
        UNIQUE (recurring_id, recurring_occurrence_date)
);

CREATE INDEX idx_transactions_user_date
ON transactions (user_id, transaction_date DESC)
WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_user_type
ON transactions (user_id, type)
WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_user_category
ON transactions (user_id, category_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_user_amount
ON transactions (user_id, amount)
WHERE deleted_at IS NULL;


-- =====================================================
-- 6. REFRESH TOKENS
-- =====================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user
ON refresh_tokens (user_id);


-- =====================================================
-- 7. PASSWORD RESET TOKENS
-- =====================================================

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_user
ON password_reset_tokens (user_id);


-- =====================================================
-- MIGRATION COMPLETED
-- =====================================================

COMMIT;
