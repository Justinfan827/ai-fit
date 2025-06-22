import { Workout } from '@/lib/domain/workouts'

/**
 * Computes a SHA-1 hash of a workout for optimistic concurrency checking
 * This allows the client to detect if the workout has changed since a diff was generated
 */
export async function computeWorkoutHash(workout: Workout): Promise<string> {
  // Serialize the workout to a stable string representation
  const serialized = JSON.stringify(workout, Object.keys(workout).sort())

  // Use browser's crypto API if available, otherwise fall back to Node.js crypto
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    // Browser environment
    const encoder = new TextEncoder()
    const data = encoder.encode(serialized)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } else {
    // Node.js environment
    const crypto = await import('crypto')
    return crypto.createHash('sha1').update(serialized).digest('hex')
  }
}

/**
 * Validates if a diff can be safely applied by comparing workout hashes
 */
export async function validateDiffHash(
  currentWorkout: Workout,
  diffHash?: string
): Promise<{ valid: boolean; reason?: string }> {
  if (!diffHash) {
    // No hash provided - assume valid but warn
    return { valid: true, reason: 'No hash validation available' }
  }

  const currentHash = await computeWorkoutHash(currentWorkout)

  if (currentHash === diffHash) {
    return { valid: true }
  } else {
    return {
      valid: false,
      reason: 'Workout has been modified since diff was generated',
    }
  }
}
