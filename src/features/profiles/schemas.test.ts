import { describe, expect, it } from 'vitest';
import { emptyProfileForm, profileFormSchema, signatureMatches, toFormValues, toProfileInput } from './schemas';
import { makeProfile } from '@/test/fixtures';

function validForm() {
  return { ...emptyProfileForm(), firstName: 'Mario', lastName: 'Rossi', emails: [{ value: 'mario@example.it' }] };
}

function messages(result: ReturnType<typeof profileFormSchema.safeParse>): string[] {
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('profile form schema (mirrors backend rules)', () => {
  it('accepts a minimal valid profile', () => {
    expect(profileFormSchema.safeParse(validForm()).success).toBe(true);
  });

  it('requires at least one email and at most five', () => {
    expect(messages(profileFormSchema.safeParse({ ...validForm(), emails: [] }))).toContain('Serve almeno un indirizzo email');
    const six = Array.from({ length: 6 }, (_, index) => ({ value: `a${index}@example.it` }));
    expect(messages(profileFormSchema.safeParse({ ...validForm(), emails: six }))).toContain('Puoi indicare al massimo 5 indirizzi email');
  });

  it('limits phones to 5, addresses to 3 and aliases to 5', () => {
    const phones = Array.from({ length: 6 }, () => ({ value: '+39 02 1234567' }));
    const address = { street: 'Via Roma 1', city: 'Milano', zip: '20100', province: 'MI', country: 'IT' };
    const aliases = Array.from({ length: 6 }, (_, index) => ({ value: `Alias ${index}` }));
    expect(messages(profileFormSchema.safeParse({ ...validForm(), phones }))).toContain('Puoi indicare al massimo 5 numeri di telefono');
    expect(messages(profileFormSchema.safeParse({ ...validForm(), addresses: [address, address, address, address] }))).toContain(
      'Puoi indicare al massimo 3 indirizzi',
    );
    expect(messages(profileFormSchema.safeParse({ ...validForm(), aliases }))).toContain('Puoi indicare al massimo 5 varianti del nome');
  });

  it('validates date of birth, fiscal code, ZIP and province formats', () => {
    expect(messages(profileFormSchema.safeParse({ ...validForm(), dateOfBirth: '23/04/1985' }))[0]).toMatch(/AAAA-MM-GG/);
    expect(messages(profileFormSchema.safeParse({ ...validForm(), fiscalCode: 'ABC' }))[0]).toMatch(/16 caratteri/);
    const badZip = { street: 'Via Roma 1', city: 'Milano', zip: '201', province: '', country: 'IT' };
    expect(messages(profileFormSchema.safeParse({ ...validForm(), addresses: [badZip] }))).toContain('Il CAP deve avere 5 cifre');
    const badProvince = { street: 'Via Roma 1', city: 'Milano', zip: '20100', province: 'Milano', country: 'IT' };
    expect(messages(profileFormSchema.safeParse({ ...validForm(), addresses: [badProvince] }))[0]).toMatch(/sigla/);
  });

  it('round-trips between form values and the API payload', () => {
    const profile = makeProfile({ phones: ['+39 02 1234567'], aliases: ['M. Rossi'] });
    const input = toProfileInput(toFormValues(profile));
    expect(input).toMatchObject({ firstName: 'Mario', lastName: 'Rossi', phones: ['+39 02 1234567'], aliases: ['M. Rossi'], dateOfBirth: '1985-04-23' });
    expect(input.fiscalCode).toBeUndefined();
  });
});

describe('signature matching', () => {
  const profile = { firstName: 'Mario', lastName: 'Rossi' };
  it('is case-insensitive and trimmed, like the backend', () => {
    expect(signatureMatches(' mario rossi ', profile)).toBe(true);
    expect(signatureMatches('MARIO ROSSI', profile)).toBe(true);
    expect(signatureMatches('Mario', profile)).toBe(false);
    expect(signatureMatches('Rossi Mario', profile)).toBe(false);
  });
});
