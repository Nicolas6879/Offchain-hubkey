import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appConfig } from '../../config';
import './EventSub.css';

interface Event {
  _id: string;
  name: string;
  description?: string;
  location: string;
  photo?: string;
  maxParticipants?: number;
  currentParticipants: number;
  isActive: boolean;
  eventDate?: string;
  eventTime?: string;
  createdAt: string;
  updatedAt: string;
}

export const EventSub: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userWallet, setUserWallet] = useState<string | null>(null);

  // Get wallet address from localStorage
  useEffect(() => {
    const walletAddress = localStorage.getItem('walletAddress');
    setUserWallet(walletAddress);
  }, []);

  // Helper function to construct photo URL
  const getPhotoUrl = (photo?: string): string | undefined => {
    if (!photo) return undefined;
    // If it's already a full URL, return as-is
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    // If it's a filename, prepend backend static URL
    return `${appConfig.networks.testnet.backendUrl}/static/${photo}`;
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events`);
      
      if (!response.ok) {
        throw new Error("Erro ao buscar eventos");
      }
      
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar eventos");
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubscribe = async (eventId: string) => {
    if (!userWallet) {
      alert('Por favor, faça login ou crie uma conta para se inscrever no evento.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(
        `${appConfig.networks.testnet.backendUrl}/api/events/${eventId}/subscribe`,
        {
          method: 'POST',
          headers: {
            'wallet-address': userWallet,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Inscrição realizada com sucesso!');
        // Refresh events list to get updated counts
        fetchEvents();
      } else {
        alert(data.message || 'Erro ao se inscrever');
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      alert('Erro ao se inscrever no evento');
    }
  };

  const isEventFull = (event: Event): boolean => {
    if (!event.maxParticipants) return false;
    return event.currentParticipants >= event.maxParticipants;
  };

  if (loading) {
    return (
      <div className="eventsub-container">
        <p>Carregando eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eventsub-container">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="eventsub-container">
        <h1 className="eventsub-title">Eventos Disponíveis</h1>
        <p>Nenhum evento disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="eventsub-container">
      <h1 className="eventsub-title">Eventos Disponíveis</h1>
      <div className="eventsub-grid">
        {events.map(event => {
          const isFull = isEventFull(event);
          
          return (
            <div key={event._id} className="event-card">
              <div 
                className="event-card-content"
                onClick={() => navigate(`/evento/${event._id}`)}
                style={{ cursor: 'pointer' }}
              >
                {event.photo && (
                  <img 
                    src={getPhotoUrl(event.photo)} 
                    alt={event.name} 
                    className="event-image" 
                  />
                )}
                <h3 className="event-name">{event.name}</h3>
                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}
                <p className="event-location"><strong>Local:</strong> {event.location}</p>
                <p className="event-slots">
                  <strong>Vagas:</strong> {event.currentParticipants}
                  {event.maxParticipants ? ` / ${event.maxParticipants}` : ' (ilimitado)'}
                </p>
                {isFull && <div className="event-full-message">Evento Cheio</div>}
              </div>
              {isFull ? (
                <button className="subscribe-button" disabled>
                  Inscrever-se
                </button>
              ) : (
                <button
                  className="subscribe-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(event._id);
                  }}
                >
                  Inscrever-se
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventSub;
