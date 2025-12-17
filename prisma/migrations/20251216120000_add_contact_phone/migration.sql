-- Add phone column to contact submissions
ALTER TABLE "ContactSubmission"
ADD COLUMN IF NOT EXISTS "phone" TEXT;
