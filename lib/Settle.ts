// Waits for every promise, logging any that fail and giving null in their
// place, so one source being down leaves the rest of a page standing.
export async function settle<T extends readonly unknown[]>(
  promises: readonly [...{ [K in keyof T]: Promise<T[K]> }]
): Promise<{ -readonly [K in keyof T]: T[K] | null }> {
  const results = await Promise.allSettled(promises);
  return results.map((r) => {
    if (r.status === "fulfilled") return r.value;
    console.error("Fetch failure:", r.reason);
    return null;
  }) as { -readonly [K in keyof T]: T[K] | null };
}
