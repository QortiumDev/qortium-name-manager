import type { NotificationRule } from '../api/qortal';

export const NAME_SOLD_NOTIFICATION_ID = 'name-sold';
export const NAME_RECEIVED_NOTIFICATION_ID = 'name-received';

// Core reports a BUY_NAME transaction's involved addresses as [buyer, seller], so
// filtering on the account's own address catches "a name you're selling got bought"
// and "someone accepted a name you sent them" — both are the same on-chain event,
// just told from the seller's side. Likewise a SELL_NAME transaction's involved
// addresses are [owner, recipient] when a private sale/gift recipient is set, so
// filtering there catches "a name was sent to you".
export function buildNameNotificationRules(address: string): NotificationRule[] {
  return [
    {
      notificationId: NAME_SOLD_NOTIFICATION_ID,
      event: 'TRANSACTION_CONFIRMED',
      filters: { address, txType: 'BUY_NAME' },
      title: 'Name sold',
    },
    {
      notificationId: NAME_RECEIVED_NOTIFICATION_ID,
      event: 'TRANSACTION_CONFIRMED',
      filters: { address, txType: 'SELL_NAME' },
      title: 'Name sent to you',
    },
  ];
}
