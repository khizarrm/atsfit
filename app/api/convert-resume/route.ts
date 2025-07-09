import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { extractedText } = await request.json()
    
    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: 'No text provided for conversion' },
        { status: 400 }
      )
    }

    // Get OpenAI API key
    const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // The existing ChatGPT prompt from the resume-setup-view component
    const chatGPTPrompt = `Convert the following resume text exactly as written into Markdown format.

Instructions:

Do not rephrase, rewrite, or edit any content. Do not change the format of the writing. 

Use # (H1) only for my name at the top.

Use ### (H3) for section headings (like EXPERIENCE, EDUCATION, SKILLS, PROJECTS).

Use #### (H4) for company or project titles.

Keep bullet points, line breaks, and formatting exactly as in my input. Do not add bullet points for project/experience titles, only for detailed points regarding an experience or project. 

Output it as plain text so I can easily copy and paste it.

Your only task is to strictly convert my resume to Markdown, preserving all content exactly.

Bold small categories and project names, eg. Frameworks, Technologies. 

Italicize company names, but bold the names of positions. 

Underline quantifiable metrics. 

Format bullet points with a '-'

When returning, ensure you do not modify any content whatsoever. 

Do not add a newline for job titles and company names: keep both on the same line.

Resume follows below:
___________________________________________________________`

    // Make API call to OpenAI
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
            content: chatGPTPrompt
          },
          {
            role: 'user',
            content: extractedText
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { success: false, error: 'Failed to process resume with AI' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const markdown = data.choices[0]?.message?.content

    if (!markdown) {
      return NextResponse.json(
        { success: false, error: 'No response from AI processing' },
        { status: 500 }
      )
    }

    // Clean up the markdown response
    const cleanedMarkdown = markdown
      .replace(/```markdown\n?/g, '') // Remove markdown code blocks
      .replace(/```\n?/g, '') // Remove closing code blocks
      .trim()

    return NextResponse.json({
      success: true,
      markdown: cleanedMarkdown,
      metadata: {
        originalTextLength: extractedText.length,
        markdownLength: cleanedMarkdown.length,
        tokensUsed: data.usage?.total_tokens || 0,
        model: 'gpt-3.5-turbo'
      }
    })

  } catch (error) {
    console.error('Resume conversion error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error during resume conversion' },
      { status: 500 }
    )
  }
}