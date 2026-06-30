-- Add roles array column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roles" "UserRole"[] NOT NULL DEFAULT ARRAY['USER'::"UserRole"];

-- Populate roles from existing role for all users
UPDATE "User" SET "roles" = ARRAY["role"];
