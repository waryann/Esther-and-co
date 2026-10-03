/** Garde-fous de production : refuse de démarrer avec des valeurs par défaut non sécurisées. */
export const isProd = () => process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";

export function secretEnv(name: string, devFallback: string): string {
  const v = process.env[name];
  if (v && v.length >= 16) return v;
  if (isProd()) throw new Error(`Variable d'environnement ${name} manquante ou trop courte (16 caractères minimum) en production.`);
  return v || devFallback;
}

/** Le prestataire « mock » permet de « payer » sans argent : interdit en production sauf autorisation explicite. */
export function mockPaymentsAllowed(): boolean {
  return !isProd() || process.env.ALLOW_MOCK_PAYMENTS === "true";
}
