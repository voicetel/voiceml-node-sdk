/**
 * `<Pay>` REST companion resource. Twilio's response shape is intentionally minimal —
 * runtime config (ChargeAmount, PaymentConnector, ValidCardTypes, etc.) is captured
 * server-side and not echoed back. Tenant BYO is binding: the account must have
 * `pay_enabled = true` AND a `stripe_secret_key` configured, or the call fails 403.
 */
export interface CallPayment {
  sid: string;
  account_sid: string;
  call_sid: string;
  api_version: string;
  date_created: string;
  date_updated: string;
  uri: string;
}

/** Narrows the `BankAccountType` field on a Pay session. */
export type PaymentBankAccountType =
  | 'consumer-checking'
  | 'consumer-savings'
  | 'commercial-checking';

/** Narrows the `Input` field. DTMF is the only supported value today. */
export type PaymentInput = 'dtmf';

/** Narrows the `PaymentMethod` field. */
export type PaymentMethod = 'credit-card' | 'ach-debit';

/** Narrows the `TokenType` field. */
export type PaymentTokenType = 'one-time' | 'reusable' | 'payment-method';

/**
 * Narrows the `Capture` field on Pay-session updates — tells the runtime which input the
 * user is about to type next.
 */
export type PaymentCapture =
  | 'payment-card-number'
  | 'expiration-date'
  | 'security-code'
  | 'postal-code'
  | 'bank-routing-number'
  | 'bank-account-number'
  | 'payment-card-number-matcher'
  | 'expiration-date-matcher'
  | 'security-code-matcher'
  | 'postal-code-matcher';

/** Narrows the `Status` field on Pay-session updates. */
export type PaymentSessionStatus = 'complete' | 'cancel';

/**
 * Body for `POST /Calls/{CallSid}/Payments`. Every attribute the `<Pay>` TwiML verb accepts
 * has a counterpart here. `IdempotencyKey` is accepted and persisted for diagnostic
 * visibility but replay-dedup is NOT enforced today.
 */
export interface CreatePaymentParams {
  IdempotencyKey?: string;
  StatusCallback?: string;
  BankAccountType?: PaymentBankAccountType;
  /** Decimal under 1,000,000 (Twilio's documented cap). String-typed on the wire. */
  ChargeAmount?: string;
  /** Three-letter ISO code; server default is `USD`. */
  Currency?: string;
  Description?: string;
  Input?: PaymentInput;
  MinPostalCodeLength?: number;
  /** Single-level JSON object passed to the payment connector. */
  Parameter?: string;
  PaymentConnector?: string;
  PaymentMethod?: PaymentMethod;
  PostalCode?: boolean;
  SecurityCode?: boolean;
  Timeout?: number;
  TokenType?: PaymentTokenType;
  /** Space-separated card types. */
  ValidCardTypes?: string;
  /** Comma-separated fields requiring matcher inputs. */
  RequireMatchingInputs?: string;
  Confirmation?: boolean;
}

/**
 * Body for `POST /Calls/{CallSid}/Payments/{Sid}`. Either advance the session
 * (`Capture=...`) or terminate it (`Status=complete` / `Status=cancel`).
 */
export interface UpdatePaymentParams {
  IdempotencyKey?: string;
  StatusCallback?: string;
  Capture?: PaymentCapture;
  Status?: PaymentSessionStatus;
}
