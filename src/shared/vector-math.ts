/** Compute cosine similarity between two vectors. Assumes both are the same length. */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Return indices of the top-K highest values. */
export function topK(
  scores: number[],
  k: number,
): { index: number; score: number }[] {
  return scores
    .map((score, index) => ({ index, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
