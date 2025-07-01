import { HOST_URL } from './variables';

export async function fetchJobResearch(jobUrl: string, resumeMd: string, abortSignal?: AbortSignal) {
  const res = await fetch(`${HOST_URL}/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: jobUrl, resume_md: resumeMd }),
    signal: abortSignal,
  });

  if (!res.ok) throw new Error("Failed to fetch research");

  const data = await res.json();
  
  // Log the full response to understand the structure
  console.log("Full API response:", data);
  
  // Handle different possible response structures
  if (typeof data === 'string') {
    return data;
  } else if (data.summary) {
    return data.summary;
  } else if (data.raw) {
    return data.raw;
  } else if (data.json_dict) {
    return JSON.stringify(data.json_dict, null, 2);
  } else {
    // Fallback: convert entire object to readable string
    return JSON.stringify(data, null, 2);
  }
}

export async function annotateResume(keywords: string[], jobDescription: string, userNotes: string, abortSignal?: AbortSignal) {
  const res = await fetch(`${HOST_URL}/api/annotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keywords,
      job_description: jobDescription,
      user_notes: userNotes
    }),
    signal: abortSignal,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Annotation failed");
  }

  const data = await res.json();
  
  console.log("Annotated Resume:", data.annotated_resume);
  
  return data;
}

export async function rewriteResume(abortSignal?: AbortSignal) {
  const res = await fetch(`${HOST_URL}/api/rewrite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: abortSignal,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Rewrite failed");
  }

  const data = await res.json();
  
  console.log("Optimized Resume:", data.optimized_resume);
  
  return data;
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