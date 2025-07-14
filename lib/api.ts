import { HOST_URL } from './variables';
import { renderMarkdownPreview, generatePDFCSS, PREVIEW_CONTAINER_STYLES } from '@/lib/utils/preview-renderer';

export async function annotateResume(resume_content: string, job_description: string, keywords: string[], user_notes: string) {
  const res = await fetch(`${HOST_URL}/api/annotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_content,
      keywords,
      job_description,
      user_notes
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Annotation failed");
  }

  const data = await res.json();
  
  console.log("Annotated Resume:", data.annotated_resume);
  
  return data;
}

export async function rewriteResume(resume_md: string, usernotes: string) {
  const res = await fetch(`${HOST_URL}/api/rewrite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_md,
      usernotes
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Rewrite failed");
  }

  const data = await res.json();
  
  console.log("Optimized Resume:", data);
  
  return JSON.parse(data);
}

export interface AtsScoreResponse {
  ats_score: number;
  total_keywords: number;
  matched_keywords: number;  // Count of matched keywords (not array)
  missing_keywords: string[];
  partial_matches: string[];
  recommendations?: string[];
  raw_response?: any;
}

export async function extractKeywordsFromJobDescription(jobDescription: string, abortSignal?: AbortSignal): Promise<string[]> {
  const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert ATS keyword extractor.
          Your job: extract 15-20 **specific technical keywords** from a job description.
          Ignore all the company fluff and just look at what the job requirments are.

          ✅ INCLUDE ONLY:
          - Programming languages (e.g. "Python", "JavaScript")
          - Frameworks and libraries (e.g. "React", "Spring Boot")
          - Tools and technologies (e.g. "Docker", "Kubernetes")
          - Cloud services (e.g. "AWS Lambda", "Azure Functions")
          - Databases (e.g. "PostgreSQL", "MongoDB")
          - Methodologies (e.g. "Agile", "Scrum")
          - Certifications (e.g. "AWS Certified", "PMP")
          - Industry-specific technical terms

          ❌ EXCLUDE:
          - Job titles (e.g. "Software Engineer", "Intern")
          - Company names
          - Soft skills (e.g. "communication", "teamwork")
          - Business terms (e.g. "experience", "responsible")
          - Location names
          - Salary or years of experience
          - Generic terms like "strong", "excellent", "good"

          **Return only a JSON array of strings with the final keywords.**`
        },
        {
          role: "user",
          content: `Extract ATS-relevant keywords from this job description:\n\n${jobDescription}`
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    }),
    signal: abortSignal,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || "Failed to extract keywords from OpenAI");
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  // Parse the JSON response from OpenAI
  let keywords: string[];
  try {
    keywords = JSON.parse(content);
  } catch (parseError) {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("Invalid response format from OpenAI");
  }

  // Validate that it's an array of strings
  if (!Array.isArray(keywords) || !keywords.every(k => typeof k === "string")) {
    throw new Error("Invalid keywords format received");
  }
  
  return keywords;
}

export async function convertResumeToMarkdown(resumeText: string, abortSignal?: AbortSignal): Promise<string> {
  const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const chatGPTPrompt = `Convert the following resume text exactly as written into Markdown format.

Instructions:

Do not rephrase, rewrite, or edit any content. Do not change the format of the writing. 

Use # (H1) only for my name at the top.

Use ### (H3) for section headings (like EXPERIENCE, EDUCATION, SKILLS, PROJECTS).

Use #### (H4) for company or project titles.

Keep bullet points, line breaks, and formatting exactly as in my input. Do not add bullet points for project/experience titles, only for detailed points regarding an experience or project. 

Bold small categories and project names, eg. Frameworks, Technologies. 

Italicize company names, but bold the names of positions. 

Underline quantifiable metrics. 

Format bullet points with a '-'

When returning, ensure you do not modify any content whatsoever. 

Do not add a newline for job titiles and company names: keep both on the same line, with title bolded and company name italicized.

When addings links, add them appropriately as follows [text](url)

Ensure all contact info text below the header is seperated with spaces using '$|$' in markdown
** NOTE: For contact info, ensure there are only 3 pieces. If more, remove the least relevant one. **

Only add urls where neccesary, never in random places

Output it as plain text so I can easily copy and paste it.

Resume follows below:
___________________________________________________________`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: chatGPTPrompt
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
    signal: abortSignal,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || "Failed to convert resume to markdown");
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return content.trim();
}

export async function fetchAtsScore(abortSignal?: AbortSignal, resumeType: 'old' | 'new' = 'old'): Promise<AtsScoreResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "resume-type": resumeType  // Pass resume-type as header
  };
  
  const res = await fetch(`${HOST_URL}/api/ats-score`, {
    method: "POST",
    headers,
    body: JSON.stringify({}), // Empty body since API reads from files
    signal: abortSignal,
  });


  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "ATS score analysis failed");
  }

  const data = await res.json();
  
  console.log("ATS Score Analysis:", data);
  
  return data;
}

export interface PDFGenerationOptions {
  format?: 'A4' | 'letter';
  filename?: string;
}

export async function generatePDF(
  markdownContent: string,
  options: PDFGenerationOptions = {},
  abortSignal?: AbortSignal
): Promise<{ success: boolean; error?: string; filename?: string }> {
  const { format = 'letter', filename = 'resume.pdf' } = options;

  try {
    // Generate HTML and CSS that matches the preview exactly
    const html = renderMarkdownPreview(markdownContent);
    const css = generatePDFCSS(PREVIEW_CONTAINER_STYLES);

    const requestPayload = {
      html,
      css,
      options: {
        format,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        filename
      }
    };

    const res = await fetch(`${HOST_URL}/api/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: abortSignal,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    const result = await res.json();
    console.log("Result is: ", result)
    if (!result.success) {
      throw new Error(result.error || 'PDF generation failed');
    }

    if (!result.data) {
      throw new Error('No PDF data received from server');
    }


    // Convert base64 to blob and download
    const byteCharacters = atob(result.data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
    
    // Download the file
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('PDF generated successfully:', {
      size: result.metadata?.size,
      pages: result.metadata?.pages,
      generationTime: result.metadata?.generationTime,
      cached: result.metadata?.cached
    });

    return { success: true, filename };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('PDF generation failed:', errorMessage);
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

