--
-- PostgreSQL database dump
--

\restrict FGFBSgRIBe1pKSRusSxZaG3DgUzFKx3J5KLL7e1JrV2UIy7Quvoxzb4IxdUhc6f

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    achievement_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL,
    icon character varying(100) NOT NULL,
    points_reward integer DEFAULT 0 NOT NULL,
    requirement_type character varying(50) NOT NULL,
    requirement_value integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_achievement_points CHECK ((points_reward >= 0)),
    CONSTRAINT ck_achievement_requirement CHECK ((requirement_value >= 1))
);


--
-- Name: budget_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_categories (
    budget_category_id uuid DEFAULT gen_random_uuid() NOT NULL,
    budget_id uuid NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_budget_categories_amount CHECK ((amount > (0)::numeric))
);


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    budget_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    budget_month date NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_budgets_month CHECK ((EXTRACT(day FROM budget_month) = (1)::numeric)),
    CONSTRAINT chk_budgets_total_amount CHECK ((total_amount > (0)::numeric))
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    category_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(10) NOT NULL,
    color character varying(7),
    icon character varying(50),
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_type CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    challenge_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    description text NOT NULL,
    challenge_type character varying(50) NOT NULL,
    requirement_value integer DEFAULT 1 NOT NULL,
    points_reward integer DEFAULT 0 NOT NULL,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_challenge_dates CHECK (((end_date IS NULL) OR (start_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT ck_challenge_points CHECK ((points_reward >= 0)),
    CONSTRAINT ck_challenge_requirement CHECK ((requirement_value >= 1))
);


--
-- Name: gamification_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gamification_events (
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    reference_id uuid,
    event_key character varying(150) NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    lease_token uuid,
    lease_expires_at timestamp with time zone,
    CONSTRAINT ck_attempts CHECK ((attempts >= 0)),
    CONSTRAINT ck_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'processed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: gamification_point_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gamification_point_logs (
    point_log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points_change integer NOT NULL,
    event_type character varying(50) NOT NULL,
    reference_id uuid,
    idempotency_key character varying(150) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_point_logs_points CHECK ((points_change > 0))
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    password_reset_token_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    payment_method_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_type CHECK (((type)::text = ANY ((ARRAY['cash'::character varying, 'bank_transfer'::character varying, 'credit_card'::character varying, 'debit_card'::character varying, 'e_wallet'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: recurring_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_transactions (
    recurring_id uuid DEFAULT gen_random_uuid() CONSTRAINT recurring_transactions_transactions_id_not_null NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    payment_method_id uuid,
    type character varying(10) NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text,
    frequency character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    next_due_date date NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_amount CHECK ((amount > (0)::numeric)),
    CONSTRAINT ck_frequency CHECK (((frequency)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[]))),
    CONSTRAINT ck_recurring_dates CHECK (((end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT ck_type CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    refresh_token_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    transactions_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    payment_method_id uuid,
    type character varying(10) NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text,
    transaction_date date DEFAULT CURRENT_DATE NOT NULL,
    recurring_id uuid,
    recurring_occurrence_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT ck_amount CHECK ((amount > (0)::numeric)),
    CONSTRAINT ck_transaction_recurring CHECK ((((recurring_id IS NULL) AND (recurring_occurrence_date IS NULL)) OR ((recurring_id IS NOT NULL) AND (recurring_occurrence_date IS NOT NULL)))),
    CONSTRAINT ck_type CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
);


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    user_achievement_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_challenge_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_challenge_events (
    user_challenge_event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_challenge_id uuid NOT NULL,
    event_id uuid NOT NULL,
    progress_amount integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_progress_amount CHECK ((progress_amount > 0))
);


--
-- Name: user_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_challenges (
    user_challenge_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    current_progress integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'in_progress'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT ck_user_challenge_progress CHECK ((current_progress >= 0)),
    CONSTRAINT ck_user_challenge_status CHECK (((status)::text = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: user_gamification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_gamification (
    user_gamification_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    current_level integer DEFAULT 1 NOT NULL,
    current_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    last_activity_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_gamification_current_streak CHECK ((current_streak >= 0)),
    CONSTRAINT ck_gamification_level CHECK ((current_level >= 1)),
    CONSTRAINT ck_gamification_longest_streak CHECK ((longest_streak >= 0)),
    CONSTRAINT ck_gamification_points CHECK ((total_points >= 0))
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    setting_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    theme character varying(20) DEFAULT 'system'::character varying NOT NULL,
    currency character varying(10) DEFAULT 'VND'::character varying NOT NULL,
    number_format character varying(20) DEFAULT 'vi-VN'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_user_settings_currency CHECK (((currency)::text = ANY ((ARRAY['VND'::character varying, 'USD'::character varying, 'THB'::character varying])::text[]))),
    CONSTRAINT ck_user_settings_number_format CHECK (((number_format)::text = ANY ((ARRAY['vi-VN'::character varying, 'en-US'::character varying])::text[]))),
    CONSTRAINT ck_user_settings_theme CHECK (((theme)::text = ANY ((ARRAY['light'::character varying, 'dark'::character varying, 'system'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() CONSTRAINT users_users_id_not_null NOT NULL,
    username character varying(50) CONSTRAINT users_full_name_not_null NOT NULL,
    full_name character varying(100) CONSTRAINT users_email_not_null NOT NULL,
    email character varying(255) CONSTRAINT users_password_hash_not_null NOT NULL,
    password_hash text CONSTRAINT users_preferred_language_not_null NOT NULL,
    preferred_language character varying(5) DEFAULT 'vi'::character varying CONSTRAINT users_preferred_language_not_null1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_preferred_language CHECK (((preferred_language)::text = ANY ((ARRAY['vi'::character varying, 'en'::character varying, 'th'::character varying, 'lo'::character varying])::text[])))
);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (achievement_id);


--
-- Name: budget_categories budget_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_pkey PRIMARY KEY (budget_category_id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (budget_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (challenge_id);


--
-- Name: gamification_events gamification_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_events
    ADD CONSTRAINT gamification_events_pkey PRIMARY KEY (event_id);


--
-- Name: gamification_point_logs gamification_point_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_point_logs
    ADD CONSTRAINT gamification_point_logs_pkey PRIMARY KEY (point_log_id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (password_reset_token_id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (payment_method_id);


--
-- Name: recurring_transactions recurring_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_pkey PRIMARY KEY (recurring_id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (refresh_token_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transactions_id);


--
-- Name: achievements uq_achievements_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT uq_achievements_name UNIQUE (name);


--
-- Name: budget_categories uq_budget_categories_category; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT uq_budget_categories_category UNIQUE (budget_id, category_id);


--
-- Name: budgets uq_budgets_id_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT uq_budgets_id_user UNIQUE (budget_id, user_id);


--
-- Name: budgets uq_budgets_user_month; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT uq_budgets_user_month UNIQUE (user_id, budget_month);


--
-- Name: categories uq_categories_id_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT uq_categories_id_user UNIQUE (category_id, user_id);


--
-- Name: categories uq_categories_user_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT uq_categories_user_id UNIQUE (user_id, category_id);


--
-- Name: categories uq_categories_user_name_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT uq_categories_user_name_type UNIQUE (user_id, name, type);


--
-- Name: gamification_events uq_event_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_events
    ADD CONSTRAINT uq_event_key UNIQUE (event_key);


--
-- Name: gamification_point_logs uq_idempotency_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_point_logs
    ADD CONSTRAINT uq_idempotency_key UNIQUE (idempotency_key);


--
-- Name: password_reset_tokens uq_password_reset_token_hash; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT uq_password_reset_token_hash UNIQUE (token_hash);


--
-- Name: payment_methods uq_payment_methods_user_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT uq_payment_methods_user_id UNIQUE (user_id, payment_method_id);


--
-- Name: payment_methods uq_payment_methods_user_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT uq_payment_methods_user_name UNIQUE (user_id, name);


--
-- Name: transactions uq_recurring_occurrence; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT uq_recurring_occurrence UNIQUE (recurring_id, recurring_occurrence_date);


--
-- Name: recurring_transactions uq_recurring_user_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT uq_recurring_user_id UNIQUE (user_id, recurring_id);


--
-- Name: refresh_tokens uq_refresh_tokens_token_hash; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash);


--
-- Name: user_achievements uq_user_achievement; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id);


--
-- Name: user_challenges uq_user_challenge; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT uq_user_challenge UNIQUE (user_id, challenge_id);


--
-- Name: user_challenge_events uq_user_challenge_event; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenge_events
    ADD CONSTRAINT uq_user_challenge_event UNIQUE (user_challenge_id, event_id);


--
-- Name: users uq_user_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_user_email UNIQUE (email);


--
-- Name: user_gamification uq_user_gamification_users; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT uq_user_gamification_users UNIQUE (user_id);


--
-- Name: user_settings uq_user_settings_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT uq_user_settings_user UNIQUE (user_id);


--
-- Name: users uq_users_username; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_username UNIQUE (username);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (user_achievement_id);


--
-- Name: user_challenge_events user_challenge_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenge_events
    ADD CONSTRAINT user_challenge_events_pkey PRIMARY KEY (user_challenge_event_id);


--
-- Name: user_challenges user_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT user_challenges_pkey PRIMARY KEY (user_challenge_id);


--
-- Name: user_gamification user_gamification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT user_gamification_pkey PRIMARY KEY (user_gamification_id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (setting_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_budget_categories_budget; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_categories_budget ON public.budget_categories USING btree (budget_id);


--
-- Name: idx_budget_categories_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_categories_category ON public.budget_categories USING btree (category_id);


--
-- Name: idx_budgets_user_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budgets_user_month ON public.budgets USING btree (user_id, budget_month);


--
-- Name: idx_gamification_events_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gamification_events_pending ON public.gamification_events USING btree (status, available_at);


--
-- Name: idx_gamification_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gamification_events_user ON public.gamification_events USING btree (user_id, created_at DESC);


--
-- Name: idx_gamification_point_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gamification_point_logs_user ON public.gamification_point_logs USING btree (user_id, created_at DESC);


--
-- Name: idx_recurring_user_next_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_user_next_due ON public.recurring_transactions USING btree (user_id, next_due_date) WITH (deduplicate_items='true');


--
-- Name: idx_transactions_budget_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_budget_lookup ON public.transactions USING btree (user_id, category_id, transaction_date) WHERE ((deleted_at IS NULL) AND ((type)::text = 'expense'::text));


--
-- Name: idx_transactions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_category ON public.transactions USING btree (category_id) WITH (deduplicate_items='true');


--
-- Name: idx_transactions_payment_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_payment_method ON public.transactions USING btree (payment_method_id) WITH (deduplicate_items='true');


--
-- Name: idx_transactions_recurring; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_recurring ON public.transactions USING btree (recurring_id) WITH (deduplicate_items='true');


--
-- Name: idx_transactions_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_user_date ON public.transactions USING btree (user_id, transaction_date) WITH (deduplicate_items='true');


--
-- Name: idx_transactions_user_type_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_user_type_date ON public.transactions USING btree (user_id, type, transaction_date) WITH (deduplicate_items='true');


--
-- Name: idx_user_challenge_events_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_challenge_events_event ON public.user_challenge_events USING btree (event_id);


--
-- Name: budget_categories fk_budget_categories_budget_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT fk_budget_categories_budget_user FOREIGN KEY (budget_id, user_id) REFERENCES public.budgets(budget_id, user_id) ON DELETE CASCADE;


--
-- Name: budget_categories fk_budget_categories_category_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT fk_budget_categories_category_user FOREIGN KEY (category_id, user_id) REFERENCES public.categories(category_id, user_id) ON DELETE RESTRICT;


--
-- Name: budgets fk_budgets_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: categories fk_categories_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: gamification_events fk_gamification_event_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_events
    ADD CONSTRAINT fk_gamification_event_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_challenge_events fk_gamification_events; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenge_events
    ADD CONSTRAINT fk_gamification_events FOREIGN KEY (event_id) REFERENCES public.gamification_events(event_id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens fk_password_reset_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: payment_methods fk_payment_methods_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT fk_payment_methods_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: gamification_point_logs fk_point_logs_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_point_logs
    ADD CONSTRAINT fk_point_logs_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: recurring_transactions fk_recurring_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: recurring_transactions fk_recurring_user_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fk_recurring_user_category FOREIGN KEY (user_id, category_id) REFERENCES public.categories(user_id, category_id) ON DELETE RESTRICT;


--
-- Name: recurring_transactions fk_recurring_user_payment_method; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fk_recurring_user_payment_method FOREIGN KEY (user_id, payment_method_id) REFERENCES public.payment_methods(user_id, payment_method_id) ON DELETE RESTRICT;


--
-- Name: refresh_tokens fk_refresh_tokens_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: transactions fk_transactions_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: transactions fk_transactions_user_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_user_category FOREIGN KEY (user_id, category_id) REFERENCES public.categories(user_id, category_id) ON DELETE RESTRICT;


--
-- Name: transactions fk_transactions_user_payment_method; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_user_payment_method FOREIGN KEY (user_id, payment_method_id) REFERENCES public.payment_methods(user_id, payment_method_id) ON DELETE RESTRICT;


--
-- Name: transactions fk_transactions_user_recurring; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_user_recurring FOREIGN KEY (user_id, recurring_id) REFERENCES public.recurring_transactions(user_id, recurring_id) ON DELETE RESTRICT;


--
-- Name: user_achievements fk_user_achievements_achievement; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES public.achievements(achievement_id) ON DELETE CASCADE;


--
-- Name: user_achievements fk_user_achievements_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_challenge_events fk_user_challenges; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenge_events
    ADD CONSTRAINT fk_user_challenges FOREIGN KEY (user_challenge_id) REFERENCES public.user_challenges(user_challenge_id) ON DELETE CASCADE;


--
-- Name: user_challenges fk_user_challenges_challenge; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT fk_user_challenges_challenge FOREIGN KEY (challenge_id) REFERENCES public.challenges(challenge_id) ON DELETE CASCADE;


--
-- Name: user_challenges fk_user_challenges_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT fk_user_challenges_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_gamification fk_user_gamification_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT fk_user_gamification_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_settings fk_user_settings_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FGFBSgRIBe1pKSRusSxZaG3DgUzFKx3J5KLL7e1JrV2UIy7Quvoxzb4IxdUhc6f

