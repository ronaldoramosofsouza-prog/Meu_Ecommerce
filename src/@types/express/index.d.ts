export interface UsuarioPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioPayload;
    }
  }
}
