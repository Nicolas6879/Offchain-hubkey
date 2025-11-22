import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { appConfig } from "../../config";
import { MetamaskContext } from "../../contexts/MetamaskContext";
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  EventAvailable as EventAvailableIcon,
  Add as AddIcon
} from '@mui/icons-material';
import "./EventList.css";

interface EventItem {
  _id: string;
  name: string;
  description?: string;
  photo?: string;
  maxParticipants?: number;
  currentParticipants: number;
  location: string;
  createdBy: string;
  isActive: boolean;
  eventDate?: string;
  eventTime?: string;
  createdAt: string;
  updatedAt: string;
}

const EventList: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Get admin wallet for delete operations
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const adminWallet = metamaskCtx.metamaskAccountAddress || walletConnectCtx.accountId || '';

  // Helper function to construct photo URL
  const getPhotoUrl = (photo?: string): string | undefined => {
    if (!photo) return undefined;
    // If it's already a full URL, return as-is
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    // If it starts with /, prepend backend URL
    if (photo.startsWith('/')) {
      return `${appConfig.networks.testnet.backendUrl}${photo}`;
    }
    // Otherwise, prepend backend URL with /static/ prefix (backend serves from /static)
    return `${appConfig.networks.testnet.backendUrl}/static/${photo}`;
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events`);
      if (!response.ok) {
        throw new Error("Erro ao buscar eventos.");
      }
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setEvents(data);
      } else if (data && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        console.error('Invalid events data:', data);
        setEvents([]);
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || "Erro ao carregar eventos.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!adminWallet) {
      alert("Por favor, conecte sua carteira admin primeiro.");
      return;
    }

    const confirmDelete = window.confirm("Tem certeza que deseja excluir este evento?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events/${id}`, {
        method: "DELETE",
        headers: {
          "wallet-address": adminWallet,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao excluir evento.");
      }
      // Refresh the list after successful deletion
      fetchEvents();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir evento.");
      alert(err.message || "Erro ao excluir evento.");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="page-title">Gerenciar Eventos</h1>
              <p className="error-text">{error}</p>
            </div>
          </div>
        </div>
        <div className="page-content">
          <button className="btn-primary" onClick={fetchEvents}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header - Following Design System Pattern */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Gerenciar Eventos</h1>
            <p className="page-subtitle">
              {events.length} {events.length === 1 ? 'evento' : 'eventos'}
            </p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/create-event')}
            >
              <AddIcon className="btn-icon" />
              Criar Novo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {events.length === 0 ? (
          <div className="empty-state">
            <EventAvailableIcon className="empty-icon" />
            <h3 className="empty-title">Nenhum evento criado</h3>
            <p className="empty-text">
              Comece criando seu primeiro evento para gerenciar
            </p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/create-event')}
            >
              <AddIcon />
              Criar Primeiro Evento
            </button>
          </div>
        ) : (
          <div className="content-list">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                {/* Event Thumbnail */}
                <div className="event-thumbnail">
                  {event.photo ? (
                    <img 
                      src={getPhotoUrl(event.photo)} 
                      alt={event.name}
                      className="thumbnail-image"
                    />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <EventAvailableIcon />
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="event-info">
                  <h3 className="event-name">{event.name}</h3>
                  <div className="event-meta">
                    {event.eventDate && (
                      <span className="meta-item">
                        <CalendarIcon className="meta-icon" />
                        {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                        {event.eventTime && ` às ${event.eventTime}`}
                      </span>
                    )}
                    {event.location && (
                      <span className="meta-item">
                        <LocationIcon className="meta-icon" />
                        {event.location}
                      </span>
                    )}
                    <span className="meta-item">
                      <PeopleIcon className="meta-icon" />
                      {event.currentParticipants}
                      {event.maxParticipants && ` / ${event.maxParticipants}`}
                    </span>
                  </div>
                </div>

                {/* Event Status */}
                <div className="event-status">
                  <span className={`status-badge ${event.isActive ? 'active' : 'inactive'}`}>
                    {event.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="event-actions">
                  <button
                    className="btn-secondary btn-icon-text"
                    onClick={() => navigate(`/event-list/edit/${event._id}`)}
                    title="Editar evento"
                  >
                    <EditIcon />
                    Editar
                  </button>
                  <button
                    className="btn-danger btn-icon-text"
                    onClick={() => handleDelete(event._id)}
                    title="Excluir evento"
                  >
                    <DeleteIcon />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
