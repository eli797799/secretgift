-- Add WhatsApp number for prize redemption
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS owner_whatsapp VARCHAR(20);
