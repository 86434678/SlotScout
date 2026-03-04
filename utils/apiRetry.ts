
/**
 * Retry utility for API calls with exponential backoff
 * Automatically retries failed API calls up to 3 times with 800-1000ms delay
 */

export interface RetryOptions {
  maxRetries?: number;
  minDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  minDelay: 800,
  maxDelay: 1000,
  onRetry: () => {},
};

/**
 * Sleep for a random duration between min and max milliseconds
 */
function sleep(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Retry an async function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function call
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt}/${opts.maxRetries}`);
      const result = await fn();
      console.log(`[Retry] Success on attempt ${attempt}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`[Retry] Attempt ${attempt} failed:`, error.message);

      if (attempt < opts.maxRetries) {
        opts.onRetry(attempt, error);
        const delay = opts.minDelay + (attempt - 1) * 100; // Slight increase per attempt
        console.log(`[Retry] Waiting ${delay}ms before retry...`);
        await sleep(delay, opts.maxDelay);
      }
    }
  }

  console.error(`[Retry] All ${opts.maxRetries} attempts failed`);
  throw lastError || new Error('All retry attempts failed');
}
