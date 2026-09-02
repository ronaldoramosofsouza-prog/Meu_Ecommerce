import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';

const authRoutes = Router();

// Rate limiting — protege /auth/login e /auth/registro contra brute force
// e abuso de cadastro. Configuração da v8 (opção `limit`, headers draft-7).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 20, // máx. 20 tentativas de login por janela
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { mensagem: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});

const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 10, // máx. 10 cadastros por janela (IP)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { mensagem: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' },
});

authRoutes.post('/auth/registro', registroLimiter, AuthController.registrar);
authRoutes.post('/auth/login', loginLimiter, AuthController.login);

export { authRoutes };
