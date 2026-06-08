export async function getUserAccount(): Promise<{ address: string; name: string | null; publicKey: string }> {
  const res = await qortalRequest({ action: 'GET_USER_ACCOUNT' }) as { address: string; name: string; publicKey: string };
  return { ...res, name: res.name || null };
}

export async function getAccountNames(address: string): Promise<Array<{ name: string; owner: string; description?: string; registrationTimestamp: number; isForSale?: boolean; salePrice?: number }>> {
  try {
    const res = await qortalRequest({ action: 'GET_ACCOUNT_NAMES', address }) as Array<{ name: string; owner: string; description?: string; registrationTimestamp: number; isForSale?: boolean; salePrice?: number }>;
    return res ?? [];
  } catch { return []; }
}

export async function registerName(name: string): Promise<void> {
  await qortalRequest({ action: 'REGISTER_NAME', name });
}

export async function updateName(oldName: string, newName: string): Promise<void> {
  await qortalRequest({ action: 'UPDATE_NAME', oldName, newName });
}

export async function sellName(nameForSale: string, salePrice: number): Promise<void> {
  await qortalRequest({ action: 'SELL_NAME', nameForSale, salePrice });
}

export async function cancelSellName(nameForSale: string): Promise<void> {
  await qortalRequest({ action: 'CANCEL_SELL_NAME', nameForSale });
}

export async function buyName(nameForSale: string): Promise<void> {
  await qortalRequest({ action: 'BUY_NAME', nameForSale });
}
