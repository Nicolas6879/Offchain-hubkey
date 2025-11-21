import React, { useState, useEffect } from "react";
import "./ApproveJoin.css";
import { appConfig } from "../../config";

interface Solicitacao {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  walletAddress: string;
  dataSolicitacao: string;
  categoria?: 'user' | 'admin';
}

const ITEMS_PER_PAGE = 10;

export default function HubAccessApprovalPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [categorias, setCategorias] = useState<Record<string, 'user' | 'admin'>>({});

  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        const res = await fetch(appConfig.networks.testnet.backendUrl + "/api/join-request");
        const data = await res.json();

        if (data.success && Array.isArray(data.joinRequests)) {
          const formatted = data.joinRequests
            .filter((item: any) => item.status === "pending")
            .map((item: any) => ({
              id: item._id,
              fullName: item.fullName,
              email: item.email,
              phone: item.phone || "",
              walletAddress: item.walletAddress,
              dataSolicitacao: new Date(item.createdAt).toLocaleString(),
            }));

          const defaultCats = Object.fromEntries(formatted.map((s: Solicitacao) => [s.id, 'user']));
          setCategorias(defaultCats);
          setSolicitacoes(formatted);
          setCurrentPage(1);
        } else {
          setSolicitacoes([]);
          setMessage({ type: 'error', text: 'Erro ao carregar solicitações' });
        }
      } catch (error) {
        console.error("Erro ao buscar solicitações:", error);
        setSolicitacoes([]);
        setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitacoes();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleApprove = async (id: string) => {
    const solicitacao = solicitacoes.find(s => s.id === id);
    if (!solicitacao) return;
    const categoria = categorias[id] || 'user';

    const confirmed = window.confirm(
      `Tem certeza que deseja APROVAR a solicitação de ${solicitacao.fullName} com categoria '${categoria}'?\n\nEsta ação irá gerar uma chave NFT para o usuário.`
    );

    if (!confirmed) return;

    setProcessingId(id);
    setMessage(null);

    try {
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.message || 'Erro ao aprovar solicitação' });
        return;
      }

      const mintRes = await fetch(`${appConfig.networks.testnet.backendUrl}/api/nft/mint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: solicitacao.id,
          name: solicitacao.fullName,
          email: solicitacao.email,
          walletAddress: solicitacao.walletAddress,
          metadata: JSON.stringify({
            approvedBy: "admin",
            approvedAt: new Date().toISOString(),
            categoria
          }),
        }),
      });

      const mintData = await mintRes.json();

      if (!mintRes.ok || !mintData.success) {
        setMessage({
          type: 'error',
          text: mintData.message || 'Solicitação aprovada, mas erro ao mintar NFT.',
        });
      } else {
        setMessage({
          type: 'success',
          text: `Solicitação de ${solicitacao.fullName} aprovada e NFT gerada com sucesso!`,
        });
      }

      setSolicitacoes((prev) => prev.filter((s) => s.id !== id));
      setExpandedId(null);
    } catch (error) {
      console.error("Erro ao aprovar e mintar NFT:", error);
      setMessage({ type: 'error', text: 'Erro de conexão ao aprovar e mintar NFT' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const solicitacao = solicitacoes.find(s => s.id === id);
    if (!solicitacao) return;

    const reason = window.prompt(
      `Rejeitando solicitação de: ${solicitacao.fullName}\n\nDigite o motivo da rejeição:`,
      'Não atende aos critérios de admissão'
    );

    if (!reason || reason.trim() === '') return;

    const confirmed = window.confirm(
      `Tem certeza que deseja REJEITAR a solicitação de ${solicitacao.fullName}?\n\nMotivo: ${reason}`
    );

    if (!confirmed) return;

    setProcessingId(id);
    setMessage(null);

    try {
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSolicitacoes((prev) => prev.filter((s) => s.id !== id));
        setMessage({ type: 'success', text: `Solicitação de ${solicitacao.fullName} rejeitada.` });
        setExpandedId(null);
      } else {
        setMessage({ type: 'error', text: data.message || 'Erro ao rejeitar solicitação' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão ao rejeitar solicitação' });
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = Math.ceil(solicitacoes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = solicitacoes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedId(null);
    }
  };

  return (
    <div className="approval-container">
      <h1 className="titulo">Solicitações de Acesso</h1>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button
            className="message-close"
            onClick={() => setMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <p>Carregando solicitações...</p>
        </div>
      ) : solicitacoes.length === 0 ? (
        <p>Nenhuma solicitação pendente.</p>
      ) : (
        <>
          <ul className="solicitacoes-lista">
            {currentItems.map((s) => (
              <li key={s.id} className="solicitacao-item">
                <div
                  className="solicitacao-cabecalho"
                  onClick={() => toggleExpand(s.id)}
                >
                  <strong>{s.fullName}</strong>
                  <span className="seta">{expandedId === s.id ? "▲" : "▼"}</span>
                </div>
                {expandedId === s.id && (
                  <div className="solicitacao-detalhes">
                    <p><strong>Email:</strong> {s.email}</p>
                    <p><strong>Telefone:</strong> {s.phone}</p>
                    <p><strong>Carteira:</strong> {s.walletAddress}</p>
                    <p><strong>Data da Solicitação:</strong> {s.dataSolicitacao}</p>

                    <div className="categoria-container">
                    <label htmlFor={`select-${s.id}`}><strong>Categoria:</strong></label>
                    <div className="select-wrapper">
                      <select
                        id={`select-${s.id}`}
                        className="select-categoria"
                        value={categorias[s.id] || 'user'}
                        onChange={(e) =>
                          setCategorias(prev => ({
                            ...prev,
                            [s.id]: e.target.value as 'user' | 'admin'
                          }))
                        }
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <span className="custom-arrow">▼</span>
                    </div>
                  </div>
                    <div className="botoes-wrapper">
                      <button
                        className="btn-aprovar"
                        disabled={processingId === s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(s.id);
                        }}
                      >
                        {processingId === s.id ? 'Aprovando...' : 'Aprovar'}
                      </button>
                      <button
                        className="btn-rejeitar"
                        disabled={processingId === s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(s.id);
                        }}
                      >
                        {processingId === s.id ? 'Rejeitando...' : 'Rejeitar'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="pagination">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {"<"} Anterior
            </button>
            <span> Página {currentPage} de {totalPages} </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima {">"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
