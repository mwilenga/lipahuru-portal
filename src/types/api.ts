export type UserRole = "admin" | "merchant";

export interface ApiEnvelope<T> {
  status: string;
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
  data: T;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  merchantId?: number;
}

export interface Merchant {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  environment: string;
  defaultCurrency: string;
  defaultCallbackUrl?: string;
  createdAt?: string;
}

export interface MerchantCredentials {
  merchant: Merchant;
  clientId: string | null;
  clientStatus: string | null;
  portalEmail: string | null;
  clientSecretHint: string;
}

export interface PortalDashboard {
  collectionsToday: string;
  disbursementsToday: string;
  pendingCount: number;
  failedCount: number;
  currency: string;
  merchantCount?: number;
  activeMerchantCount?: number;
  parentWallet?: {
    available: string;
    reserved: string;
    total: string;
    currency: string;
  };
  providerWallets: Array<{
    providerCode?: string;
    name: string;
    available: string;
    total: string;
    currency: string;
  }>;
  recentTransactions: Transaction[];
}

export type MerchantDashboard = PortalDashboard;

export interface Transaction {
  transactionId: string;
  requestId: string;
  reference: string;
  operation: string;
  status: string;
  providerCode?: string;
  merchantName?: string;
  amount: string;
  currency: string;
  msisdn: string;
  providerTransactionId?: string;
  providerReceiptNo?: string;
  failureCode?: string;
  failureMessage?: string;
  finalizedAt?: string;
  createdAt?: string;
}

export interface Wallet {
  walletId: number;
  walletType: string;
  providerCode?: string;
  name: string;
  currency: string;
  available: string;
  reserved: string;
  total: string;
  isActive: boolean;
}

export interface Pagination {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}
