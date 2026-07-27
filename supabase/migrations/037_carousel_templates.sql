-- ============================================================
-- Migration: Add carousel template support
-- ============================================================

-- Add cards column to store CAROUSEL cards structure
ALTER TABLE message_templates
  ADD COLUMN IF NOT EXISTS cards JSONB;

-- Add CAROUSEL to the allowed header types.
-- Since header_type is constrained by a CHECK constraint, we must drop and recreate the constraint.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'message_templates'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%header_type%text%image%video%document%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE message_templates DROP CONSTRAINT ' || quote_ident(conname)
      FROM pg_constraint c
      WHERE c.conrelid = 'message_templates'::regclass
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%header_type%text%image%video%document%'
      LIMIT 1
    );
  END IF;
END $$;

-- Re-add the check constraint with CAROUSEL included
ALTER TABLE message_templates
  ADD CONSTRAINT message_templates_header_type_check
  CHECK (header_type IN ('text', 'image', 'video', 'document', 'CAROUSEL'));

-- Ensure cards shape is somewhat validated (must be an array of max 10)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_templates_cards_shape_check'
      AND conrelid = 'message_templates'::regclass
  ) THEN
    ALTER TABLE message_templates
      ADD CONSTRAINT message_templates_cards_shape_check
      CHECK (
        cards IS NULL
        OR (
          jsonb_typeof(cards) = 'array'
          AND jsonb_array_length(cards) <= 10
        )
      );
  END IF;
END $$;
