import { Request, Response, NextFunction } from 'express';
import { Role } from '../repositories/UsuarioRepository';

/**
 * Middleware que verifica se o usuário autenticado possui uma das roles permitidas.
 * DEVE ser executado após o authMiddleware.
 */
export function autorizarRole(...rolesPermitidas: Role[]) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    // 1. Garante que o authMiddleware já foi executado
    if (!req.usuario) {
      return res.status(401).json({
        mensagem: 'Não autorizado. Usuário não autenticado.',
      });
    }

    const { role } = req.usuario;

    // 2. Checa se a role do usuário está inclusa na lista de permissões da rota
    if (!rolesPermitidas.includes(role)) {
      return res.status(403).json({
        mensagem: `Acesso negado. O perfil '${role}' não tem permissão para acessar este recurso.`,
      });
    }

    // 3. Permissão concedida, prossegue para o Controller
    return next();
  };
}
