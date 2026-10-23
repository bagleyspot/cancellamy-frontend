import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useProfiles } from '@/api/queries';
import type { ProfileDto } from '@/api/types';

const STORAGE_KEY = 'cnc.selectedProfile';

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // storage unavailable (private mode): selection simply is not remembered
  }
}

interface ProfileContextValue {
  profiles: ProfileDto[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  selected: ProfileDto | undefined;
  select: (id: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Holds which family profile the app is currently looking at. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const query = useProfiles();
  const [preferredId, setPreferredId] = useState<string | null>(readStored);
  const profiles = useMemo(() => query.data ?? [], [query.data]);

  const select = useCallback((id: string) => {
    setPreferredId(id);
    writeStored(id);
  }, []);

  const selected = profiles.find((profile) => profile.id === preferredId) ?? profiles[0];
  const refetch = query.refetch;

  const value = useMemo<ProfileContextValue>(
    () => ({
      profiles,
      isLoading: query.isPending,
      isError: query.isError,
      retry: () => void refetch(),
      selected,
      select,
    }),
    [profiles, query.isPending, query.isError, refetch, selected, select],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useSelectedProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useSelectedProfile must be used inside <ProfileProvider>');
  return context;
}
