type FrontendEnv = Record<string, string | undefined>;

const env = (import.meta as ImportMeta & { env: FrontendEnv }).env || {};

export const requireFrontendEnv = (name: string, fallback?: string): string => {
  const value = env[name]?.trim() || fallback;
  if (!value) {
    throw new Error(`Missing required frontend env var: ${name}`);
  }
  return value;
};

export const getOptionalFrontendEnv = (name: string, fallback?: string): string | undefined => {
  const value = env[name]?.trim();
  return value || fallback || undefined;
};
