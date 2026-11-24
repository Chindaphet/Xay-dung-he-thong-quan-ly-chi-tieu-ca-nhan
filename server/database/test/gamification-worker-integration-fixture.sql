
-- =====================================================
-- Gamification Worker Integration Test Fixture
-- Production-aligned schema for isolated CI database.
--
-- IMPORTANT:
-- Use only with the dedicated CI test database:
-- personal_expense_test
--
-- This fixture is independent of legacy migrations.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =====================================================
-- 1. USERS
-- =====================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'vi'
        CHECK (preferred_language IN ('vi', 'en', 'th', 'lo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 2. CATEGORIES
-- =====================================================

CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL
        CHECK (type IN ('income', 'expense')),
    color VARCHAR(20),
    icon VARCHAR(50),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, name, type),
    UNIQUE (category_id, user_id),
    UNIQUE (user_id, category_id)
);


-- =====================================================
-- 3. PAYMENT METHODS
-- =====================================================

CREATE TABLE payment_methods (
    payment_method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL
        CHECK (
            type IN (
                'cash',
                'bank_transfer',
                'credit_card',
                'debit_card',
                'e_wallet',
                'other'
            )
        ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, payment_method_id),
    UNIQUE (user_id, name)
);


-- =====================================================
-- 4. RECURRING TRANSACTIONS
-- =====================================================

CREATE TABLE recurring_transactions (
    recurring_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(user_id) ON DELETE CASCADE,
    category_id UUID NOT NULL,
    payment_method_id UUID,
    type VARCHAR(10) NOT NULL
        CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL
        CHECK (amount > 0),
    description TEXT,
    frequency VARCHAR(20) NOT NULL
        CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_test_recurring_dates
        CHECK (end_date IS NULL OR end_date >= start_date),

    CONSTRAINT fk_test_recurring_user_category
        FOREIGN KEY (user_id, category_id)
        REFERENCES categories(user_id, category_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_test_recurring_user_payment_method
        FOREIGN KEY (user_id, payment_method_id)
        REFERENCES payment_methods(user_id, payment_method_id)
        ON DELETE RESTRICT,

    UNIQUE (user_id, recurring_id)
);


-- =====================================================
-- 5. TRANSACTIONS
-- =====================================================

CREATE TABLE transactions (
    transactions_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(user_id) ON DELETE CASCADE,
    category_id UUID NOT NULL,
    payment_method_id UUID,
    type VARCHAR(10) NOT NULL
        CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL
        CHECK (amount > 0),
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recurring_id UUID,
    recurring_occurrence_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_test_transactions_user_category
        FOREIGN KEY (user_id, category_id)
        REFERENCES categories(user_id, category_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_test_transactions_user_payment_method
        FOREIGN KEY (user_id, payment_method_id)
        REFERENCES payment_methods(user_id, payment_method_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_test_transactions_user_recurring
        FOREIGN KEY (user_id, recurring_id)
        REFERENCES recurring_transactions(user_id, recurring_id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_test_transaction_recurring
        CHECK (
            (recurring_id IS NULL AND recurring_occurrence_date IS NULL)
            OR
            (recurring_id IS NOT NULL AND recurring_occurrence_date IS NOT NULL)
        ),

    UNIQUE (recurring_id, recurring_occurrence_date)
);

CREATE INDEX idx_test_transactions_user
    ON transactions (user_id, transaction_date DESC);


-- =====================================================
-- 6. GAMIFICATION EVENTS
-- =====================================================

CREATE TABLE gamification_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Production FK: NO ON DELETE CASCADE.
    user_id UUID NOT NULL
        REFERENCES users(user_id),

    event_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    event_key VARCHAR(150) NOT NULL UNIQUE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'processed', 'failed')),

    attempts INTEGER NOT NULL DEFAULT 0
        CHECK (attempts >= 0),

    available_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    lease_token UUID,
    lease_expires_at TIMESTAMPTZ
);

CREATE INDEX idx_test_gamification_events_pending
    ON gamification_events (status, available_at);

CREATE INDEX idx_test_gamification_events_user
    ON gamification_events (user_id, created_at DESC);


-- =====================================================
-- 7. USER GAMIFICATION
-- =====================================================

CREATE TABLE user_gamification (
    user_gamification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE
        REFERENCES users(user_id) ON DELETE CASCADE,

    total_points INTEGER NOT NULL DEFAULT 0
        CHECK (total_points >= 0),

    current_level INTEGER NOT NULL DEFAULT 1
        CHECK (current_level >= 1),

    current_streak INTEGER NOT NULL DEFAULT 0
        CHECK (current_streak >= 0),

    longest_streak INTEGER NOT NULL DEFAULT 0
        CHECK (longest_streak >= 0),

    last_activity_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 8. GAMIFICATION POINT LOGS
-- =====================================================

CREATE TABLE gamification_point_logs (
    point_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(user_id) ON DELETE CASCADE,

    points_change INTEGER NOT NULL
        CHECK (points_change > 0),

    event_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_gamification_point_logs_user
    ON gamification_point_logs (user_id, created_at DESC);


-- =====================================================
-- 9. ACHIEVEMENTS
-- =====================================================

CREATE TABLE achievements (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,

    points_reward INTEGER NOT NULL DEFAULT 0
        CHECK (points_reward >= 0),

    requirement_type VARCHAR(50) NOT NULL,

    requirement_value INTEGER NOT NULL DEFAULT 1
        CHECK (requirement_value >= 1),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 10. USER ACHIEVEMENTS
-- =====================================================

CREATE TABLE user_achievements (
    user_achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    achievement_id UUID NOT NULL
        REFERENCES achievements(achievement_id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(user_id) ON DELETE CASCADE,

    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, achievement_id)
);


-- =====================================================
-- 11. CHALLENGES
-- =====================================================

CREATE TABLE challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,

    requirement_value INTEGER NOT NULL DEFAULT 1
        CHECK (requirement_value >= 1),

    points_reward INTEGER NOT NULL DEFAULT 0
        CHECK (points_reward >= 0),

    start_date DATE,
    end_date DATE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_test_challenge_dates
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        )
);


-- =====================================================
-- 12. USER CHALLENGES
-- =====================================================

CREATE TABLE user_challenges (
    user_challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    challenge_id UUID NOT NULL
        REFERENCES challenges(challenge_id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(user_id) ON DELETE CASCADE,

    current_progress INTEGER NOT NULL DEFAULT 0
        CHECK (current_progress >= 0),

    status VARCHAR(30) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'expired')),

    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,

    UNIQUE (user_id, challenge_id)
);


-- =====================================================
-- 13. USER CHALLENGE EVENTS
-- =====================================================

CREATE TABLE user_challenge_events (
    user_challenge_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_challenge_id UUID NOT NULL
        REFERENCES user_challenges(user_challenge_id) ON DELETE CASCADE,

    event_id UUID NOT NULL
        REFERENCES gamification_events(event_id) ON DELETE CASCADE,

    progress_amount INTEGER NOT NULL DEFAULT 1
        CHECK (progress_amount > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_challenge_id, event_id)
);
