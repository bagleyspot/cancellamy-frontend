import { useFieldArray } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { it } from '@/i18n/it';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { EMPTY_ADDRESS, PROFILE_LIMITS } from './schemas';
import type { ProfileFormValues } from './schemas';

export type ProfileForm = UseFormReturn<ProfileFormValues>;

type ListName = 'aliases' | 'emails' | 'phones';

interface StringListProps {
  form: ProfileForm;
  name: ListName;
  legend: string;
  hint: string;
  itemLabel: string;
  max: number;
  min?: number;
  inputType?: 'email' | 'tel' | 'text';
  autoComplete?: string;
}

function StringList({ form, name, legend, hint, itemLabel, max, min = 0, inputType = 'text', autoComplete }: StringListProps) {
  const t = it.profiles.fields;
  const { fields, append, remove } = useFieldArray({ control: form.control, name });
  const listError = form.formState.errors[name]?.root?.message ?? form.formState.errors[name]?.message;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{legend}</legend>
      <p className="text-xs text-muted">{hint}</p>
      <ul className="space-y-3">
        {fields.map((field, index) => {
          const label = `${itemLabel} ${index + 1}`;
          return (
            <li key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <TextField
                  label={label}
                  type={inputType}
                  autoComplete={autoComplete}
                  error={form.formState.errors[name]?.[index]?.value?.message}
                  {...form.register(`${name}.${index}.value`)}
                />
              </div>
              {fields.length > min && (
                <Button variant="ghost" size="sm" className="mt-7" onClick={() => remove(index)} aria-label={t.removeItem(label)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {listError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {listError}
        </p>
      )}
      {fields.length < max && (
        <Button variant="secondary" size="sm" onClick={() => append({ value: '' })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.addItem} {itemLabel.toLowerCase()}
        </Button>
      )}
    </fieldset>
  );
}

export function PersonalFields({ form }: { form: ProfileForm }) {
  const t = it.profiles.fields;
  const { register, formState } = form;
  const errors = formState.errors;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t.firstName} autoComplete="given-name" error={errors.firstName?.message} {...register('firstName')} />
        <TextField label={t.lastName} autoComplete="family-name" error={errors.lastName?.message} {...register('lastName')} />
        <TextField
          label={`${t.dateOfBirth} ${it.common.optional}`}
          type="date"
          autoComplete="bday"
          hint={t.dateOfBirthHint}
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />
        <TextField
          label={`${t.fiscalCode} ${it.common.optional}`}
          autoComplete="off"
          maxLength={16}
          hint={t.fiscalCodeHint}
          error={errors.fiscalCode?.message}
          {...register('fiscalCode')}
        />
      </div>
      <StringList
        form={form}
        name="aliases"
        legend={t.aliases}
        hint={t.aliasesHint}
        itemLabel={t.alias}
        max={PROFILE_LIMITS.aliases.max}
      />
    </div>
  );
}

export function ContactFields({ form }: { form: ProfileForm }) {
  const t = it.profiles.fields;
  const { register, control, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'addresses' });
  const addressesError = formState.errors.addresses?.root?.message ?? formState.errors.addresses?.message;

  return (
    <div className="space-y-6">
      <StringList
        form={form}
        name="emails"
        legend={t.emails}
        hint={t.emailsHint}
        itemLabel={t.email}
        max={PROFILE_LIMITS.emails.max}
        min={PROFILE_LIMITS.emails.min}
        inputType="email"
        autoComplete="email"
      />
      <StringList
        form={form}
        name="phones"
        legend={t.phones}
        hint={t.phonesHint}
        itemLabel={t.phone}
        max={PROFILE_LIMITS.phones.max}
        inputType="tel"
        autoComplete="tel"
      />
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t.addresses}</legend>
        <p className="text-xs text-muted">{t.addressesHint}</p>
        <ul className="space-y-4">
          {fields.map((field, index) => {
            const errors = formState.errors.addresses?.[index];
            return (
              <li key={field.id} className="space-y-3 rounded-xl border border-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t.address(index + 1)}</p>
                  <Button variant="ghost" size="sm" onClick={() => remove(index)} aria-label={t.removeItem(t.address(index + 1))}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {it.common.remove}
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <TextField label={t.street} autoComplete="street-address" error={errors?.street?.message} {...register(`addresses.${index}.street`)} />
                  </div>
                  <div className="sm:col-span-3">
                    <TextField label={t.city} autoComplete="address-level2" error={errors?.city?.message} {...register(`addresses.${index}.city`)} />
                  </div>
                  <div className="sm:col-span-1">
                    <TextField label={t.zip} autoComplete="postal-code" inputMode="numeric" error={errors?.zip?.message} {...register(`addresses.${index}.zip`)} />
                  </div>
                  <div className="sm:col-span-2">
                    <TextField label={`${t.province} ${it.common.optional}`} maxLength={2} hint={t.provinceHint} error={errors?.province?.message} {...register(`addresses.${index}.province`)} />
                  </div>
                  <div className="sm:col-span-3">
                    <TextField label={t.country} maxLength={2} hint={t.countryHint} error={errors?.country?.message} {...register(`addresses.${index}.country`)} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {addressesError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {addressesError}
          </p>
        )}
        {fields.length < PROFILE_LIMITS.addresses.max && (
          <Button variant="secondary" size="sm" onClick={() => append({ ...EMPTY_ADDRESS })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.addItem} {t.address(fields.length + 1).toLowerCase()}
          </Button>
        )}
      </fieldset>
    </div>
  );
}
