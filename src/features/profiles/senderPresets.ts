export type SenderProviderId = 'gmail' | 'icloud' | 'yahoo' | 'libero' | 'aruba';
export type SenderPresetId = SenderProviderId | 'other';

export interface SenderPreset {
  host: string;
  port: number;
  secure: boolean;
  /** Where the user creates the app password, when the provider has a stable page for it. */
  appPasswordUrl?: string;
}

// All these providers use the full mailbox address as the SMTP user name.
export const SENDER_PRESETS: Record<SenderProviderId, SenderPreset> = {
  gmail: { host: 'smtp.gmail.com', port: 587, secure: false, appPasswordUrl: 'https://myaccount.google.com/apppasswords' },
  icloud: { host: 'smtp.mail.me.com', port: 587, secure: false, appPasswordUrl: 'https://account.apple.com/account/manage' },
  yahoo: { host: 'smtp.mail.yahoo.com', port: 465, secure: true, appPasswordUrl: 'https://login.yahoo.com/account/security' },
  libero: { host: 'smtp.libero.it', port: 465, secure: true },
  aruba: { host: 'smtps.aruba.it', port: 465, secure: true },
};

export const SENDER_PROVIDER_IDS = Object.keys(SENDER_PRESETS) as SenderProviderId[];

export function detectPreset(host: string | undefined): SenderPresetId {
  const normalized = host?.trim().toLowerCase();
  return SENDER_PROVIDER_IDS.find((id) => SENDER_PRESETS[id].host === normalized) ?? 'other';
}
