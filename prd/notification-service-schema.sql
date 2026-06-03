-- Notification Service Database Schema
-- Database: PostgreSQL
-- Generated for: LLM Context / Production Documentation

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notifications Table
-- Core entity representing a message sent to a user.
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., 'ORDER_CREATED', 'PAYMENT_FAILED'
    priority VARCHAR(20) NOT NULL, -- 'CRITICAL', 'HIGH', 'BULK'
    subject VARCHAR(500),
    content TEXT,
    metadata JSONB, -- { "orderId": "...", "amount": "..." }
    scheduled_at TIMESTAMP,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notification Channels Table
-- Tracks delivery status per channel for each notification.
CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL, -- 'EMAIL', 'SMS', 'PUSH', 'IN_APP'
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED', 'RETRYING'
    sent_at TIMESTAMP,
    failure_reason TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Processed Messages Table
-- Idempotency table to prevent duplicate processing of the same RabbitMQ message.
CREATE TABLE IF NOT EXISTS processed_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notification Templates Table
-- Stores dynamic message templates with Handlebars placeholders.
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(type, channel)
);

-- Notification Preferences Table
-- Stores user-specific opt-in/out settings.
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_channels_notification_id ON notification_channels(notification_id);
CREATE INDEX IF NOT EXISTS idx_channels_status ON notification_channels(status) WHERE status IN ('PENDING', 'RETRYING');
CREATE INDEX IF NOT EXISTS idx_processed_messages_message_id ON processed_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON notification_preferences(user_id);

-- Comments
COMMENT ON TABLE notifications IS 'Core notification data and read status.';
COMMENT ON TABLE notification_channels IS 'Delivery tracking for each communication medium.';
COMMENT ON TABLE processed_messages IS 'Idempotency tracking for RabbitMQ events.';
COMMENT ON TABLE notification_templates IS 'Dynamic content templates with Handlebars support.';
COMMENT ON TABLE notification_preferences IS 'User-specific delivery settings and marketing opt-ins.';
