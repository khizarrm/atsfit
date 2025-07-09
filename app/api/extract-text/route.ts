import { NextRequest, NextResponse } from 'next/server'
import * as pdfParse from 'pdf-parse'
import * as mammoth from 'mammoth'
import * as WordExtractor from 'word-extractor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()
    
    if (!fileName.endsWith('.pdf') && 
        !fileName.endsWith('.docx') && 
        !fileName.endsWith('.doc') &&
        !fileType.includes('pdf') &&
        !fileType.includes('word') &&
        !fileType.includes('document')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Please upload a PDF or Word document.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''

    try {
      if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
        // Extract text from PDF
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text
      } else if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml')) {
        // Extract text from DOCX
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } else if (fileName.endsWith('.doc') || fileType.includes('msword')) {
        // Extract text from DOC
        const extractor = new WordExtractor()
        const extracted = await extractor.extract(buffer)
        extractedText = extracted.getBody()
      } else {
        return NextResponse.json(
          { success: false, error: 'Unsupported file format' },
          { status: 400 }
        )
      }

      // Clean up the extracted text
      extractedText = extractedText
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
        .trim()

      if (!extractedText || extractedText.length < 10) {
        return NextResponse.json(
          { success: false, error: 'Could not extract meaningful text from the document' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        text: extractedText,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: fileName.endsWith('.pdf') ? 'pdf' : 
                   fileName.endsWith('.docx') ? 'docx' : 'doc',
          textLength: extractedText.length
        }
      })

    } catch (extractionError) {
      console.error('Text extraction error:', extractionError)
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from the document. Please ensure the file is not corrupted or password protected.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('File processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error during file processing' },
      { status: 500 }
    )
  }
}