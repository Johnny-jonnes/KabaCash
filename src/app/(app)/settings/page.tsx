'use client';

import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { 
  User, 
  Bell, 
  Shield, 
  Tags, 
  Database, 
  LogOut, 
  HelpCircle,
  Moon,
  Sun,
  Globe,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    router.push('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast.success(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`);
  };

  const comingSoon = (feature: string) => {
    toast.info(`${feature} — Bientôt disponible !`, {
      description: 'Cette fonctionnalité sera ajoutée dans une prochaine mise à jour.',
    });
  };

  // Initiales de l'utilisateur
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Utilisateur';
  const initials = displayName !== 'Utilisateur'
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) 
    : 'KC';

  const sections = [
    {
      title: 'Mon Compte',
      items: [
        { icon: User, label: 'Profil personnel', href: '/settings/profile' },
        { icon: Shield, label: 'Sécurité et PIN', href: '/settings/security' },
        { icon: Bell, label: 'Notifications', href: '/settings/notifications' },
      ]
    },
    {
      title: 'Application',
      items: [
        { icon: Tags, label: 'Gérer les catégories', href: '/categories' },
        { icon: theme === 'dark' ? Sun : Moon, label: theme === 'dark' ? 'Mode clair' : 'Mode sombre', action: toggleTheme },
        { icon: Globe, label: 'Langue (Français)', action: () => comingSoon('Gestion de la langue') },
      ]
    },
    {
      title: 'Avancé',
      items: [
        { icon: Database, label: 'Sauvegarde & Synchro', href: '/settings/sync' },
        { icon: HelpCircle, label: 'Aide et support', href: '/settings/help' },
      ]
    }
  ];

  return (
    <>
      <Header title="Paramètres" />
      <div className="p-4 space-y-6">
        
        {/* Profil utilisateur */}
        <div className="flex items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="w-14 h-14 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{user?.phone || '+224 ...'}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                {section.title}
              </h3>
              <Card className="shadow-sm border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {section.items.map((item, i) => {
                      const content = (
                        <>
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium flex-1">{item.label}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        </>
                      );

                      if ('href' in item && item.href) {
                        return (
                          <Link key={i} href={item.href} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                            {content}
                          </Link>
                        );
                      }

                      return (
                        <button 
                          key={i} 
                          onClick={'action' in item ? item.action : undefined}
                          className="flex items-center w-full gap-3 p-4 hover:bg-muted/50 transition-colors"
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Bouton déconnexion */}
        <Button 
          variant="destructive" 
          className="w-full gap-2 mt-4" 
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </Button>
        
        <p className="text-center text-xs text-muted-foreground mt-8 pb-4">
          KabaCash v1.0.0
        </p>

      </div>
    </>
  );
}
