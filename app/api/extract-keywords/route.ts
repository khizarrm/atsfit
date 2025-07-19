import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json()

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an ATS (Applicant Tracking System) keyword extraction expert. Your job is to extract specific, technical keywords from job descriptions that would be crucial for ATS optimization.

EXTRACT ONLY:
- Specific technical skills (e.g., "React", "Python", "AWS Lambda", "SQL")
- Specific tools and technologies (e.g., "Docker", "Jenkins", "Kubernetes")
- Specific methodologies (e.g., "Agile", "Scrum", "DevOps")
- Specific certifications (e.g., "AWS Certified", "PMP")
- Specific programming languages and frameworks
- Specific databases and cloud services
- Industry-specific technical terms

DO NOT EXTRACT:
- Generic job titles (e.g., "Software Engineer", "Developer")
- Company names
- General soft skills (e.g., "communication", "teamwork")
- Common business terms (e.g., "experience", "responsible for")
- Location names
- Salary information
- Years of experience
- Generic terms like "strong", "excellent", "good"

Return the keywords as a JSON array of strings. Each keyword should be a specific, searchable term that an ATS would look for. Limit to 15-20 most important keywords.`
          },
          {
            role: 'user',
            content: `Extract ATS-relevant keywords from this job description:\n\n${jobDescription}`
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to extract keywords from OpenAI'
      
      try {
        const errorData = await response.json()
        console.error('OpenAI API error:', errorData)
        errorMessage = errorData.error?.message || errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      } catch (jsonError) {
        // If we can't parse JSON, use status-based error message
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    // Parse the JSON response from OpenAI
    let keywords: string[]
    try {
      keywords = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      return NextResponse.json(
        { error: 'Invalid response format from OpenAI' },
        { status: 500 }
      )
    }

    // Validate that it's an array of strings
    if (!Array.isArray(keywords) || !keywords.every(k => typeof k === 'string')) {
      return NextResponse.json(
        { error: 'Invalid keywords format received' },
        { status: 500 }
      )
    }

    return NextResponse.json({ keywords })

  } catch (error) {
    console.error('Error extracting keywords:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}