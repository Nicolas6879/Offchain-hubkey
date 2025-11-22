import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { appConfig } from "../../config";
import { 
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  EventAvailable as EventAvailableIcon,
  Search as SearchIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EventBusy as EventBusyIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import "./Events.css";

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

type ViewMode = 'grid' | 'list';
type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'participants-asc' | 'participants-desc';
type StatusFilter = 'all' | 'active' | 'inactive';
type OccupancyFilter = 'all' | 'available' | 'full';

const Events: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userWallet, setUserWallet] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [showPastEvents, setShowPastEvents] = useState(false); // Default: hide past events for public
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active'); // Default: only active
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-asc'); // Upcoming events first
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

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
    // If it starts with /, prepend backend URL
    if (photo.startsWith('/')) {
      return `${appConfig.networks.testnet.backendUrl}${photo}`;
    }
    // Otherwise, prepend backend URL with /static/ prefix (backend serves from /static)
    return `${appConfig.networks.testnet.backendUrl}/static/${photo}`;
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events`);
      if (!response.ok) throw new Error("Erro ao buscar eventos.");
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
      setError(err.message || "Erro desconhecido ao carregar eventos.");
      setEvents([]);
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
        fetchEvents(); // Refresh to get updated counts
      } else {
        alert(data.message || 'Erro ao se inscrever');
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      alert('Erro ao se inscrever no evento');
    }
  };

  // Helper to check if event is full
  const isEventFull = (event: EventItem): boolean => {
    return event.maxParticipants ? event.currentParticipants >= event.maxParticipants : false;
  };

  // Helper to get capacity percentage
  const getCapacityPercentage = (event: EventItem): number => {
    if (!event.maxParticipants) return 0;
    return (event.currentParticipants / event.maxParticipants) * 100;
  };

  // Helper to check if event is in the past
  const isPastEvent = (event: EventItem): boolean => {
    if (!event.eventDate) return false;
    const eventDate = new Date(event.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  // Filtered and Sorted Events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }

    // Filter past events
    if (!showPastEvents) {
      filtered = filtered.filter(event => !isPastEvent(event));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => 
        statusFilter === 'active' ? event.isActive : !event.isActive
      );
    }

    // Filter by occupancy
    if (occupancyFilter !== 'all') {
      filtered = filtered.filter(event => {
        const isFull = isEventFull(event);
        return occupancyFilter === 'full' ? isFull : !isFull;
      });
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.eventDate || a.createdAt).getTime() - new Date(b.eventDate || b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.eventDate || b.createdAt).getTime() - new Date(a.eventDate || a.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'participants-asc':
          return a.currentParticipants - b.currentParticipants;
        case 'participants-desc':
          return b.currentParticipants - a.currentParticipants;
        default:
          return 0;
      }
    });

    return filtered;
  }, [events, searchQuery, showPastEvents, statusFilter, occupancyFilter, sortOption]);

  // Statistics
  const stats = useMemo(() => {
    const total = events.filter(e => e.isActive).length; // Only count active events
    const upcoming = events.filter(e => e.isActive && !isPastEvent(e)).length;
    const available = events.filter(e => e.isActive && !isEventFull(e) && !isPastEvent(e)).length;
    const totalParticipants = events.filter(e => e.isActive).reduce((sum, e) => sum + e.currentParticipants, 0);

    return { total, upcoming, available, totalParticipants };
  }, [events]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (!showPastEvents) count++; // Counting as filter since it's not default
    if (statusFilter !== 'active') count++; // Different from default
    if (occupancyFilter !== 'all') count++;
    return count;
  }, [searchQuery, showPastEvents, statusFilter, occupancyFilter]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setShowPastEvents(false);
    setStatusFilter('active');
    setOccupancyFilter('all');
  };

  if (loading) {
    return (
      <div className="events-page">
        <div className="events-header">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Carregando eventos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-page">
        <div className="events-header">
          <div className="error-container">
            <h1 className="error-title">Oops!</h1>
            <p className="error-message">{error}</p>
            <button className="btn-retry" onClick={fetchEvents}>
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="events-page">
        <div className="events-header">
          <h1 className="page-title">Eventos Disponíveis</h1>
          <p className="page-subtitle">Explore e participe dos eventos</p>
        </div>
        <div className="empty-state">
          <EventAvailableIcon className="empty-icon" />
          <h2 className="empty-title">Nenhum evento disponível</h2>
          <p className="empty-text">Novos eventos serão publicados em breve!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      {/* Header with Title */}
      <div className="events-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Eventos Disponíveis</h1>
            <p className="page-subtitle">
              {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'evento disponível' : 'eventos disponíveis'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="stats-bar">
        <div className="stats-container">
          <div className="stat-item">
            <EventAvailableIcon className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Eventos Ativos</span>
            </div>
          </div>
          <div className="stat-item">
            <CalendarIcon className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{stats.upcoming}</span>
              <span className="stat-label">Próximos</span>
            </div>
          </div>
          <div className="stat-item">
            <CheckCircleIcon className="stat-icon active" />
            <div className="stat-content">
              <span className="stat-value">{stats.available}</span>
              <span className="stat-label">Com Vagas</span>
            </div>
          </div>
          <div className="stat-item">
            <PeopleIcon className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{stats.totalParticipants}</span>
              <span className="stat-label">Participantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls Bar */}
      <div className="controls-bar">
        <div className="controls-container">
          {/* Search */}
          <div className="search-box">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
                title="Limpar busca"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            className={`control-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros"
          >
            <FilterIcon />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="badge">{activeFiltersCount}</span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="dropdown-wrapper">
            <SortIcon className="dropdown-icon" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="control-select"
            >
              <option value="date-asc">Data: Próximos primeiro</option>
              <option value="date-desc">Data: Mais recentes</option>
              <option value="name-asc">Nome: A-Z</option>
              <option value="name-desc">Nome: Z-A</option>
              <option value="participants-desc">Mais populares</option>
              <option value="participants-asc">Menos populares</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Visualização em grade"
            >
              <GridViewIcon />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Visualização em lista"
            >
              <ListViewIcon />
            </button>
          </div>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-content">
              {/* Show Past Events Toggle */}
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={showPastEvents}
                  onChange={(e) => setShowPastEvents(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Mostrar eventos passados</span>
              </label>

              {/* Status Filter */}
              <div className="filter-group">
                <span className="filter-group-label">Status:</span>
                <div className="filter-chips">
                  <button
                    className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                  >
                    Todos
                  </button>
                  <button
                    className={`filter-chip ${statusFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('active')}
                  >
                    <CheckCircleIcon className="chip-icon" />
                    Ativos
                  </button>
                </div>
              </div>

              {/* Occupancy Filter */}
              <div className="filter-group">
                <span className="filter-group-label">Disponibilidade:</span>
                <div className="filter-chips">
                  <button
                    className={`filter-chip ${occupancyFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setOccupancyFilter('all')}
                  >
                    Todos
                  </button>
                  <button
                    className={`filter-chip ${occupancyFilter === 'available' ? 'active' : ''}`}
                    onClick={() => setOccupancyFilter('available')}
                  >
                    <EventAvailableIcon className="chip-icon" />
                    Com Vagas
                  </button>
                  <button
                    className={`filter-chip ${occupancyFilter === 'full' ? 'active' : ''}`}
                    onClick={() => setOccupancyFilter('full')}
                  >
                    <EventBusyIcon className="chip-icon" />
                    Esgotados
                  </button>
                </div>
              </div>

              {/* Reset Filters */}
              {activeFiltersCount > 0 && (
                <button className="btn-reset-filters" onClick={resetFilters}>
                  <CloseIcon className="reset-icon" />
                  Limpar todos os filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="events-content">
        {filteredAndSortedEvents.length === 0 ? (
          <div className="no-results">
            <SearchIcon className="no-results-icon" />
            <h3 className="no-results-title">Nenhum evento encontrado</h3>
            <p className="no-results-text">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
            {activeFiltersCount > 0 && (
              <button className="btn-reset-filters" onClick={resetFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className={`events-${viewMode}`}>
            {filteredAndSortedEvents.map((event) => {
            const isFull = isEventFull(event);
            const capacityPercent = getCapacityPercentage(event);
            const isPast = isPastEvent(event);

            return (
              <div 
                key={event._id} 
                className={`event-item ${isPast ? 'past-event' : ''} ${viewMode === 'list' ? 'list-view' : ''}`}
                onClick={() => navigate(`/evento/${event._id}`)}
              >
                {/* Event Image with Overlay */}
                <div className="event-image-container">
                  {event.photo ? (
                    <img 
                      src={getPhotoUrl(event.photo)} 
                      alt={event.name} 
                      className="event-image" 
                    />
                  ) : (
                    <div className="event-image-placeholder">
                      <EventAvailableIcon className="placeholder-icon" />
                    </div>
                  )}
                  <div className="event-image-overlay"></div>
                  
                  {/* Status Badges */}
                  <div className="event-badges">
                    {isPast && (
                      <div className="event-status-badge past">
                        Encerrado
                      </div>
                    )}
                    {!isPast && event.maxParticipants && (
                      <div className={`event-status-badge ${isFull ? 'full' : 'available'}`}>
                        {isFull ? 'Esgotado' : 'Vagas Disponíveis'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Content */}
                <div className="event-content">
                  <h3 className="event-title">{event.name}</h3>
                  
                  {event.description && (
                    <p className="event-description">
                      {event.description.length > 100 
                        ? `${event.description.substring(0, 100)}...` 
                        : event.description
                      }
                    </p>
                  )}

                  {/* Event Meta Info */}
                  <div className="event-meta">
                    {event.eventDate && (
                      <div className="meta-item">
                        <CalendarIcon className="meta-icon" />
                        <span>
                          {new Date(event.eventDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {event.eventTime && ` • ${event.eventTime}`}
                        </span>
                      </div>
                    )}
                    
                    {event.location && (
                      <div className="meta-item">
                        <LocationIcon className="meta-icon" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    <div className="meta-item">
                      <PeopleIcon className="meta-icon" />
                      <span>
                        {event.currentParticipants}
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                        {' participantes'}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  {event.maxParticipants && (
                    <div className="capacity-bar-container">
                      <div 
                        className={`capacity-bar ${capacityPercent >= 90 ? 'almost-full' : ''}`}
                        style={{ width: `${capacityPercent}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Subscribe Button */}
                <div className="event-actions">
                  <button
                    className={`btn-subscribe ${isFull || isPast ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFull && !isPast) {
                        handleSubscribe(event._id);
                      }
                    }}
                    disabled={isFull || isPast}
                    title={isFull ? 'Evento esgotado' : isPast ? 'Evento encerrado' : 'Inscrever-se no evento'}
                  >
                    <PersonAddIcon className="action-icon" />
                    <span>{isFull ? 'Esgotado' : isPast ? 'Encerrado' : 'Inscrever-se'}</span>
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;

