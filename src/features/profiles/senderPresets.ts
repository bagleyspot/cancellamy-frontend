export type SenderPresetId = 'gmail' | 'other';

export interface SenderPreset {
  host: string;
  port: number;
  secure: boolean;
  // Some providers (Gmail) use the full mailbox address as the SMTP user name.
  usernameIsAddress: boolean;
}

export const SENDER_PRESETS: Record<Exclude<SenderPresetId, 'other'>, SenderPreset> = {
  gmail: { host: 'smtp.gmail.com', port: 587, secure: false, usernameIsAddress: true },
};

export const GMAIL_APP_PASSWORDS_URL = 'https://myaccount.google.com/apppasswords';

export function detectPreset(host: string | undefined): SenderPresetId {
  return host?.trim().toLowerCase() === SENDER_PRESETS.gmail.host ? 'gmail' : 'other';
}
