'use client';

import { 
  ShoppingCart, Home, Car, HeartPulse, GraduationCap, Smartphone, Send, Laptop,
  HardHat, Package, TrendingUp, PartyPopper, Zap, Fuel, Gift, Coffee, ClipboardList,
  Banknote, Store, Wrench, Download, Sparkles, Tag, Utensils, Shirt, Scissors,
  BookOpen, Briefcase, CreditCard, DollarSign, FileText, Folder, Heart, 
  type LucideIcon
} from 'lucide-react';

// Map des noms d'icônes vers les composants Lucide
export const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'home': Home,
  'car': Car,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'smartphone': Smartphone,
  'send': Send,
  'laptop': Laptop,
  'hard-hat': HardHat,
  'package': Package,
  'trending-up': TrendingUp,
  'party-popper': PartyPopper,
  'zap': Zap,
  'fuel': Fuel,
  'gift': Gift,
  'coffee': Coffee,
  'clipboard-list': ClipboardList,
  'banknote': Banknote,
  'store': Store,
  'wrench': Wrench,
  'download': Download,
  'sparkles': Sparkles,
  'tag': Tag,
  'utensils': Utensils,
  'shirt': Shirt,
  'scissors': Scissors,
  'book-open': BookOpen,
  'briefcase': Briefcase,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'file-text': FileText,
  'folder': Folder,
  'heart': Heart,
};

// Liste des icônes disponibles pour le formulaire de création
export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ name, color, size = 20, className }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent className={className} style={{ color }} size={size} />;
}
