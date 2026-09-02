// Rota inicial de cada papel — evita conflito com a raiz "/" (dispatcher).
import { Role } from '../types';

export function destinoPorRole(role: Role): string {
  switch (role) {
    case 'CLIENTE':
      return '/home';
    case 'RESTAURANTE':
      return '/dashboard';
    case 'ENTREGADOR':
      return '/pedidos';
    case 'ADMIN':
      return '/kanban';
  }
}
