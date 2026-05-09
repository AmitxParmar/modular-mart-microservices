-- User Service Database Schema
-- Database: PostgreSQL (NeonDB)
-- Generated for: LLM Context / Production Documentation

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., 'CUSTOMER', 'SELLER', 'ADMIN'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users Table
-- Integration with Clerk handles authentication; this table stores profile and metadata.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE, -- Primary identifier from Clerk
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User-Roles Join Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Comments
COMMENT ON TABLE users IS 'Stores user profile information synced from Clerk and local metadata.';
COMMENT ON COLUMN users.clerk_id IS 'Unique identifier provided by Clerk Auth.';
COMMENT ON TABLE roles IS 'Defines access control levels (CUSTOMER, SELLER, ADMIN).';
COMMENT ON TABLE addresses IS 'User shipping and billing addresses.';
