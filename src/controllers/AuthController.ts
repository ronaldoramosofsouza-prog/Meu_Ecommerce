import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UsuarioRepository, Role } from '../repositories/UsuarioRepository';
import { EntregadorRepository } from '../repositories/EntregadorRepository';

const ROLES_PERMITIDAS: Role[] = ['CLIENTE', 'ENTREGADOR', 'ADMIN', 'RESTAURANTE'];

// Falha rápida se JWT_SECRET não estiver definido — nada de fallback inseguro.
// Retorna string (narrowing estático): uma função marcada como string garante o
// tipo, diferente do padrão const + if que não propaga para métodos hoisted.
function obterJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET.');
  }
  return secret;
}
const JWT_SECRET = obterJwtSecret();

export class AuthController {
  // POST /api/auth/register
  static async registrar(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, email, senha, role } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' });
      }

      // Validação de formato/tamanho — o banco só recebe dados minimamente sãos.
      if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 100) {
        return res.status(400).json({ mensagem: 'Nome deve ter entre 2 e 100 caracteres.' });
      }

      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ mensagem: 'E-mail em formato inválido.' });
      }

      // 8..72: mínimo razoável + limite do bcrypt (72 bytes).
      if (typeof senha !== 'string' || senha.length < 8 || senha.length > 72) {
        return res.status(400).json({ mensagem: 'A senha deve ter entre 8 e 72 caracteres.' });
      }

      // 1. Define 'CLIENTE' como padrão ou valida a role enviada
      let usuarioRole: Role = 'CLIENTE';

      if (role) {
        const roleUpper = String(role).toUpperCase() as Role;
        if (!ROLES_PERMITIDAS.includes(roleUpper)) {
          return res.status(400).json({
            mensagem: `Papel inválido. Os valores permitidos são: ${ROLES_PERMITIDAS.join(', ')}.`,
          });
        }
        usuarioRole = roleUpper;
      }

      // ----------------------------------------------------------------------
      // 🔒 TRAVA DE SEGURANÇA: Bloqueia self-registration como ADMIN
      // ----------------------------------------------------------------------
      if (usuarioRole === 'ADMIN') {
        return res.status(400).json({
          mensagem: 'Não é permitido se cadastrar como administrador diretamente.',
        });
      }

      // 2. Verifica se o e-mail já existe no banco
      const usuarioExistente = await UsuarioRepository.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(409).json({ mensagem: 'E-mail já cadastrado.' });
      }

      // 3. Hash da senha e persistência do usuário
      const senhaHash = await bcrypt.hash(senha, 10);
      const novoUsuario = await UsuarioRepository.criar({
        nome,
        email,
        senha_hash: senhaHash,
        role: usuarioRole,
      });

      // 3.1. Entregador precisa de um perfil próprio (status, veículo, GPS) para
      // poder aceitar entregas — sem isso a vinculação a um pedido falha.
      if (usuarioRole === 'ENTREGADOR' && novoUsuario.id) {
        await EntregadorRepository.criarPerfil(novoUsuario.id);
      }

      // 4. Geração do token JWT com o campo role incluído
      const token = jwt.sign(
        { id: novoUsuario.id, email: novoUsuario.email, role: novoUsuario.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.status(201).json({
        mensagem: 'Usuário cadastrado com sucesso!',
        usuario: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          role: novoUsuario.role,
        },
        token,
      });
    } catch (error) {
      console.error('Erro no registro de usuário:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao registrar usuário.' });
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios.' });
      }

      const usuario = await UsuarioRepository.buscarPorEmail(email);
      if (!usuario) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
      }

      // Emite token contendo a role cadastrada no banco
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, role: usuario.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.status(200).json({
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
        },
        token,
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao realizar login.' });
    }
  }
}
