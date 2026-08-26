export async function getUserAccount(): Promise<{ address: string; name: string | null }> {
  const res = await qdnRequest({ action: 'GET_SELECTED_ACCOUNT' }) as { address: string; name: string | null };
  return { address: res.address, name: res.name || null };
}

export async function getAccountNames(address: string): Promise<Array<{ name: string; owner: string; description?: string; registrationTimestamp: number; isForSale?: boolean; salePrice?: number; saleRecipient?: string | null }>> {
  try {
    const res = await qdnRequest({ action: 'GET_ACCOUNT_NAMES', address }) as Array<{ name: string; owner: string; description?: string; registrationTimestamp: number; isForSale?: boolean; salePrice?: number; saleRecipient?: string | null }>;
    return res ?? [];
  } catch { return []; }
}

export async function registerName(name: string): Promise<void> {
  await qdnRequest({ action: 'REGISTER_NAME', name });
}

export async function updateName(name: string, newName: string): Promise<void> {
  await qdnRequest({ action: 'UPDATE_NAME', name, newName });
}

/** `recipient`, when set, restricts the sale to that address only (private sale, or a free gift when amount is 0). */
export async function sellName(name: string, amount: number, recipient?: string): Promise<void> {
  await qdnRequest({ action: 'SELL_NAME', name, amount, ...(recipient ? { recipient } : {}) });
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

export type NotificationRule = {
  notificationId: string;
  event: string;
  filters: Record<string, boolean | number | string | string[]>;
  title?: string;
  text?: string;
  link?: string;
};

export async function supportsNotifications(): Promise<boolean> {
  try {
    const actions = await qdnRequest({ action: 'SHOW_ACTIONS' });
    return Array.isArray(actions) && actions.includes('NOTIFICATION_ADD');
  } catch { return false; }
}

export async function getNotificationRules(): Promise<NotificationRule[]> {
  try {
    const res = await qdnRequest({ action: 'NOTIFICATION_GET' });
    return Array.isArray(res) ? (res as NotificationRule[]) : [];
  } catch { return []; }
}

export async function addNotificationRules(rules: NotificationRule[]): Promise<void> {
  if (rules.length === 0) return;
  await qdnRequest({ action: 'NOTIFICATION_ADD', subscriptions: rules });
}

export async function removeNotificationRules(notificationIds?: string[]): Promise<void> {
  await qdnRequest({
    action: 'NOTIFICATION_REMOVE',
    ...(notificationIds ? { notificationIds } : {}),
  });
}
