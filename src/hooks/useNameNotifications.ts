import { useEffect, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { accountAtom, notificationsEnabledAtom, notificationsSupportedAtom } from '../state/atoms';
import {
  supportsNotifications,
  getNotificationRules,
  addNotificationRules,
  removeNotificationRules,
} from '../api/qortal';
import { buildNameNotificationRules } from '../notifications/nameNotificationRules';

async function syncNameNotificationRules(address: string) {
  const rules = buildNameNotificationRules(address);
  const existing = await getNotificationRules();
  const desiredIds = new Set(rules.map((r) => r.notificationId));
  const staleIds = existing.map((r) => r.notificationId).filter((id) => !desiredIds.has(id));

  if (staleIds.length > 0) await removeNotificationRules(staleIds);
  await addNotificationRules(rules);
}

export function useNameNotifications() {
  const account = useAtomValue(accountAtom);
  const enabled = useAtomValue(notificationsEnabledAtom);
  const [supported, setSupported] = useAtom(notificationsSupportedAtom);
  const lastSyncedAddress = useRef<string | null>(null);

  useEffect(() => {
    supportsNotifications().then(setSupported).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supported) return;
    const address = account?.address;

    if (!enabled || !address) {
      if (lastSyncedAddress.current !== null) {
        removeNotificationRules().catch(() => {});
        lastSyncedAddress.current = null;
      }
      return;
    }

    if (address === lastSyncedAddress.current) return;

    let cancelled = false;
    syncNameNotificationRules(address)
      .then(() => { if (!cancelled) lastSyncedAddress.current = address; })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [supported, enabled, account?.address]);
}
