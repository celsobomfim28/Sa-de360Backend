import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      cpf: string;
      role: string;
      microAreaId?: string;
      fullName?: string;
    };
  }
}
