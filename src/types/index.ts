export enum EnumTheme {
  DARK = 'dark',
  LIGHT = 'light',
}

export interface QortalName {
  name: string;
  owner: string;
  registrationTimestamp: number;
  updated?: number;
  isForSale?: boolean;
  salePrice?: number;
  description?: string;
}

export interface NameForSale {
  name: string;
  owner: string;
  salePrice: number;
}
