import React, { useEffect, useState, useMemo } from 'react';
import './ManageUsers.css';
import { appConfig } from '../../config';
import {
  People as PeopleIcon,
  CheckCircle as ApprovedIcon,
  Block as BlockedIcon,
  Delete as DeleteIcon,
  LockOpen as UnblockIcon,
  ExpandMore as ExpandIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AccountBalanceWallet as WalletIcon,
  CalendarMonth as DateIcon,
  CardMembership as MemberIcon,
  AdminPanelSettings as AdminIcon,
  PersonAdd as RegisteredIcon,
} from '@mui/icons-material';

interface User {
  _id: string;
  name: string;
  email: string;
  walletAddress: string;
  status: 'member' | 'registered' | 'admin' | 'blocked';
  nftTokenIds?: string[];
  createdAt: string;
}

const USERS_PER_PAGE = 10;

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/users`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
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
    fetchUsers();
  }, []);

  const handleToggleExpand = (userId: string) => {
    setExpandedUserId(prev => (prev === userId ? null : userId));
  };

  const handleBlockUnblock = async (userId: string, status: string) => {
    const action = status === 'approved' ? 'block' : 'unblock';
    const actionPt = status === 'approved' ? 'bloquear' : 'desbloquear';
    const confirmed = window.confirm(`Tem certeza que deseja ${actionPt} este usuário?`);
    if (!confirmed) return;

    setActionUserId(userId);
    try {
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/users/${action}/${userId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Usuário ${actionPt}ado com sucesso!`);
        fetchUsers();
      } else {
        alert(data.message || `Erro ao ${actionPt} usuário.`);
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
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Usuário excluído com sucesso!');
        fetchUsers();
      } else {
        alert(data.message || 'Erro ao excluir usuário.');
      }
    } catch {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setActionUserId(null);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = users.length;
    const members = users.filter(u => u.status === 'member').length;
    const registered = users.filter(u => u.status === 'registered').length;
    const admins = users.filter(u => u.status === 'admin').length;
    const blocked = users.filter(u => u.status === 'blocked').length;
    return { total, members, registered, admins, blocked };
  }, [users]);

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="manage-users-container">
        <div className="loading-container">
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-users-container">
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-users-container">
      {/* Header */}
      <div className="manage-users-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Gerenciar Usuários</h1>
            <p className="page-subtitle">
              Visualize, bloqueie ou exclua usuários registrados na plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-container">
          <div className="stat-item">
            <PeopleIcon className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          <div className="stat-item">
            <MemberIcon className="stat-icon member" />
            <div className="stat-content">
              <span className="stat-value">{stats.members}</span>
              <span className="stat-label">Membros</span>
            </div>
          </div>
          <div className="stat-item">
            <RegisteredIcon className="stat-icon registered" />
            <div className="stat-content">
              <span className="stat-value">{stats.registered}</span>
              <span className="stat-label">Registrados</span>
            </div>
          </div>
          <div className="stat-item">
            <AdminIcon className="stat-icon admin" />
            <div className="stat-content">
              <span className="stat-value">{stats.admins}</span>
              <span className="stat-label">Admins</span>
            </div>
          </div>
          <div className="stat-item">
            <BlockedIcon className="stat-icon blocked" />
            <div className="stat-content">
              <span className="stat-value">{stats.blocked}</span>
              <span className="stat-label">Bloqueados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {paginatedUsers.length === 0 ? (
          <div className="empty-state">
            <PeopleIcon className="empty-icon" />
            <h3 className="empty-title">Nenhum usuário encontrado</h3>
            <p className="empty-text">
              Não há usuários aprovados no sistema no momento.
            </p>
          </div>
        ) : (
          <div className="users-list">
            {paginatedUsers.map(user => (
              <div
                key={user._id}
                className={`user-card ${expandedUserId === user._id ? 'expanded' : ''}`}
              >
                <div 
                  className="user-card-header"
                  onClick={() => handleToggleExpand(user._id)}
                >
                  <div className="user-info">
                    <PersonIcon className="user-avatar" />
                    <div className="user-name-wrapper">
                      <h3 className="user-name">{user.name}</h3>
                      <span className={`user-status ${user.status}`}>
                        {user.status === 'member' && (
                          <>
                            <MemberIcon className="status-icon" />
                            Membro
                          </>
                        )}
                        {user.status === 'registered' && (
                          <>
                            <RegisteredIcon className="status-icon" />
                            Registrado
                          </>
                        )}
                        {user.status === 'admin' && (
                          <>
                            <AdminIcon className="status-icon" />
                            Admin
                          </>
                        )}
                        {user.status === 'blocked' && (
                          <>
                            <BlockedIcon className="status-icon" />
                            Bloqueado
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <ExpandIcon className={`expand-icon ${expandedUserId === user._id ? 'rotated' : ''}`} />
                </div>

                {expandedUserId === user._id && (
                  <div className="user-card-body">
                    <div className="user-details">
                      <div className="detail-item">
                        <EmailIcon className="detail-icon" />
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{user.email}</span>
                      </div>

                      <div className="detail-item">
                        <WalletIcon className="detail-icon" />
                        <span className="detail-label">Carteira</span>
                        <span className="detail-value">{user.walletAddress}</span>
                      </div>

                      <div className="detail-item">
                        <DateIcon className="detail-icon" />
                        <span className="detail-label">Data</span>
                        <span className="detail-value">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Show NFT IDs if user has any */}
                      {user.nftTokenIds && user.nftTokenIds.length > 0 && (
                        <div className="detail-item">
                          <MemberIcon className="detail-icon nft-icon" />
                          <span className="detail-label">NFT IDs</span>
                          <div className="nft-list">
                            {user.nftTokenIds.map((nftId, index) => (
                              <span key={index} className="nft-badge">
                                {nftId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="user-actions">
                      {/* Only show block/unblock for non-admin users */}
                      {user.status !== 'admin' && (
                        <button
                          className={`action-btn ${user.status === 'blocked' ? 'unblock' : 'block'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlockUnblock(user._id, user.status);
                          }}
                          disabled={actionUserId === user._id}
                        >
                          {actionUserId === user._id ? (
                            'Processando...'
                          ) : user.status === 'blocked' ? (
                            <>
                              <UnblockIcon />
                              Desbloquear
                            </>
                          ) : (
                            <>
                              <BlockedIcon />
                              Bloquear
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete button (also disabled for admins) */}
                      <button
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user._id);
                        }}
                        disabled={actionUserId === user._id || user.status === 'admin'}
                        title={user.status === 'admin' ? 'Admins não podem ser excluídos' : 'Excluir usuário'}
                      >
                        {actionUserId === user._id ? (
                          'Excluindo...'
                        ) : (
                          <>
                            <DeleteIcon />
                            Excluir
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            <span className="pagination-info">
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
