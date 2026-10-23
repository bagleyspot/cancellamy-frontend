import { z } from 'zod';
import type { AddressDto, ProfileDto, ProfileInput } from '@/api/types';
import { it } from '@/i18n/it';

const v = it.validation;

export const PROFILE_LIMITS = { emails: { min: 1, max: 5 }, phones: { max: 5 }, addresses: { max: 3 }, aliases: { max: 5 } } as const;

const emailValue = z.string().trim().min(1, v.required).pipe(z.email(v.email));
const phoneValue = z
  .string()
  .trim()
  .min(1, v.required)
  .regex(/^\+?[0-9 ()./-]{6,20}$/, v.phone);
const aliasValue = z.string().trim().min(1, v.required).max(100, v.maxLength(100));

const addressSchema = z
  .object({
    street: z.string().trim().min(1, v.street).max(200, v.maxLength(200)),
    city: z.string().trim().min(1, v.city).max(100, v.maxLength(100)),
    zip: z.string().trim().min(1, v.zip).max(12, v.maxLength(12)),
    province: z
      .string()
      .trim()
      .refine((value) => value === '' || /^[A-Za-z]{2}$/.test(value), v.province),
    country: z.string().trim().regex(/^[A-Za-z]{2}$/, v.country),
  })
  .superRefine((address, ctx) => {
    if (address.country.toUpperCase() === 'IT' && !/^\d{5}$/.test(address.zip)) {
      ctx.addIssue({ code: 'custom', path: ['zip'], message: v.zip });
    }
  });

export const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, v.firstName).max(100, v.maxLength(100)),
  lastName: z.string().trim().min(1, v.lastName).max(100, v.maxLength(100)),
  dateOfBirth: z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))), v.dateOfBirth)
    .refine((value) => value === '' || Number.isNaN(Date.parse(value)) || new Date(value).getTime() <= Date.now(), v.dateOfBirthFuture),
  fiscalCode: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[A-Za-z0-9]{16}$/.test(value), v.fiscalCode),
  aliases: z.array(z.object({ value: aliasValue })).max(PROFILE_LIMITS.aliases.max, v.aliasesMax),
  emails: z
    .array(z.object({ value: emailValue }))
    .min(PROFILE_LIMITS.emails.min, v.emailsMin)
    .max(PROFILE_LIMITS.emails.max, v.emailsMax),
  phones: z.array(z.object({ value: phoneValue })).max(PROFILE_LIMITS.phones.max, v.phonesMax),
  addresses: z.array(addressSchema).max(PROFILE_LIMITS.addresses.max, v.addressesMax),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** Fields validated by each of the two data-entry steps. */
export const STEP_FIELDS = {
  1: ['firstName', 'lastName', 'dateOfBirth', 'fiscalCode', 'aliases'],
  2: ['emails', 'phones', 'addresses'],
} as const satisfies Record<number, readonly (keyof ProfileFormValues)[]>;

export const EMPTY_ADDRESS: ProfileFormValues['addresses'][number] = { street: '', city: '', zip: '', province: '', country: 'IT' };

export function emptyProfileForm(): ProfileFormValues {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    fiscalCode: '',
    aliases: [],
    emails: [{ value: '' }],
    phones: [],
    addresses: [],
  };
}

export function toFormValues(profile: ProfileDto): ProfileFormValues {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: profile.dateOfBirth ?? '',
    fiscalCode: profile.fiscalCode ?? '',
    aliases: profile.aliases.map((value) => ({ value })),
    emails: profile.emails.map((value) => ({ value })),
    phones: profile.phones.map((value) => ({ value })),
    addresses: profile.addresses.map((address) => ({
      street: address.street,
      city: address.city,
      zip: address.zip,
      province: address.province ?? '',
      country: address.country,
    })),
  };
}

export function toProfileInput(values: ProfileFormValues): ProfileInput {
  const addresses: AddressDto[] = values.addresses.map((address) => ({
    street: address.street.trim(),
    city: address.city.trim(),
    zip: address.zip.trim(),
    country: address.country.trim().toUpperCase(),
    ...(address.province.trim() && { province: address.province.trim().toUpperCase() }),
  }));
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    emails: values.emails.map((entry) => entry.value.trim()),
    phones: values.phones.map((entry) => entry.value.trim()),
    addresses,
    aliases: values.aliases.map((entry) => entry.value.trim()),
    ...(values.dateOfBirth.trim() && { dateOfBirth: values.dateOfBirth.trim() }),
    ...(values.fiscalCode.trim() && { fiscalCode: values.fiscalCode.trim().toUpperCase() }),
  };
}

/** The backend requires the signature to equal "<firstName> <lastName>", case-insensitively and trimmed. */
export function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function expectedSignature(profile: Pick<ProfileDto, 'firstName' | 'lastName'>): string {
  return `${profile.firstName} ${profile.lastName}`;
}

export function signatureMatches(signature: string, profile: Pick<ProfileDto, 'firstName' | 'lastName'>): boolean {
  return normalizeName(signature) === normalizeName(expectedSignature(profile));
}

export function buildSignatureSchema(profile: Pick<ProfileDto, 'firstName' | 'lastName'>) {
  return z.object({
    signatureName: z
      .string()
      .min(1, v.required)
      .refine((value) => signatureMatches(value, profile), v.signatureMismatch),
    accepted: z.boolean().refine((value) => value, v.acceptAuthorization),
  });
}

export type SignatureFormValues = z.infer<ReturnType<typeof buildSignatureSchema>>;
