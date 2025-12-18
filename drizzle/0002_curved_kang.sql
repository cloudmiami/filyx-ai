ALTER TABLE "documents" ADD COLUMN "extracted_text" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ocr_status" "processing_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ocr_completed_at" timestamp;