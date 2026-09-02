import bcrypt from 'bcrypt';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

export async function criarAdminInicial() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sistema.com';
    const adminSenha = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminNome = process.env.ADMIN_NOME || 'Administrador Sistema';

    // 1. Verifica se o admin já existe
    const usuarioExistente = await UsuarioRepository.buscarPorEmail(adminEmail);

    if (!usuarioExistente) {
      console.log('⚡ Criando usuário administrador inicial...');

      const senhaHash = await bcrypt.hash(adminSenha, 10);

      await UsuarioRepository.criar({
        nome: adminNome,
        email: adminEmail,
        senha_hash: senhaHash,
        role: 'ADMIN',
      });

      console.log(`✅ Administrador inicial criado com sucesso! (${adminEmail})`);
    } else {
      console.log('ℹ️ Administrador inicial já cadastrado.');
    }
  } catch (error) {
    console.error('❌ Erro ao criar administrador inicial:', error);
  }
}
