'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { createSpace } from '@/lib/spaces/spaceActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import type { SpaceType } from '@/types/enums';

export function SpaceForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const { setActiveSpaceId } = useSpaceStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType>('family');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || name.trim().length < 2) {
      toast.error('Le nom doit contenir au moins 2 caractères');
      return;
    }
    setIsSubmitting(true);
    try {
      const space = await createSpace(user.id, name.trim(), type);
      setActiveSpaceId(space.id);
      toast.success(`Espace "${space.name}" créé — code : ${space.invite_code}`, { duration: 6000 });
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button" onClick={() => setType('family')}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 ${
            type === 'family' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
          }`}
        >
          <Users className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Famille</span>
        </button>
        <button
          type="button" onClick={() => setType('business')}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 ${
            type === 'business' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
          }`}
        >
          <Briefcase className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Entreprise</span>
        </button>
      </div>

      <div className="space-y-2">
        <Label>Nom de l&apos;espace <span className="text-destructive">*</span></Label>
        <Input
          placeholder={type === 'family' ? 'Ex: Famille Diallo' : 'Ex: Boutique Madina'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Un code d&apos;invitation sera généré pour inviter d&apos;autres personnes. Cette action nécessite une connexion internet.
      </p>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Création...' : "Créer l'espace"}
      </Button>
    </form>
  );
}
