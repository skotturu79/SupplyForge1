-- ══════════════════════════════════════════════════════════════════
-- SupplyForge PostgreSQL Init Script
-- Run automatically on first container start
-- ══════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for trigram text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Row-Level Security helpers ─────────────────────────────────────
-- The API sets: SET LOCAL app.tenant_id = '<uuid>'
-- RLS policies use current_setting('app.tenant_id') to filter rows.
-- Prisma's withTenant() wraps queries in a transaction and sets this.

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
  SELECT COALESCE(
    current_setting('app.tenant_id', true)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE SQL STABLE;

-- ── Test DB for CI ────────────────────────────────────────────────
CREATE DATABASE supplyforge_test
  OWNER supplyforge
  ENCODING 'UTF8';
