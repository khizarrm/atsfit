/**
 * Pre-validation utilities for seamless LoadingProgress to Results transition
 */

export interface ResultsData {
  resume: string
  initialScore: number
  finalScore: number
  missingKeywords: number
  summary: string
}

/**
 * Validates results data integrity before navigation
 */
export const validateResultsData = async (data: ResultsData): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Validate resume content
    if (!data.resume || data.resume.trim().length === 0) {
      reject(new Error("Resume content is empty"))
      return
    }

    // Check minimum resume length
    if (data.resume.trim().length < 10) {
      reject(new Error("Resume content too short"))
      return
    }

    // Validate scores
    if (typeof data.initialScore !== 'number' || data.initialScore < 0 || data.initialScore > 100) {
      reject(new Error("Invalid initial score"))
      return
    }

    if (typeof data.finalScore !== 'number' || data.finalScore < 0 || data.finalScore > 100) {
      reject(new Error("Invalid final score"))
      return
    }

    if (typeof data.missingKeywords !== 'number' || data.missingKeywords < 0) {
      reject(new Error("Invalid missing keywords count"))
      return
    }

    // Validate score improvement logic
    if (data.finalScore < data.initialScore - 5) {
      console.warn("Final score significantly lower than initial score")
    }

    // Simulate validation time for smooth UX
    setTimeout(resolve, 500)
  })
}

/**
 * Pre-encodes URL parameters and validates encoding
 */
export const encodeResultsParams = (data: ResultsData): string => {
  try {
    // Store large resume content in sessionStorage to avoid URL length limits
    const storageKey = `optimized_resume_${Date.now()}`
    sessionStorage.setItem(storageKey, data.resume)
    
    // Create URL parameters with just metadata and storage key
    const params = new URLSearchParams({
      resumeKey: storageKey,
      initial: data.initialScore.toString(),
      final: data.finalScore.toString(),
      missing: data.missingKeywords.toString(),
      validated: 'true' // Flag indicating pre-validation completed
    })

    return params.toString()
  } catch (error) {
    throw new Error(`Failed to encode results parameters: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Pre-validates navigation readiness and URL constraints
 */
export const preValidateNavigation = async (encodedParams: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if URL would be too long (should be much shorter now)
    const fullUrl = `/results?${encodedParams}`
    if (fullUrl.length > 2000) {
      reject(new Error("Results data too large for URL (limit: 2000 characters)"))
      return
    }

    // Test URL parameter parsing (updated logic for sessionStorage approach)
    try {
      const testParams = new URLSearchParams(encodedParams)
      const testResumeKey = testParams.get('resumeKey')
      const testInitial = testParams.get('initial')
      const testFinal = testParams.get('final')
      const testMissing = testParams.get('missing')

      // Ensure all required parameters exist
      if (!testResumeKey || !testInitial || !testFinal || !testMissing) {
        throw new Error("Missing required parameters after encoding")
      }

      // Test resume retrieval from sessionStorage
      const storedResume = sessionStorage.getItem(testResumeKey)
      if (!storedResume || !storedResume.trim()) {
        throw new Error("Resume content not found in storage or empty")
      }

      // Test score parsing
      const initialScore = parseFloat(testInitial)
      const finalScore = parseFloat(testFinal)
      const missingKeywords = parseInt(testMissing, 10)

      if (isNaN(initialScore) || isNaN(finalScore) || isNaN(missingKeywords)) {
        throw new Error("Score values invalid after parsing")
      }

      console.log('✅ Pre-validation successful:', {
        urlLength: fullUrl.length,
        resumeLength: storedResume.length,
        scores: { initialScore, finalScore, missingKeywords },
        storageKey: testResumeKey
      })

    } catch (error) {
      reject(new Error(`Navigation validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
      return
    }

    // Simulate pre-validation time for smooth UX
    setTimeout(resolve, 300)
  })
}

/**
 * Complete pre-validation flow that runs all validation steps
 */
export const performCompletePreValidation = async (
  data: ResultsData,
  onProgress?: (step: string, progress: number) => void
): Promise<string> => {
  try {
    // Step 1: Validate results data (105%)
    onProgress?.("Validating optimization results...", 105)
    await validateResultsData(data)

    // Step 2: Pre-encode URL parameters (110%)
    onProgress?.("Preparing results display...", 110)
    const encodedParams = encodeResultsParams(data)

    // Step 3: Pre-validate navigation (115%)
    onProgress?.("Finalizing...", 115)
    await preValidateNavigation(encodedParams)

    // Step 4: Ready to navigate (120%)
    onProgress?.("Ready! Taking you to results...", 120)

    return encodedParams
  } catch (error) {
    throw new Error(`Pre-validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}