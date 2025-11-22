import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  AccountBalanceWallet as WalletIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  EventAvailable as EventAvailableIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EventBusy as EventBusyIcon,
  CardGiftcard as CardGiftcardIcon,
  Style as StyleIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import * as profileService from '../../services/profileService';
import "./Profile.css";

interface ProfileData {
  id: string;
  name?: string;
  email: string;
  bio?: string;
  walletAddress: string;
  nftCount: number;
  primaryNft?: {
    tokenId: string;
    serialNumber?: number;
    metadata?: any;
    imageUrl?: string;
  };
  isActive: boolean;
  createdAt: string;
  stats: {
    totalEvents: number;
    attendedEvents: number;
    upcomingEvents: number;
  };
}

interface EventHistoryItem {
  subscriptionId: string;
  status: 'active' | 'cancelled' | 'attended';
  subscribedAt: string;
  attendedAt?: string;
  rewardSent?: boolean;
  memberNftMinted?: boolean;
  event: {
    id: string;
    name: string;
    description?: string;
    location: string;
    photo?: string;
    eventDate: string;
    eventTime?: string;
    maxParticipants?: number;
    currentParticipants: number;
  } | null;
}

type EventTab = 'all' | 'active' | 'attended' | 'cancelled';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [eventHistory, setEventHistory] = useState<EventHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<EventTab>('all');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
  });

  // Check authentication
  useEffect(() => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) {
      navigate('/login');
      return;
    }

    fetchProfile();
    fetchEventHistory();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setEditForm({
        name: data.name || '',
        bio: data.bio || '',
      });
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventHistory = async (statusFilter?: EventTab) => {
    try {
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const data = await profileService.getUserEventHistory(filter);
      setEventHistory(data);
    } catch (err: any) {
      console.error('Error fetching event history:', err);
    }
  };

  const handleTabChange = (tab: EventTab) => {
    setActiveTab(tab);
    fetchEventHistory(tab);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to current profile data
      setEditForm({
        name: profile?.name || '',
        bio: profile?.bio || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await profileService.updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleViewOnHashScan = () => {
    if (!profile?.primaryNft) return;
    
    const { tokenId, serialNumber } = profile.primaryNft;
    const url = serialNumber 
      ? `https://hashscan.io/testnet/token/${tokenId}?serialnumber=${serialNumber}`
      : `https://hashscan.io/testnet/token/${tokenId}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attended':
        return <CheckCircleIcon className="status-icon attended" />;
      case 'cancelled':
        return <CancelIcon className="status-icon cancelled" />;
      case 'active':
        return <EventAvailableIcon className="status-icon active" />;
      default:
        return <EventBusyIcon className="status-icon" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'attended':
        return 'Participou';
      case 'cancelled':
        return 'Cancelado';
      case 'active':
        return 'Inscrito';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile || !profile.stats) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <h1 className="error-title">Oops!</h1>
          <p className="error-message">{error || 'Perfil não encontrado'}</p>
          <button className="btn-retry" onClick={fetchProfile}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const filteredEvents = eventHistory;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div>
            <h1 className="page-title">Meu Perfil</h1>
            <p className="page-subtitle">Gerencie suas informações e acompanhe sua jornada</p>
          </div>
          <button className="btn-edit" onClick={handleEditToggle}>
            <EditIcon />
            <span>Editar Perfil</span>
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="profile-content">
        {/* Profile Hero Section */}
        <div className="profile-hero">
          <div className="profile-identity">
            <h1 className="profile-name">{profile.name || 'Usuário sem nome'}</h1>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            
            <div className="profile-meta">
              <span className="meta-item">
                <CalendarIcon className="meta-icon" />
                Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
              <span className="meta-item">
                <EmailIcon className="meta-icon" />
                {profile.email}
              </span>
            </div>

            <div className="profile-wallet-stats">
              <div className="wallet-badge">
                <WalletIcon className="wallet-badge-icon" />
                <span className="wallet-badge-text">{profile.walletAddress}</span>
              </div>
              
              <div className="stat-badge attended">
                <CheckCircleIcon className="stat-badge-icon" />
                <span className="stat-badge-number">{profile.stats.attendedEvents}</span>
                <span className="stat-badge-label">Eventos Participados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary NFT Card */}
        {profile.primaryNft ? (
          <div className="nft-section">
            <h2 className="section-title">
              <StyleIcon className="section-icon" />
              Meu NFT de Membro
            </h2>
            <div className="nft-card-minimal">
              <div className="nft-image-container">
                {profile.primaryNft.imageUrl ? (
                  <img
                    src={profile.primaryNft.imageUrl}
                    alt="Member NFT"
                    className="nft-image"
                  />
                ) : (
                  <div className="nft-image-placeholder">
                    <StyleIcon className="placeholder-icon" />
                  </div>
                )}
              </div>
              <div className="nft-info-minimal">
                <h3 className="nft-title">
                  Offchain Member #{profile.primaryNft.serialNumber || '1'}
                </h3>
                <button 
                  className="nft-link-icon"
                  onClick={handleViewOnHashScan}
                  aria-label="Ver NFT no HashScan"
                  title="Ver no HashScan"
                >
                  <OpenInNewIcon />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="nft-section empty">
            <h2 className="section-title">
              <StyleIcon className="section-icon" />
              NFT de Membro
            </h2>
            <p className="nft-empty-message">Você ainda não possui um NFT de membro.</p>
          </div>
        )}

        {/* Event History Section */}
        <div className="event-history-section">
          <h2 className="section-title">
            <EmojiEventsIcon className="section-icon" />
            Histórico de Eventos
          </h2>

          {/* Tabs */}
          <div className="event-tabs">
            <button
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              Todos ({eventHistory.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => handleTabChange('active')}
            >
              <EventAvailableIcon className="tab-icon" />
              Inscritos
            </button>
            <button
              className={`tab-button ${activeTab === 'attended' ? 'active' : ''}`}
              onClick={() => handleTabChange('attended')}
            >
              <CheckCircleIcon className="tab-icon" />
              Participados
            </button>
            <button
              className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => handleTabChange('cancelled')}
            >
              <CancelIcon className="tab-icon" />
              Cancelados
            </button>
          </div>

          {/* Event Timeline */}
          <div className="event-timeline">
            {filteredEvents.length === 0 ? (
              <div className="no-events">
                <EventBusyIcon className="no-events-icon" />
                <p className="no-events-text">Nenhum evento encontrado</p>
              </div>
            ) : (
              filteredEvents.map((item) => (
                <div key={item.subscriptionId} className="timeline-item">
                  <div className="timeline-marker">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h3 className="event-name">{item.event?.name || 'Evento removido'}</h3>
                      <span className={`status-badge ${item.status}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    {item.event && (
                      <>
                        {item.event.description && (
                          <p className="event-description">{item.event.description}</p>
                        )}
                        <div className="event-meta-info">
                          {item.event.eventDate && (
                            <div className="meta-info-item">
                              <CalendarIcon className="meta-icon" />
                              <span>
                                {new Date(item.event.eventDate).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                                {item.event.eventTime && ` • ${item.event.eventTime}`}
                              </span>
                            </div>
                          )}
                          <div className="meta-info-item">
                            <LocationIcon className="meta-icon" />
                            <span>{item.event.location}</span>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="timeline-footer">
                      <span className="timeline-date">
                        Inscrito em: {new Date(item.subscribedAt).toLocaleDateString('pt-BR')}
                      </span>
                      {item.attendedAt && (
                        <span className="timeline-date attended">
                          Participou em: {new Date(item.attendedAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {item.rewardSent && (
                        <div className="reward-badge">
                          <CardGiftcardIcon className="reward-icon" />
                          <span>Recompensa Recebida</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={handleEditToggle}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Perfil</h2>
              <button className="modal-close" onClick={handleEditToggle}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  <PersonIcon className="form-icon" />
                  Nome
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <DescriptionIcon className="form-icon" />
                  Biografia
                </label>
                <textarea
                  className="form-textarea"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                  maxLength={500}
                />
                <span className="form-hint">{editForm.bio.length}/500 caracteres</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleEditToggle}>
                <CloseIcon />
                <span>Cancelar</span>
              </button>
              <button className="btn-save" onClick={handleSaveProfile}>
                <SaveIcon />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

