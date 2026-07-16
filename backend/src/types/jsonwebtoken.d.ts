declare module 'jsonwebtoken' {
  export type Secret = string;

  export type SignOptions = {
    expiresIn?: string | number;
  };

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: Secret,
    options?: SignOptions,
  ): string;
}
