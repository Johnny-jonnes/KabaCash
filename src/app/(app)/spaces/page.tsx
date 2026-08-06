'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { SpaceForm } from '@/components/spaces/SpaceForm';
import { JoinSpaceForm } from '@/components/spaces/JoinSpaceForm';
import { MemberSpendingReport } from '@/components/spaces/MemberSpendingReport';
import { MergeAccountDialog } from '@/components/accounts/MergeAccountDialog';
import { leaveSpace, removeMember } from '@/lib/spaces/spaceActions';
import { formatAmount } from '@/lib/finance/format';
import { Users, Briefcase, Plus, KeyRound, Copy, LogOut, UserMinus, Crown, Wallet, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { DBAccount, DBSpace } from '@/types/database';

export default function SpacesPage() {
  const { user } = useAuthStore();
  const { activeSpaceId, setActiveSpaceId } = useSpaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [detailSpace, setDetailSpace] = useState<DBSpace | null>(null);
  const [accountToMerge, setAccountToMerge] = useState<DBAccount | null>(null);

  const memberships = useLiveQuery(() =>
    db.spaceMembers.where('user_id').equals(user?.id ?? '').filter(m => !m.deleted_at).toArray()
  , [user?.id]) || [];
  const spacesRaw = useLiveQuery(() => db.spaces.toArray()) || [];
  const mySpaces = spacesRaw.filter(s => !s.deleted_at && memberships.some(m => m.space_id === s.id));

  const allMembers = useLiveQuery(() =>
    db.spaceMembers.where('space_id').equals(detailSpace?.id ?? '').filter(m => !m.deleted_at).toArray()
  , [detailSpace?.id]) || [];
  const myRoleInDetail = allMembers.find(m => m.user_id === user?.id)?.role;

  const allAccounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const spaceAccounts = allAccounts.filter(a => a.space_id === detailSpace?.id && !a.deleted_at);
  // Cible de fusion : tout compte actif autre que la source, personnel ou d'un autre
  // espace — cohérent avec la fusion depuis la page Comptes (ex: Personnel -> Ferme).
  const mergeTargets = allAccounts.filter(a => !a.deleted_at && a.id !== accountToMerge?.id);

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success('Code copié');
  };

  const handleLeave = async (space: DBSpace) => {
    if (!user) return;
    if (space.owner_id === user.id) {
      toast.error('Le chef ne peut pas quitter son propre espace pour le moment.');
      return;
    }
    try {
      await leaveSpace(space.id, user.id);
      if (activeSpaceId === space.id) setActiveSpaceId(null);
      toast.success(`Vous avez quitté "${space.name}"`);
      setDetailSpace(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user || !detailSpace) return;
    try {
      await removeMember(memberId, detailSpace.id, user.id);
      toast.success('Membre retiré');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return (
    <>
      <Header title="Mes espaces" showBack />
      <div className="p-4 space-y-5 pb-24">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-11">
            <Plus className="w-4 h-4" /> Créer
          </Button>
          <Button onClick={() => setIsJoinOpen(true)} variant="outline" className="gap-2 h-11">
            <KeyRound className="w-4 h-4" /> Rejoindre
          </Button>
        </div>

        {mySpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-40" />
            <p className="font-semibold text-foreground">Aucun espace partagé</p>
            <p className="text-sm mt-1 text-center max-w-xs">
              Créez un espace Famille ou Entreprise pour partager comptes, budgets et objectifs avec d&apos;autres personnes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mySpaces.map(space => {
              const membership = memberships.find(m => m.space_id === space.id);
              return (
                <button
                  key={space.id}
                  onClick={() => setDetailSpace(space)}
                  className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-4 text-left transition-shadow hover:shadow-sm"
                >
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {space.type === 'business' ? <Briefcase className="w-5 h-5 text-primary" /> : <Users className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{space.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {membership?.role === 'chef' && <Crown className="w-3 h-3 text-status-warning" />}
                      {membership?.role === 'chef' ? 'Chef' : 'Membre'} · {space.type === 'business' ? 'Entreprise' : 'Famille'}
                    </p>
                  </div>
                  {activeSpaceId === space.id && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">Actif</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Nouvel espace</DialogTitle></DialogHeader>
          <SpaceForm onSuccess={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Rejoindre un espace</DialogTitle></DialogHeader>
          <JoinSpaceForm onSuccess={() => setIsJoinOpen(false)} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!detailSpace} onOpenChange={(open) => !open && setDetailSpace(null)}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{detailSpace?.name}</DrawerTitle></DrawerHeader>
          {detailSpace && (
            <div className="p-4 pb-6 space-y-4">
              <div className="bg-muted rounded-xl p-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">Code d&apos;invitation</p>
                <p className="text-2xl font-mono font-bold tracking-[0.3em]">{detailSpace.invite_code}</p>
                <button
                  onClick={() => copyCode(detailSpace.invite_code)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier et partager
                </button>
              </div>

              {spaceAccounts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Comptes de l&apos;espace ({spaceAccounts.length})
                  </p>
                  <div className="space-y-1.5">
                    {spaceAccounts.map(account => (
                      <div key={account.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <Wallet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{account.name}</span>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatAmount(account.balance, account.currency)}</span>
                        </div>
                        {myRoleInDetail === 'chef' && (
                          <button
                            onClick={() => setAccountToMerge(account)}
                            title="Transférer vers un autre compte"
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Membres ({allMembers.length})
                </p>
                <div className="space-y-1.5">
                  {allMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2 min-w-0">
                        {member.role === 'chef' && <Crown className="w-3.5 h-3.5 text-status-warning shrink-0" />}
                        <span className="text-sm truncate">{member.full_name}</span>
                        {member.user_id === user?.id && <span className="text-[10px] text-muted-foreground shrink-0">(vous)</span>}
                      </div>
                      {myRoleInDetail === 'chef' && member.user_id !== user?.id && (
                        <button onClick={() => handleRemoveMember(member.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {myRoleInDetail === 'chef' && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Dépenses par membre · ce mois-ci
                  </p>
                  <MemberSpendingReport spaceId={detailSpace.id} members={allMembers} />
                </div>
              )}

              {myRoleInDetail !== 'chef' && (
                <Button variant="outline" className="w-full gap-2 text-destructive" onClick={() => handleLeave(detailSpace)}>
                  <LogOut className="w-4 h-4" /> Quitter l&apos;espace
                </Button>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <MergeAccountDialog
        key={accountToMerge?.id ?? 'none'}
        open={!!accountToMerge}
        onOpenChange={(open) => !open && setAccountToMerge(null)}
        sourceAccount={accountToMerge}
        targetOptions={mergeTargets}
      />
    </>
  );
}
