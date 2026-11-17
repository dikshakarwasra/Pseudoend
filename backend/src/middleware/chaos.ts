import { APIGatewayResponse } from '../types/index.js';
import { withCors } from './cors.js';

export interface ChaosConfig {
  latencyMs?: number;
  failureRatePercent?: number;
}

/**
 * Simulates real-world network latency and random failure states (chaos engineering).
 * Allows frontend developers to thoroughly test loading spinners, skeleton states, and error toasts.
 */
export async function applyChaos(
  config: ChaosConfig
): Promise<APIGatewayResponse | null> {
  const { latencyMs = 0, failureRatePercent = 0 } = config;

  // 1. Latency simulation (bounded safely to max 5000ms to stay within Lambda timeout limits)
  if (latencyMs > 0) {
    const safeDelay = Math.min(Math.max(0, latencyMs), 5000);
    await new Promise((resolve) => setTimeout(resolve, safeDelay));
  }

  // 2. Fault injection simulation
  if (failureRatePercent > 0) {
    const diceRoll = Math.random() * 100;
    if (diceRoll < failureRatePercent) {
      return withCors({
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'x-pseudoend-chaos': 'true'
        },
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: `Simulated server fault triggered by Pseudoend Chaos Engine (Failure Rate: ${failureRatePercent}%).`,
          isSimulated: true
        })
      });
    }
  }

  return null;
}

