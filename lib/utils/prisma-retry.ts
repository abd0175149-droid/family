/**
 * Utility functions for Prisma operations with retry logic
 * Helps handle transient database connection issues
 */

export interface RetryOptions {
  maxRetries?: number
  delay?: number
  exponentialBackoff?: boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  exponentialBackoff: true,
}

/**
 * Execute a Prisma operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error

      // لا نعيد المحاولة للأخطاء التي ليست connection errors
      if (
        !error.message?.includes('PANIC') &&
        !error.message?.includes('timer has gone away') &&
        !error.message?.includes('Connection') &&
        !error.message?.includes('timeout')
      ) {
        throw error
      }

      // إذا كانت المحاولة الأخيرة، نرمي الخطأ
      if (attempt === opts.maxRetries - 1) {
        break
      }

      // حساب delay للـ retry
      const delay = opts.exponentialBackoff
        ? opts.delay * Math.pow(2, attempt)
        : opts.delay

      console.warn(
        `Prisma operation failed (attempt ${attempt + 1}/${opts.maxRetries}), retrying in ${delay}ms...`,
        error.message
      )

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

/**
 * Execute a Prisma operation with timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

/**
 * Execute a Prisma operation with retry and timeout
 */
export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  retryOptions: RetryOptions = {},
  timeoutMs: number = 5000
): Promise<T> {
  return withRetry(() => withTimeout(operation, timeoutMs), retryOptions)
}
