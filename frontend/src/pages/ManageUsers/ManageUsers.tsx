import React, { useEffect, useState } from 'react';
import './ManageUsers.css';
import { appConfig } from '../../config';

interface JoinRequest {
  _id: string;
  fullName: string;
  email: string;
  walletAddress: string;
  status: string;
  createdAt: string;
}

const USERS_PER_PAGE = 10;

export default function ApprovedUsersPage() {
  const [users, setUsers] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchApprovedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request?status=approved`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.joinRequests);
      } else {
        setError(data.message || 'Erro ao buscar usuários.');
      }
    } catch (e) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedUsers();
  }, []);

  const handleToggleExpand = (userId: string) => {
    setExpandedUserId(prev => (prev === userId ? null : userId));
  };

  const handleBlockUnblock = async (userId: string, status: string) => {
    const action = status === 'approved' ? 'bloquear' : 'desbloquear';
    const confirmed = window.confirm(`Tem certeza que deseja ${action} este usuário?`);
    if (!confirmed) return;

    setActionUserId(userId);
    try {
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request/${action}/${userId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Usuário ${action}ado com sucesso!`);
        fetchApprovedUsers();
      } else {
        alert(data.message || `Erro ao ${action} usuário.`);
      }
    } catch {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.');
    if (!confirmed) return;

    setActionUserId(userId);
    try {
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Usuário excluído com sucesso!');
        fetchApprovedUsers();
      } else {
        alert(data.message || 'Erro ao excluir usuário.');
      }
    } catch {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setActionUserId(null);
    }
  };

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  return (
    <div className="container">
      <div className="loginRequest">
        <h2 className="titulo">Usuários Aprovados</h2>

        {loading && <p>Carregando...</p>}
        {error && <p className="error_message">{error}</p>}

        {!loading && !error && paginatedUsers.length === 0 && (
          <p>Nenhum usuário aprovado encontrado.</p>
        )}

        {!loading && !error && paginatedUsers.map(user => (
          <div
            key={user._id}
            style={{
              border: '1px solid var(--border-color)',
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '12px',
              background: 'var(--bg-surface-2)',
              cursor: 'pointer'
            }}
            onClick={() => handleToggleExpand(user._id)}
          >
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              {user.fullName}
            </strong>

            {expandedUserId === user._id && (
              <div className="request-details">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Carteira:</strong> {user.walletAddress}</p>
                <p><strong>Status:</strong> {user.status}</p>
                <p><strong>Data:</strong> {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="botao_submit small"
                    style={{ background: 'red' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBlockUnblock(user._id, user.status);
                    }}
                    disabled={actionUserId === user._id}
                  >
                    {actionUserId === user._id ? 'Processando...' : user.status === 'approved' ? 'Bloquear' : 'Desbloquear'}
                  </button>

                  <button
                    className="botao_submit small"
                    style={{ background: '#444', color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user._id);
                    }}
                    disabled={actionUserId === user._id}
                  >
                    {actionUserId === user._id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Paginação */}
        {totalPages > 1 && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button
              className="botao_submit small secondary"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center' }}>Página {currentPage} de {totalPages}</span>
            <button
              className="botao_submit small secondary"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
