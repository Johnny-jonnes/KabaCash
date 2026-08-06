'use client';

import { useCallback, useRef, useState, type PointerEvent } from 'react';

interface UseItemGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  /** Appui bref sans glissement ni appui long — distinct de onClick natif pour ne jamais se déclencher pendant/après un swipe. */
  onTap?: () => void;
  swipeThreshold?: number;
  maxSwipe?: number;
  longPressDelay?: number;
  disabled?: boolean;
}

const MOVE_CANCELS_LONG_PRESS = 8; // px — au-delà, on considère que c'est un glissement, pas un appui long

/**
 * Gestes tactiles communs à toutes les listes (transactions, comptes, budgets) :
 * swipe gauche/droite (avec aperçu progressif avant déclenchement) et appui long,
 * dans un seul hook pour éviter que les deux gestes ne se déclenchent en même temps.
 */
export function useItemGestures({
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onTap,
  swipeThreshold = 72,
  maxSwipe = 96,
  longPressDelay = 500,
  disabled = false,
}: UseItemGesturesOptions) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const axis = useRef<'x' | 'y' | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (disabled) return;
    start.current = { x: e.clientX, y: e.clientY };
    axis.current = null;
    longPressFired.current = false;
    setIsDragging(true);

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
        onLongPress();
        setIsDragging(false);
      }, longPressDelay);
    }
  }, [disabled, onLongPress, longPressDelay]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (disabled || !isDragging || longPressFired.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    if (axis.current === null && (Math.abs(dx) > MOVE_CANCELS_LONG_PRESS || Math.abs(dy) > MOVE_CANCELS_LONG_PRESS)) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      clearLongPressTimer();
    }
    if (axis.current !== 'x') return;
    if ((dx < 0 && !onSwipeLeft) || (dx > 0 && !onSwipeRight)) return;
    setTranslateX(Math.max(-maxSwipe, Math.min(maxSwipe, dx)));
  }, [disabled, isDragging, onSwipeLeft, onSwipeRight, maxSwipe, clearLongPressTimer]);

  const end = useCallback(() => {
    clearLongPressTimer();
    setIsDragging(false);
    if (!longPressFired.current) {
      if (translateX <= -swipeThreshold) onSwipeLeft?.();
      else if (translateX >= swipeThreshold) onSwipeRight?.();
      // Ni glissement (axe jamais verrouillé, translateX resté à 0) ni appui long : un tap propre.
      else if (translateX === 0 && axis.current === null) onTap?.();
    }
    setTranslateX(0);
    axis.current = null;
  }, [translateX, swipeThreshold, onSwipeLeft, onSwipeRight, onTap, clearLongPressTimer]);

  return {
    translateX,
    // translateX ne devient non nul qu'une fois l'axe verrouillé sur 'x' (voir onPointerMove) :
    // pas besoin de relire la ref pendant le rendu pour savoir si le glissement horizontal est actif.
    isDragging: isDragging && translateX !== 0,
    revealProgress: Math.min(Math.abs(translateX) / swipeThreshold, 1),
    swipeDirection: translateX < 0 ? 'left' as const : translateX > 0 ? 'right' as const : null,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}
