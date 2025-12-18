import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, mkdirSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Create a simple test PDF content (just text for testing)
    const testContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World! This is a test document.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000252 00000 n 
0000000350 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
427
%%EOF`;

    // Create temp directory
    const tempDir = path.join(process.cwd(), 'temp')
    try {
      mkdirSync(tempDir, { recursive: true })
    } catch {
      // Directory might already exist
    }

    // Create test file
    const testFilePath = path.join(tempDir, 'test-document.pdf')
    writeFileSync(testFilePath, testContent)

    try {
      // Test Docling processing
      const pythonPath = 'C:/Users/manue/filyx/filyx-ai/.venv/Scripts/python.exe'
      const scriptPath = path.join(process.cwd(), 'scripts', 'docling_processor.py')
      
      console.log(`Running: "${pythonPath}" "${scriptPath}" "${testFilePath}"`)
      
      const { stdout, stderr } = await execAsync(
        `"${pythonPath}" "${scriptPath}" "${testFilePath}"`,
        { timeout: 60000 } // 1 minute timeout
      )

      console.log('Docling stdout:', stdout)
      if (stderr) {
        console.log('Docling stderr:', stderr)
      }

      // Parse result
      const result = JSON.parse(stdout)

      // Clean up test file
      unlinkSync(testFilePath)

      return NextResponse.json({
        success: true,
        message: 'Docling test completed',
        result: result,
        pythonPath: pythonPath,
        scriptPath: scriptPath
      })

    } catch (processingError) {
      // Clean up test file on error
      try {
        unlinkSync(testFilePath)
      } catch {
        // Ignore cleanup errors
      }
      
      console.error('Docling processing error:', processingError)
      return NextResponse.json(
        { 
          error: 'Docling processing failed', 
          details: processingError instanceof Error ? processingError.message : 'Unknown error',
          stderr: processingError instanceof Error && 'stderr' in processingError ? processingError.stderr : undefined
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}