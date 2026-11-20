-- Minimal schema for the Gamification Worker shutdown test.
-- This fixture is used only by GitHub Actions.

-- Add the user_id column required by Gamification.
ALTER TABLE users
    ADD COLUMN user_id UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE users
    ADD CONSTRAINT uq_test_users_user_id UNIQUE (user_id);

-- Create the event queue used by the Gamification Worker.
CREATE TABLE gamification_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    event_key VARCHAR(150) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    lease_token UUID,
    lease_expires_at TIMESTAMPTZ,

    CONSTRAINT fk_gamification_event_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT uq_event_key
        UNIQUE (event_key),

    CONSTRAINT ck_attempts
        CHECK (attempts >= 0),

    CONSTRAINT ck_status
        CHECK (status IN ('pending', 'processing', 'processed', 'failed'))
);

CREATE INDEX idx_gamification_events_pending
    ON gamification_events (status, available_at);

CREATE INDEX idx_gamification_events_user
    ON gamification_events (user_id, created_at DESC);
