'use client';

import { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';
import { verifyPin } from '@/lib/security/pin';

export function PinLock({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [pinHash, setPinHash] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const savedHash = localStorage.getItem('kabacash_pin_hash');
    if (savedHash) {
      setPinHash(savedHash);
      setIsLocked(true);
    }
  }, []);

  const handleKeyPress = async (num: number) => {
    if (inputPin.length < 4) {
      const newPin = inputPin + num;
      setInputPin(newPin);
      
      if (newPin.length === 4) {
        const isValid = await verifyPin(newPin, pinHash);
        if (isValid) {
          setIsLocked(false);
          setInputPin('');
        } else {
          setError(true);
          setTimeout(() => {
            setInputPin('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setInputPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Code PIN requis</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center">
          Veuillez entrer votre code de sécurité pour accéder à FinaX.
        </p>

        {/* Dots */}
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-colors ${
                error ? 'bg-destructive' :
                i < inputPin.length ? 'bg-primary' : 'bg-muted'
              }`} 
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-secondary text-2xl font-semibold flex items-center justify-center active:bg-primary active:text-white transition-colors"
            >
              {num}
            </button>
          ))}
          <div /> {/* Empty space */}
          <button
            onClick={() => handleKeyPress(0)}
            className="w-16 h-16 rounded-full bg-secondary text-2xl font-semibold flex items-center justify-center active:bg-primary active:text-white transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-secondary text-2xl font-semibold flex items-center justify-center active:bg-destructive active:text-white transition-colors"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
