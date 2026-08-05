export {};

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: string;
      id?: string;
      _id?: any;
      name?: string;
      isBlocked?: boolean;
      isEmailVerified?: boolean;
    }
  }
}
