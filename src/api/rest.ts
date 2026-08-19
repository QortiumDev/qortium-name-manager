async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function fetchNameData(name: string): Promise<{
  name: string; owner: string; isForSale: boolean; salePrice: number | null; saleRecipient?: string | null;
} | null> {
  try {
    return await get<{ name: string; owner: string; isForSale: boolean; salePrice: number | null; saleRecipient?: string | null }>(
      `/names/${encodeURIComponent(name)}`
    );
  } catch { return null; }
}

/**
 * Fetches one page of the public for-sale list, with names privately directed
 * at a specific recipient (private sales / gifts) filtered out. `rawCount` is
 * the size of the unfiltered page from the node, so callers can tell whether
 * there are more pages left even when this page's visible items were thinned out.
 */
export async function fetchNamesForSale(limit = 20, offset = 0): Promise<{ items: Array<{ name: string; owner: string; salePrice: number }>; rawCount: number }> {
  try {
    const page = await get<Array<{ name: string; owner: string; salePrice: number; saleRecipient?: string | null }>>(
      `/names/forsale?limit=${limit}&offset=${offset}`
    );
    return { items: page.filter(n => !n.saleRecipient), rawCount: page.length };
  } catch { return { items: [], rawCount: 0 }; }
}

export async function searchNamesForSale(query: string, limit = 50): Promise<Array<{ name: string; owner: string; salePrice: number }>> {
  try {
    const results = await get<Array<{ name: string; owner: string; isForSale?: boolean; salePrice?: number; saleRecipient?: string | null }>>(
      `/names/search?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    return results
      .filter(r => r.isForSale && r.salePrice != null && !r.saleRecipient)
      .map(r => ({ name: r.name, owner: r.owner, salePrice: r.salePrice! }));
  } catch { return []; }
}

/** Names currently offered (publicly or privately) directly to `address` — gifts and private sales awaiting claim. */
export async function fetchIncomingTransfers(address: string): Promise<Array<{ name: string; owner: string; salePrice: number }>> {
  try {
    const all = await get<Array<{ name: string; owner: string; salePrice: number; saleRecipient?: string | null }>>('/names/forsale');
    return all
      .filter(n => n.saleRecipient === address)
      .map(n => ({ name: n.name, owner: n.owner, salePrice: n.salePrice }));
  } catch { return []; }
}

export async function fetchNamesByAddress(address: string): Promise<Array<{ name: string; owner: string; isForSale?: boolean; salePrice?: number | null }>> {
  try {
    return await get<Array<{ name: string; owner: string; isForSale?: boolean; salePrice?: number | null }>>(
      `/names/address/${encodeURIComponent(address)}?limit=50`
    );
  } catch { return []; }
}

export async function fetchPrimaryNames(addresses: string[]): Promise<Map<string, string | null>> {
  if (addresses.length === 0) return new Map();
  try {
    const results = await post<Array<{ name: string | null; owner: string }>>('/names/primary', addresses);
    return new Map(results.map(r => [r.owner, r.name ?? null]));
  } catch { return new Map(); }
}
