export async function getUserAccount(): Promise<{ address: string; name: string | null }> {
  const res = await qdnRequest({ action: 'GET_SELECTED_ACCOUNT' }) as { address: string; name: string | null };
  return { address: res.address, name: res.name || null };
}

export async function getAccountNames(address: string): Promise<Array<{ name: string; owner: string; description?: string; registrationTimestamp: number; isForSale?: boolean; salePrice?: number }>> {
  try {
    const res = await qdnRequest({ action: 'GET_ACCOUNT_NAMES', address }) as Array<{ name: string; owner: string; description?: string; registrationTimestamp: number; isForSale?: boolean; salePrice?: number }>;
    return res ?? [];
  } catch { return []; }
}

export async function registerName(name: string): Promise<void> {
  await qdnRequest({ action: 'REGISTER_NAME', name });
}

export async function updateName(name: string, newName: string): Promise<void> {
  await qdnRequest({ action: 'UPDATE_NAME', name, newName });
}

export async function sellName(name: string, amount: number): Promise<void> {
  await qdnRequest({ action: 'SELL_NAME', name, amount });
}

export async function cancelSellName(name: string): Promise<void> {
  await qdnRequest({ action: 'CANCEL_SELL_NAME', name });
}

export async function buyName(name: string): Promise<void> {
  await qdnRequest({ action: 'BUY_NAME', name });
}

export async function ensureAccountUnlocked(): Promise<boolean> {
  const result = await qdnRequest({ action: 'UNLOCK_SELECTED_ACCOUNT' }) as { isUnlocked?: boolean } | null;
  return result?.isUnlocked === true;
}
