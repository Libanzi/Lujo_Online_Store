/**
 * Security logging utility for edge functions
 * Tracks requests, validations, and suspicious activity
 */

export interface SecurityLogEntry {
  timestamp: string;
  functionName: string;
  eventType: 'request' | 'validation_success' | 'validation_failure' | 'auth_success' | 'auth_failure' | 'suspicious_activity' | 'error';
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
}

export class SecurityLogger {
  private functionName: string;
  private request: Request;

  constructor(functionName: string, request: Request) {
    this.functionName = functionName;
    this.request = request;
  }

  private getClientInfo() {
    return {
      ipAddress: this.request.headers.get('x-forwarded-for') || 
                 this.request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: this.request.headers.get('user-agent') || 'unknown',
    };
  }

  private log(entry: Omit<SecurityLogEntry, 'timestamp' | 'functionName'>) {
    const logEntry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      functionName: this.functionName,
      ...this.getClientInfo(),
      ...entry,
    };

    // Log based on severity
    if (entry.severity === 'critical' || entry.severity === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (entry.severity === 'warning') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }

    return logEntry;
  }

  logRequest(method: string, path?: string) {
    return this.log({
      eventType: 'request',
      severity: 'info',
      details: {
        method,
        path: path || 'unknown',
      },
    });
  }

  logValidationSuccess(validatedData: Record<string, any>) {
    return this.log({
      eventType: 'validation_success',
      severity: 'info',
      details: {
        validatedFields: Object.keys(validatedData),
      },
    });
  }

  logValidationFailure(errors: any[], attemptedData?: Record<string, any>) {
    return this.log({
      eventType: 'validation_failure',
      severity: 'warning',
      details: {
        errors,
        attemptedFields: attemptedData ? Object.keys(attemptedData) : [],
      },
    });
  }

  logAuthSuccess(userId: string) {
    return this.log({
      eventType: 'auth_success',
      severity: 'info',
      userId,
      details: {
        success: true,
      },
    });
  }

  logAuthFailure(reason: string, attemptedEmail?: string) {
    return this.log({
      eventType: 'auth_failure',
      severity: 'warning',
      details: {
        reason,
        attemptedEmail: attemptedEmail ? '***@' + attemptedEmail.split('@')[1] : 'unknown',
      },
    });
  }

  logSuspiciousActivity(activityType: string, details: Record<string, any>) {
    return this.log({
      eventType: 'suspicious_activity',
      severity: 'critical',
      details: {
        activityType,
        ...details,
      },
    });
  }

  logError(error: Error | string, context?: Record<string, any>) {
    return this.log({
      eventType: 'error',
      severity: 'error',
      details: {
        error: error instanceof Error ? error.message : error,
        context,
      },
    });
  }

  /**
   * Detects suspicious patterns that might indicate attacks
   */
  detectSuspiciousPatterns(data: any): { isSuspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check for SQL injection attempts
    if (typeof data === 'string' && /(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i.test(data)) {
      reasons.push('Possible SQL injection attempt detected');
    }

    // Check for XSS attempts
    if (typeof data === 'string' && /<script|javascript:|onerror=/i.test(data)) {
      reasons.push('Possible XSS attempt detected');
    }

    // Check for path traversal attempts
    if (typeof data === 'string' && /\.\.[\/\\]/.test(data)) {
      reasons.push('Possible path traversal attempt detected');
    }

    // Check for excessively long inputs (possible buffer overflow attempt)
    if (typeof data === 'string' && data.length > 10000) {
      reasons.push('Excessively long input detected');
    }

    if (reasons.length > 0) {
      this.logSuspiciousActivity('pattern_detection', {
        patterns: reasons,
        dataPreview: typeof data === 'string' ? data.substring(0, 100) : typeof data,
      });
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }
}

/**
 * Rate limiting tracker (in-memory, resets on cold start)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
