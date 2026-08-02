'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { joinSpace } from '@/lib/spaces/spaceActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function JoinSpaceForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const { setActiveSpaceId } = useSpaceStore();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || code.trim().length < 4) {
      toast.error('Saisissez le code reçu');
      return;
    }
    setIsSubmitting(true);
    try {
      const space = await joinSpace(user.id, code.trim());
      setActiveSpaceId(space.id);
      toast.success(`Vous avez rejoint "${space.name}"`);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Code d&apos;invitation <span className="text-destructive">*</span></Label>
        <Input
          placeholder="Ex: A3F9K2"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          className="text-center text-lg tracking-[0.3em] font-mono uppercase"
        />
        <p className="text-xs text-muted-foreground">Demandez ce code au chef de famille ou au gérant.</p>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Vérification...' : "Rejoindre l'espace"}
      </Button>
    </form>
  );
}
