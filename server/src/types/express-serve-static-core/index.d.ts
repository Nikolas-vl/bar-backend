import 'express-serve-static-core';

interface OwnedResource {
  id: number;
  userId: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
    role?: 'USER' | 'ADMIN';
    log?: any;
    resource?: OwnedResource;
  }
}

export {};
