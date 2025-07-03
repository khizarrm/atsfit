interface TrialSession {
  attempts: number;
  maxAttempts: number;
  lastAttempt: string; // ISO date string
  sessionId: string;
  createdAt: string; // ISO date string
}

export class TrialManager {
  private static readonly STORAGE_KEY = 'atsfit_trial_session';
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly SESSION_EXPIRY_HOURS = 24; // Trial session expires after 24 hours

  /**
   * Generate a unique session ID
   */
  private static generateSessionId(): string {
    return `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current trial session from localStorage
   */
  static getSession(): TrialSession {
    if (typeof window === 'undefined') {
      // Server-side rendering fallback
      return this.createNewSession();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.createNewSession();
      }

      const session: TrialSession = JSON.parse(stored);
      
      // Validate session structure
      if (!session.sessionId || typeof session.attempts !== 'number' || !session.createdAt) {
        return this.createNewSession();
      }

      // Check if session has expired
      if (this.isSessionExpired(session)) {
        return this.createNewSession();
      }

      return session;
    } catch (error) {
      console.warn('Failed to parse trial session from localStorage:', error);
      return this.createNewSession();
    }
  }

  /**
   * Create a new trial session
   */
  private static createNewSession(): TrialSession {
    const now = new Date().toISOString();
    const session: TrialSession = {
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      lastAttempt: now,
      sessionId: this.generateSessionId(),
      createdAt: now
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Save session to localStorage
   */
  private static saveSession(session: TrialSession): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save trial session to localStorage:', error);
    }
  }

  /**
   * Check if a session has expired
   */
  private static isSessionExpired(session: TrialSession): boolean {
    const createdAt = new Date(session.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > this.SESSION_EXPIRY_HOURS;
  }

  /**
   * Increment attempt counter and save session
   * Returns true if attempt was successfully incremented, false if limit reached
   */
  static incrementAttempt(): boolean {
    const session = this.getSession();
    
    if (session.attempts >= session.maxAttempts) {
      return false; // Limit reached
    }

    session.attempts += 1;
    session.lastAttempt = new Date().toISOString();
    
    this.saveSession(session);
    return true;
  }

  /**
   * Get remaining attempts
   */
  static getRemainingAttempts(): number {
    const session = this.getSession();
    return Math.max(0, session.maxAttempts - session.attempts);
  }

  /**
   * Check if trial has attempts remaining
   */
  static hasAttemptsRemaining(): boolean {
    return this.getRemainingAttempts() > 0;
  }

  /**
   * Get current attempt count
   */
  static getCurrentAttempts(): number {
    const session = this.getSession();
    return session.attempts;
  }

  /**
   * Get maximum attempts allowed
   */
  static getMaxAttempts(): number {
    return this.MAX_ATTEMPTS;
  }

  /**
   * Reset trial session (create new session)
   */
  static resetSession(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to remove trial session from localStorage:', error);
    }
  }

  /**
   * Check if trial is expired (different from attempts exhausted)
   */
  static isTrialExpired(): boolean {
    const session = this.getSession();
    return this.isSessionExpired(session);
  }

  /**
   * Get session info for debugging
   */
  static getSessionInfo(): {
    sessionId: string;
    attempts: number;
    maxAttempts: number;
    remaining: number;
    lastAttempt: string;
    createdAt: string;
    isExpired: boolean;
  } {
    const session = this.getSession();
    return {
      sessionId: session.sessionId,
      attempts: session.attempts,
      maxAttempts: session.maxAttempts,
      remaining: this.getRemainingAttempts(),
      lastAttempt: session.lastAttempt,
      createdAt: session.createdAt,
      isExpired: this.isSessionExpired(session)
    };
  }

  /**
   * Preview next attempt without actually incrementing
   */
  static canMakeAttempt(): boolean {
    const session = this.getSession();
    return session.attempts < session.maxAttempts && !this.isSessionExpired(session);
  }

  /**
   * Get formatted attempt counter display text
   */
  static getAttemptDisplayText(): string {
    const remaining = this.getRemainingAttempts();
    const max = this.getMaxAttempts();
    
    if (remaining === 0) {
      return 'Trial limit reached';
    }
    
    return `${remaining}/${max} attempts remaining`;
  }
}