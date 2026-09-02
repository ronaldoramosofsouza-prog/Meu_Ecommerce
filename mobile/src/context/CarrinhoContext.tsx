// Carrinho de compras — um único restaurante por carrinho.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Produto } from '../types';

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

interface CarrinhoContexto {
  itens: ItemCarrinho[];
  restauranteId: string | null;
  total: number;
  quantidadeTotal: number;
  adicionarItem: (produto: Produto, quantidade?: number) => void;
  removerItem: (produtoId: string) => void;
  alterarQuantidade: (produtoId: string, quantidade: number) => void;
  limparCarrinho: () => void;
}

const Contexto = createContext<CarrinhoContexto | undefined>(undefined);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  // O carrinho só aceita itens de um restaurante por vez.
  const adicionarItem = useCallback((produto: Produto, quantidade = 1) => {
    setItens((atual) => {
      const primeiro = atual[0];
      if (primeiro && primeiro.produto.restaurante_id !== produto.restaurante_id) {
        return [{ produto, quantidade }];
      }
      const existente = atual.find((i) => i.produto.id === produto.id);
      if (existente) {
        return atual.map((i) =>
          i.produto.id === produto.id
            ? { ...i, quantidade: i.quantidade + quantidade }
            : i,
        );
      }
      return [...atual, { produto, quantidade }];
    });
  }, []);

  const removerItem = useCallback((produtoId: string) => {
    setItens((atual) => atual.filter((i) => i.produto.id !== produtoId));
  }, []);

  const alterarQuantidade = useCallback((produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      setItens((atual) => atual.filter((i) => i.produto.id !== produtoId));
      return;
    }
    setItens((atual) =>
      atual.map((i) => (i.produto.id === produtoId ? { ...i, quantidade } : i)),
    );
  }, []);

  const limparCarrinho = useCallback(() => setItens([]), []);

  const restauranteId = itens[0]?.produto.restaurante_id ?? null;

  const total = useMemo(
    () => itens.reduce((soma, i) => soma + Number(i.produto.preco || 0) * i.quantidade, 0),
    [itens],
  );

  const quantidadeTotal = useMemo(
    () => itens.reduce((soma, i) => soma + i.quantidade, 0),
    [itens],
  );

  const valor = useMemo<CarrinhoContexto>(
    () => ({
      itens,
      restauranteId,
      total,
      quantidadeTotal,
      adicionarItem,
      removerItem,
      alterarQuantidade,
      limparCarrinho,
    }),
    [itens, restauranteId, total, quantidadeTotal, adicionarItem, removerItem, alterarQuantidade, limparCarrinho],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrinho(): CarrinhoContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider');
  return ctx;
}
