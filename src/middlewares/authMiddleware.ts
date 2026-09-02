import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type Role = 'CLIENTE' | 'ENTREGADOR' | 'ADMIN' | 'RESTAURANTE';

export interface UsuarioPayload {
  id: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioPayload;
    }
  }
}

// Papéis válidos no payload do token — rejeita tokens com papel desconhecido.
const ROLES_VALIDAS: Role[] = ['CLIENTE', 'ENTREGADOR', 'ADMIN', 'RESTAURANTE'];

// Falha rápida se JWT_SECRET não estiver definido — nada de fallback inseguro.
// Retorna string (narrowing estático): uma função marcada como string garante o
// tipo, diferente do padrão const + if que não propaga para closures hoisted.
function obterJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET.');
  }
  return secret;
}
const JWT_SECRET = obterJwtSecret();

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ mensagem: 'Erro no formato do token.' });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ mensagem: 'Token malformatado. Deve ser Bearer.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UsuarioPayload;

    // Rejeita tokens com payload incompleto ou papel desconhecido — sem
    // downgrade silencioso de role.
    if (!decoded?.id || !decoded?.email || !ROLES_VALIDAS.includes(decoded.role)) {
      throw new Error('Token com payload incompleto.');
    }

    req.usuario = { id: decoded.id, email: decoded.email, role: decoded.role };

    return next();
  } catch (error) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}
