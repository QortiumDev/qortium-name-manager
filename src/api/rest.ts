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
  name: string; owner: string; isForSale: boolean; salePrice: number | null;
} | null> {
  try {
    return await get<{ name: string; owner: string; isForSale: boolean; salePrice: number | null }>(
      `/names/${encodeURIComponent(name)}`
    );
  } catch { return null; }
}

export async function fetchNamesForSale(limit = 20, offset = 0): Promise<Array<{ name: string; owner: string; salePrice: number }>> {
  try {
    return get<Array<{ name: string; owner: string; salePrice: number }>>(`/names/forsale?limit=${limit}&offset=${offset}`);
  } catch { return []; }
}

export async function searchNamesForSale(query: string, limit = 50): Promise<Array<{ name: string; owner: string; salePrice: number }>> {
  try {
    const results = await get<Array<{ name: string; owner: string; isForSale?: boolean; salePrice?: number }>>(
      `/names/search?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    return results
      .filter(r => r.isForSale && r.salePrice != null)
      .map(r => ({ name: r.name, owner: r.owner, salePrice: r.salePrice! }));
  } catch { return []; }
}

export async function fetchPrimaryNames(addresses: string[]): Promise<Map<string, string | null>> {
  if (addresses.length === 0) return new Map();
  try {
    const results = await post<Array<{ name: string | null; owner: string }>>('/names/primary', addresses);
    return new Map(results.map(r => [r.owner, r.name ?? null]));
  } catch { return new Map(); }
}
