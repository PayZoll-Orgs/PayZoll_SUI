/**
 * Generates a unique payment ID using timestamp and random values
 */
export function generateUniquePaymentId(): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `PAY-${timestamp}-${randomPart}`;
}