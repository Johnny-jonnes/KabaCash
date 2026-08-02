'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { User, Users, Briefcase, Check, Settings2, ChevronDown } from 'lucide-react';

export function SpaceSwitcher() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeSpaceId, setActiveSpaceId } = useSpaceStore();
  const [open, setOpen] = useState(false);

  const memberships = useLiveQuery(() =>
    db.spaceMembers.where('user_id').equals(user?.id ?? '').filter(m => !m.deleted_at).toArray()
  , [user?.id]) || [];
  const spacesRaw = useLiveQuery(() => db.spaces.toArray()) || [];
  const mySpaces = spacesRaw.filter(s => !s.deleted_at && memberships.some(m => m.space_id === s.id));

  const activeSpace = mySpaces.find(s => s.id === activeSpaceId);
  const label = activeSpace ? activeSpace.name : 'Personnel';
  const Icon = activeSpace ? (activeSpace.type === 'business' ? Briefcase : Users) : User;

  if (mySpaces.length === 0) return null; // pas d'espace : rien à switcher, pas de bruit inutile

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors max-w-[120px]"
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className="w-3 h-3 shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Changer d&apos;espace</DrawerTitle></DrawerHeader>
          <div className="p-2 pb-6 space-y-1">
            <button
              onClick={() => { setActiveSpaceId(null); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-muted active:scale-[0.98] transition-all duration-150"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-left">Personnel</span>
              {!activeSpaceId && <Check className="w-4 h-4 text-primary" />}
            </button>
            {mySpaces.map(space => (
              <button
                key={space.id}
                onClick={() => { setActiveSpaceId(space.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-muted active:scale-[0.98] transition-all duration-150"
              >
                {space.type === 'business' ? <Briefcase className="w-4 h-4 text-muted-foreground" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                <span className="flex-1 text-left truncate">{space.name}</span>
                {activeSpaceId === space.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); router.push('/spaces'); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-primary hover:bg-muted active:scale-[0.98] transition-all duration-150"
            >
              <Settings2 className="w-4 h-4" />
              Gérer mes espaces
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
