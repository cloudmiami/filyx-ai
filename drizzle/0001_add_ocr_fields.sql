-- Add OCR and text extraction fields to documents table
ALTER TABLE "documents" ADD COLUMN "extracted_text" text;
ALTER TABLE "documents" ADD COLUMN "ocr_status" "processing_status" DEFAULT 'pending';
ALTER TABLE "documents" ADD COLUMN "ocr_completed_at" timestamp;