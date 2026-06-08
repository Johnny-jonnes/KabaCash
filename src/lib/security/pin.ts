/**
 * Utilitaires de hachage simple pour le PIN
 * Utilise l'API Web Crypto (disponible offline, sans dépendance)
 */

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'kabacash_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(inputPin: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPin(inputPin);
  return inputHash === storedHash;
}
