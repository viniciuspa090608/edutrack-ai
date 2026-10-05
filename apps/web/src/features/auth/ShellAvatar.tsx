import { useEffect, useState } from 'react';
import type { AuthUser } from '@study-platform/contracts';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@study-platform/ui/components/ui/avatar';
import { UserRound } from 'lucide-react';
import * as api from '../profile/profile-api.js';

export type ConfirmedAvatar = { version: string | null };

export function ShellAvatar({
  user,
  confirmedAvatar,
}: {
  user: AuthUser;
  confirmedAvatar: ConfirmedAvatar | null;
}) {
  const [identity, setIdentity] = useState<{
    name: string;
    src: string;
    confirmation: ConfirmedAvatar | null;
  } | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl = '';
    async function load() {
      const account = confirmedAvatar ? null : await api.profile();
      const version = confirmedAvatar
        ? confirmedAvatar.version
        : account?.avatarVersion;
      const name = account?.displayName ?? user.displayName ?? '';
      if (!active) return;
      setIdentity({ name, src: '', confirmation: confirmedAvatar });
      if (!version) return;
      const blob = await api.avatar();
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setIdentity({ name, src: objectUrl, confirmation: confirmedAvatar });
    }
    // Avatar reads never gate the session or turn a profile read error into a removal.
    void load().catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user.id, confirmedAvatar]);
  const name = user.displayName ?? identity?.name ?? '';
  const src = identity?.confirmation === confirmedAvatar ? identity.src : '';
  return (
    <a
      className="shell-profile-link"
      href="/conta"
      aria-label={name ? `Abrir conta de ${name}` : 'Abrir conta'}
    >
      <Avatar className="shell-avatar">
        {src && <AvatarImage src={src} alt="" />}
        <AvatarFallback>
          {name.slice(0, 1).toUpperCase() || <UserRound aria-hidden="true" />}
        </AvatarFallback>
      </Avatar>
    </a>
  );
}
