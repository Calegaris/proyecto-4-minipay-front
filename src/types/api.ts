// --- ENUMS ---
export type TransferStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type TransactionType = 'DEPOSIT' | 'TRANSFER_SENT' | 'TRANSFER_RECEIVED' | 'YIELD';

export type TransactionCategory =
  | 'SERVICES'
  | 'FOOD'
  | 'HOUSING'
  | 'ENTERTAINMENT'
  | 'GENERAL_TRANSFER'
  | 'YIELD'
  | 'OTHER';

// --- ENTIDADES PRINCIPALES ---
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: Wallet;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number; // o string Decimal
  currency: string; // 'ARS'
  alias: string;
  cvu: string;
  dailyTransferLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  transferId: string | null;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  createdAt: string;
  transfer?: Transfer | null;
}

export interface Transfer {
  id: string;
  senderWalletId: string;
  receiverWalletId: string;
  amount: number;
  status: TransferStatus;
  category: TransactionCategory;
  idempotencyKey: string | null;
  createdAt: string;
  completedAt: string | null;
  senderWallet?: {
    alias: string;
    cvu: string;
    user: { name: string; email: string; avatarUrl?: string | null };
  };
  receiverWallet?: {
    alias: string;
    cvu: string;
    user: { name: string; email: string; avatarUrl?: string | null };
  };
}

export interface Contact {
  id: string;
  userId: string;
  contactUserId: string;
  aliasCustomName: string;
  createdAt: string;
  updatedAt: string;
  contactUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    wallet: {
      id: string;
      alias: string;
      cvu: string;
    };
  };
}

// --- PAGINACIÓN Y METADATOS ---
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// --- RESPUESTAS DE ESTADÍSTICAS Y RENDIMIENTOS ---
export interface CategorySpending {
  category: TransactionCategory;
  total: number;
  percentage: number;
  percentageFormatted?: string;
}

export interface MonthlySummary {
  month: string;
  totalDeposited: number;
  totalTransferred: number;
  totalReceived: number;
  netCashFlow: number;
  transactionCount: number;
  spendingByCategory: CategorySpending[];
}

export interface WalletStats {
  currentBalance: number;
  currency: string;
  monthlySummary?: MonthlySummary;
  allTimeSummary?: {
    totalDeposited: number;
    totalTransferred: number;
    totalReceived: number;
    netCashFlow: number;
    transactionCount: number;
  };
  // Fallbacks opcionales para retrocompatibilidad
  period?: string;
  income?: number;
  expenses?: number;
  netSavings?: number;
  spendingByCategory?: CategorySpending[];
}

export interface YieldSummary {
  currentBalance: number;
  currency?: string;
  tna?: string;
  dailyRatePercentage?: string;
  totalYieldsEarnedAllTime?: number;
  totalYieldOperationsCount?: number;
  estimatedDailyYield?: number;
  estimatedMonthlyYield?: number;
  estimatedAnnualYield?: number;
  // Fallbacks opcionales para retrocompatibilidad
  annualRatePercentage?: number;
  todayEarnedYield?: number;
  projectedMonthlyYield?: number;
  projectedAnnualYield?: number;
  yieldHistory?: Transaction[];
}

// --- PAGOS QR ---
export interface QrData {
  qrId: string;
  recipientWalletId?: string;
  recipientCvu?: string;
  recipientAlias?: string;
  recipientName?: string;
  amount: number;
  concept?: string;
  category?: TransactionCategory;
  expiresAt: string;
}

export interface QrPayload {
  qrId: string;
  receiverWalletId?: string;
  receiverName?: string;
  receiverAlias?: string;
  receiverCvu?: string;
  amount: number;
  description?: string;
  concept?: string;
  category?: TransactionCategory;
  expiresAt: string;
}

export interface QrGenerateResponse {
  qrCode: string; // Token firmado con HMAC-SHA256
  qrData?: QrData;
  payload?: QrPayload;
  expiresAt?: string;
  expiresInSeconds?: number;
}

// --- AUTH PAYLOADS & RESPONSES ---
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  wallet?: Wallet;
  accessToken?: string;
  refreshToken?: string;
  tokens?: AuthTokens;
}
