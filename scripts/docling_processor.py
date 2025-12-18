#!/usr/bin/env python3
"""
Docling Document Processing Service
Advanced document AI processing using IBM's Docling with fallback methods
"""

import sys
import json
import os
from pathlib import Path
from docling.document_converter import DocumentConverter

# Try to import fallback PDF processing libraries
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

def fallback_pdf_extraction(file_path: str) -> str:
    """
    Fallback PDF text extraction using PyPDF2
    """
    if not HAS_PYPDF2:
        return ""
    
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text_parts = []
            
            for page in pdf_reader.pages:
                try:
                    page_text = page.extract_text()
                    if page_text and len(page_text.strip()) > 0:
                        text_parts.append(page_text.strip())
                except Exception:
                    continue
            
            return '\n\n'.join(text_parts) if text_parts else ""
            
    except Exception:
        return ""

def process_document(file_path: str) -> dict:
    """
    Process a document using Docling and extract structured content
    
    Args:
        file_path: Path to the document file
        
    Returns:
        Dictionary containing extracted text and metadata
    """
    try:
        # Initialize the document converter
        converter = DocumentConverter()
        
        # Convert document
        result = converter.convert(file_path)
        
        # Extract text content using multiple methods for better results
        extracted_text = ""
        extraction_method = "none"
        
        try:
            # Method 1: Try direct text export if available
            if hasattr(result.document, 'export_to_text'):
                try:
                    extracted_text = result.document.export_to_text()
                    extraction_method = "direct_text"
                except:
                    pass
            
            # Method 2: If no text or seems garbled, try structured content extraction
            # Check for garbled text (lots of forward slashes and numbers)
            is_garbled = (extracted_text and len(extracted_text) > 50 and 
                         (extracted_text.count('/') > len(extracted_text) * 0.05 or
                          extracted_text.count('i255') > 3 or
                          'image -->' in extracted_text))
            
            if not extracted_text or is_garbled:
                try:
                    text_parts = []
                    
                    # Extract from document structure
                    if hasattr(result.document, 'pages'):
                        for page in result.document.pages:
                            page_text = ""
                            
                            # Try different text extraction methods
                            if hasattr(page, 'text') and page.text:
                                page_text = page.text
                            elif hasattr(page, 'cells'):
                                cell_texts = []
                                for cell in page.cells:
                                    if hasattr(cell, 'text') and cell.text:
                                        cell_texts.append(cell.text)
                                page_text = ' '.join(cell_texts)
                            
                            if page_text and not (page_text.count('/') > len(page_text) * 0.1):
                                text_parts.append(page_text)
                    
                    if text_parts:
                        extracted_text = '\n\n'.join(text_parts)
                        extraction_method = "structured"
                        
                except Exception as struct_error:
                    pass
            
            # Method 3: Fall back to markdown if other methods failed
            if not extracted_text:
                try:
                    extracted_text = result.document.export_to_markdown()
                    extraction_method = "markdown"
                except Exception as md_error:
                    # Method 4: Try PyPDF2 fallback for basic PDFs
                    if file_path.lower().endswith('.pdf'):
                        fallback_text = fallback_pdf_extraction(file_path)
                        if fallback_text and len(fallback_text.strip()) > 10:
                            extracted_text = fallback_text
                            extraction_method = "pypdf2_fallback"
                        else:
                            extracted_text = f"All text extraction methods failed. Markdown error: {str(md_error)}"
                            extraction_method = "failed"
                    else:
                        extracted_text = f"All text extraction methods failed. Markdown error: {str(md_error)}"
                        extraction_method = "failed"
                    
        except Exception as text_error:
            extracted_text = f"Text extraction failed: {str(text_error)}"
            extraction_method = "error"
        
        # Get document metadata
        metadata = {
            "page_count": len(result.document.pages) if hasattr(result.document, 'pages') else 0,
            "has_tables": bool(result.document.tables) if hasattr(result.document, 'tables') else False,
            "has_figures": bool(result.document.figures) if hasattr(result.document, 'figures') else False,
            "processing_time": getattr(result, 'processing_time', 0),
            "extraction_method": extraction_method
        }
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "metadata": metadata,
            "file_path": file_path
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "file_path": file_path
        }

def main():
    """Main function to process command line arguments"""
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Usage: python docling_processor.py <file_path>"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File not found: {file_path}"}))
        sys.exit(1)
    
    # Process the document
    result = process_document(file_path)
    
    # Output JSON result
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()