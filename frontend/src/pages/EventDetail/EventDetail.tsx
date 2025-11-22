import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  QrCode2 as QrCodeIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  AccountTree as AccountTreeIcon,
  CardGiftcard as CardGiftcardIcon,
} from '@mui/icons-material';
import { appConfig } from '../../config';
import { useWalletAddress } from '../../hooks/useWalletAddress';
import './EventDetail.css';

interface Event {
  _id: string;
  name: string;
  description?: string;
  location: string;
  photo?: string;
  maxParticipants?: number;
  currentParticipants: number;
  isActive: boolean;
  createdBy: string;
  eventDate: string;
  eventTime?: string;
  topicId?: string;
  rewardTokenId?: string;
  rewardAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  _id: string;
  walletAddress: string;
  subscribedAt: string;
  status: 'active' | 'cancelled' | 'attended';
  attendedAt?: string;
  isFirstTimeParticipation?: boolean;
  memberNftMinted?: boolean;
  rewardSent?: boolean;
  nftTransferFailed?: boolean;
  rewardDistributionFailed?: boolean;
  nftTransferError?: string;
  rewardDistributionError?: string;
}

interface TopicMessage {
  consensus_timestamp: string;
  decodedMessage: any;
  timestamp: string;
  sequence_number: number;
}

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [topicMessages, setTopicMessages] = useState<TopicMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ url: string; dataUrl: string } | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<{ [key: string]: boolean }>({});
  const [showConfirmSubscribeModal, setShowConfirmSubscribeModal] = useState(false);
  const [showSubscribeResultModal, setShowSubscribeResultModal] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Get wallet address for subscription
  const userWallet = useWalletAddress();
  
  // Check if user is admin
  const isAdmin = event?.createdBy?.toLowerCase() === userWallet.toLowerCase();

  // Helper function to construct photo URL
  const getPhotoUrl = (photo?: string): string | undefined => {
    if (!photo) return undefined;
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    return `${appConfig.networks.testnet.backendUrl}/static/${photo}`;
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events/${id}`);
      
      if (!response.ok) {
        throw new Error("Evento não encontrado");
      }
      
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar evento");
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkUserSubscription = async () => {
    if (!userWallet) return;
    
    try {
      // Check user's own subscriptions
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events/subscriptions/me`, {
        headers: {
          'wallet-address': userWallet
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.subscriptions) {
          const isSubscribedToThisEvent = data.subscriptions.some(
            (sub: any) => sub.eventId._id === id || sub.eventId === id
          );
          setIsSubscribed(isSubscribedToThisEvent);
        }
      }
    } catch (err) {
      console.error('Error checking user subscription:', err);
    }
  };

  const fetchSubscriptions = async () => {
    if (!id) {
      return;
    }
    
    try {
      setLoadingSubscribers(true);
      // Fetch subscribers list (public endpoint)
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events/${id}/subscribers`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscribers response:', data);
        if (data.success && data.subscriptions) {
          setSubscriptions(data.subscriptions);
          // Check if current user is subscribed
          if (userWallet) {
            const userSubscription = data.subscriptions.find(
              (sub: Subscription) => sub.walletAddress.toLowerCase() === userWallet.toLowerCase()
            );
            setIsSubscribed(!!userSubscription);
          }
        }
      } else {
        console.error('Failed to fetch subscribers:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      // Fallback to checking user's own subscription if they have a wallet
      if (userWallet) {
        await checkUserSubscription();
      }
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const fetchTopicMessages = async () => {
    if (!id) {
      return;
    }
    
    try {
      setLoadingMessages(true);
      // Fetch topic messages
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events/${id}/messages`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Topic messages response:', data);
        if (data.success && data.messages) {
          setTopicMessages(data.messages);
        }
      } else {
        console.error('Failed to fetch topic messages:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching topic messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      fetchSubscriptions();
      fetchTopicMessages();
    }
  }, [id, userWallet]);

  const handleSubscribeClick = () => {
    if (!userWallet) {
      setSubscribeStatus({
        type: 'error',
        message: 'Por favor, conecte sua carteira primeiro.'
      });
      setShowSubscribeResultModal(true);
      return;
    }
    setShowConfirmSubscribeModal(true);
  };

  const handleConfirmSubscribe = async () => {
    if (!id) return;

    setShowConfirmSubscribeModal(false);
    setIsSubscribing(true);

    try {
      const response = await fetch(
        `${appConfig.networks.testnet.backendUrl}/api/events/${id}/subscribe`,
        {
          method: 'POST',
          headers: {
            'wallet-address': userWallet,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSubscribeStatus({
          type: 'success',
          message: 'Inscrição realizada com sucesso! Você receberá um NFT de membro e tokens de recompensa após fazer check-in no evento.'
        });
        setShowSubscribeResultModal(true);
        setIsSubscribed(true);
        // Refresh event details to get updated counts
        await fetchEventDetails();
        await fetchSubscriptions();
      } else {
        setSubscribeStatus({
          type: 'error',
          message: data.message || 'Erro ao se inscrever'
        });
        setShowSubscribeResultModal(true);
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      setSubscribeStatus({
        type: 'error',
        message: 'Erro ao se inscrever no evento'
      });
      setShowSubscribeResultModal(true);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!userWallet || !id) return;

    const confirmUnsubscribe = window.confirm('Tem certeza que deseja cancelar sua inscrição?');
    if (!confirmUnsubscribe) return;

    try {
      const response = await fetch(
        `${appConfig.networks.testnet.backendUrl}/api/events/${id}/subscribe`,
        {
          method: 'DELETE',
          headers: {
            'wallet-address': userWallet,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Inscrição cancelada com sucesso!');
        setIsSubscribed(false);
        await fetchEventDetails();
        await fetchSubscriptions();
      } else {
        alert(data.message || 'Erro ao cancelar inscrição');
      }
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      alert('Erro ao cancelar inscrição');
    }
  };

  const isEventFull = (): boolean => {
    if (!event || !event.maxParticipants) return false;
    return event.currentParticipants >= event.maxParticipants;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessagesForWallet = (walletAddress: string): TopicMessage[] => {
    return topicMessages.filter(msg => {
      if (msg.decodedMessage && typeof msg.decodedMessage === 'object') {
        return msg.decodedMessage.walletAddress?.toLowerCase() === walletAddress.toLowerCase();
      }
      return false;
    });
  };

  const toggleMessageExpand = (subscriptionId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [subscriptionId]: !prev[subscriptionId]
    }));
  };

  const handleRetryTransfers = async (walletAddress: string) => {
    if (!id) return;

    const confirmRetry = window.confirm('Tentar novamente enviar NFT e/ou tokens de recompensa?');
    if (!confirmRetry) return;

    try {
      const response = await fetch(
        `${appConfig.networks.testnet.backendUrl}/api/events/${id}/retry`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'wallet-address': walletAddress,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        let message = 'Resultado da tentativa:\n\n';
        if (data.results.nft.message) {
          message += `NFT: ${data.results.nft.message}\n`;
        }
        if (data.results.reward.message) {
          message += `Recompensa: ${data.results.reward.message}`;
        }
        alert(message);
        
        // Refresh subscribers list
        await fetchSubscriptions();
      } else {
        alert(data.message || 'Erro ao tentar novamente');
      }
    } catch (error: any) {
      console.error('Error retrying transfers:', error);
      alert('Erro ao tentar novamente');
    }
  };

  const handleShowQRCode = async () => {
    if (!isAdmin || !id) return;

    setLoadingQR(true);
    try {
      const response = await fetch(
        `${appConfig.networks.testnet.backendUrl}/api/events/${id}/qr`,
        {
          headers: {
            'wallet-address': userWallet,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setQrCodeData(data.qrCode);
        setShowQRModal(true);
      } else {
        alert(data.message || 'Erro ao gerar QR code');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      alert('Erro ao buscar QR code');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeData) return;

    const link = document.createElement('a');
    link.href = qrCodeData.dataUrl;
    link.download = `event-${id}-qrcode.png`;
    link.click();
  };

  if (loading) {
    return (
      <Box className="eventdetail-page theme-transition" sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: { xs: 2, md: 4 }
      }}>
        <Typography variant="h5" className="text-secondary">
          Carregando evento...
        </Typography>
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box className="eventdetail-page theme-transition" sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        py: 8,
        px: { xs: 2, md: 4 }
      }}>
        <Typography variant="h5" sx={{ color: 'var(--primary-main)' }}>
          {error || 'Evento não encontrado'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            '&:hover': {
              borderColor: 'var(--primary-main)',
              backgroundColor: 'transparent'
            }
          }}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  const isFull = isEventFull();
  const canSubscribe = !isSubscribed && !isFull && event.isActive && userWallet;
  const canUnsubscribe = isSubscribed && userWallet;

  return (
    <Box className="eventdetail-page theme-transition" sx={{ 
      minHeight: '100vh',
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      <Box sx={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Back Button and Admin Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': {
                color: 'var(--primary-main)',
                backgroundColor: 'transparent'
              }
            }}
          >
            Voltar
          </Button>

          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={handleShowQRCode}
              disabled={loadingQR}
              sx={{
                borderColor: 'var(--primary-main)',
                color: 'var(--primary-main)',
                '&:hover': {
                  borderColor: 'var(--primary-dark)',
                  backgroundColor: 'rgba(var(--primary-main-rgb), 0.1)'
                }
              }}
            >
              {loadingQR ? 'Gerando...' : 'QR Code Check-in'}
            </Button>
          )}
        </Box>

        {/* Event Image */}
        {event.photo && (
          <Box sx={{ 
            width: '100%',
            height: { xs: 250, md: 450 },
            overflow: 'hidden',
            mb: 4,
            borderRadius: '8px'
          }}>
            <img 
              src={getPhotoUrl(event.photo)} 
              alt={event.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        )}

        {/* Event Info */}
        <Box>
            {/* Title and Status */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h3" 
                component="h1"
                className="text-primary"
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '2rem', md: '3rem' },
                  mb: 2
                }}
              >
                {event.name}
              </Typography>
              
              {(!event.isActive || isFull) && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {!event.isActive && (
                    <Chip 
                      label="Evento Inativo" 
                      size="small"
                      sx={{ 
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        fontWeight: 600
                      }}
                    />
                  )}
                  {isFull && (
                    <Chip 
                      label="Evento Cheio" 
                      size="small"
                      sx={{ 
                        backgroundColor: '#fff3e0',
                        color: '#ef6c00',
                        fontWeight: 600
                      }}
                    />
                  )}
                </Stack>
              )}
            </Box>

          {/* Description */}
          {event.description && (
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="body1" 
                className="text-secondary"
                sx={{ 
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {event.description}
              </Typography>
            </Box>
          )}

          {/* Event Information */}
          <Box sx={{ mb: 5, py: 3, borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationIcon sx={{ color: 'var(--primary-main)', fontSize: '1.3rem' }} />
                <Typography className="text-secondary" sx={{ fontSize: '1rem' }}>
                  {event.location}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PeopleIcon sx={{ color: 'var(--primary-main)', fontSize: '1.3rem' }} />
                <Typography className="text-secondary" sx={{ fontSize: '1rem' }}>
                  {subscriptions.length}
                  {event.maxParticipants ? ` / ${event.maxParticipants}` : ''} inscritos
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarIcon sx={{ color: 'var(--primary-main)', fontSize: '1.3rem' }} />
                <Typography className="text-secondary" sx={{ fontSize: '1rem' }}>
                  {formatDate(event.eventDate)}
                  {event.eventTime && ` às ${event.eventTime}`}
                </Typography>
              </Box>
              
              {event.updatedAt !== event.createdAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <UpdateIcon sx={{ color: 'var(--primary-main)', fontSize: '1.3rem' }} />
                  <Typography className="text-secondary" sx={{ fontSize: '1rem' }}>
                    Atualizado: {formatDate(event.updatedAt)}
                  </Typography>
                </Box>
              )}

              {/* On-Chain Topic */}
              {event.topicId && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccountTreeIcon sx={{ color: 'var(--primary-main)', fontSize: '1.3rem' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography className="text-secondary" sx={{ fontSize: '1rem' }}>
                      Tópico:
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontFamily: 'monospace',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem'
                      }}
                    >
                      {event.topicId}
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<OpenInNewIcon sx={{ fontSize: '0.9rem' }} />}
                      onClick={() => window.open(`https://hashscan.io/testnet/topic/${event.topicId}`, '_blank')}
                      sx={{
                        color: 'var(--primary-main)',
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        padding: '2px 8px',
                        minHeight: '24px',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: 'var(--primary-dark)'
                        }
                      }}
                    >
                      HashScan
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Reward Information */}
              {event.rewardTokenId && event.rewardAmount && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CardGiftcardIcon sx={{ color: 'var(--primary-main)', fontSize: '1.3rem' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography className="text-secondary" sx={{ fontSize: '1rem' }}>
                      Recompensa:
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}
                    >
                      {event.rewardAmount} Tokens
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem'
                      }}
                    >
                      ({event.rewardTokenId})
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack spacing={2} sx={{ mb: 5 }}>
            {isSubscribed && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
                px: 2,
                backgroundColor: 'var(--bg-surface-1)',
                borderLeft: '3px solid var(--success-color, #3bc77e)',
                borderRadius: '4px'
              }}>
                <Typography sx={{ color: 'var(--success-color, #3bc77e)', fontSize: '1.2rem' }}>
                  ✓
                </Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.95rem', flex: 1 }}>
                  Você está inscrito neste evento
                </Typography>
              </Box>
            )}

            {canSubscribe && (
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSubscribeClick}
                disabled={isSubscribing}
                sx={{
                  backgroundColor: 'var(--primary-main)',
                  color: 'var(--primary-contrast)',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'var(--primary-dark)',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }
                }}
              >
                {isSubscribing ? 'Inscrevendo...' : 'Inscrever-se no Evento'}
              </Button>
            )}
            
            {canUnsubscribe && (
              <Button
                variant="outlined"
                size="medium"
                fullWidth
                onClick={handleUnsubscribe}
                sx={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '6px',
                  '&:hover': {
                    borderColor: 'hsl(0, 70%, 50%)',
                    backgroundColor: 'transparent',
                    color: 'hsl(0, 70%, 50%)'
                  }
                }}
              >
                Cancelar Inscrição
              </Button>
            )}
            
            {!userWallet && !isFull && event.isActive && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
                px: 2,
                backgroundColor: 'var(--bg-surface-1)',
                borderLeft: '3px solid hsl(40, 80%, 50%)',
                borderRadius: '4px'
              }}>
                <Typography sx={{ color: 'hsl(40, 80%, 50%)', fontSize: '1.2rem' }}>
                  ⚠
                </Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  Conecte sua carteira para se inscrever
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Subscribers List */}
          <Box sx={{ mt: 5 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: 2,
                mb: 2,
                pb: 2,
                borderBottom: '1px solid var(--border-color)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PeopleIcon sx={{ color: 'var(--primary-main)', fontSize: '1.5rem' }} />
                  <Typography 
                    variant="h6" 
                    className="text-primary"
                    sx={{ fontWeight: 600, fontSize: '1.25rem' }}
                  >
                    Participantes Inscritos
                  </Typography>
                </Box>
                <Chip 
                  label={subscriptions.length}
                  size="small"
                  sx={{
                    backgroundColor: 'var(--primary-main)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                />
              </Box>
              
              {subscriptions && subscriptions.length > 0 ? (
                <Box>
                  <Stack spacing={1.5}>
                      {subscriptions.map((sub, index) => {
                        const isCurrentUser = sub.walletAddress.toLowerCase() === userWallet.toLowerCase();
                        const walletMessages = getMessagesForWallet(sub.walletAddress);
                        const isExpanded = expandedMessages[sub._id];
                        
                        return (
                          <Box 
                            key={sub._id}
                            sx={{
                              backgroundColor: 'var(--bg-surface-1)',
                              border: isCurrentUser ? '1px solid var(--primary-main)' : '1px solid var(--border-color)',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                py: 1.5,
                                px: 2,
                                cursor: walletMessages.length > 0 ? 'pointer' : 'default'
                              }}
                              onClick={() => walletMessages.length > 0 && toggleMessageExpand(sub._id)}
                            >
                              <Typography 
                                sx={{ 
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  minWidth: '24px'
                                }}
                              >
                                #{index + 1}
                              </Typography>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                  <Typography 
                                    sx={{ 
                                      fontFamily: 'monospace',
                                      color: 'var(--text-primary)',
                                      fontSize: '0.9rem',
                                      letterSpacing: '0.3px'
                                    }}
                                  >
                                    {sub.walletAddress}
                                  </Typography>
                                  {isCurrentUser && (
                                    <Chip 
                                      label="Você"
                                      size="small"
                                      sx={{
                                        backgroundColor: 'var(--primary-main)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: '20px'
                                      }}
                                    />
                                  )}
                                  {sub.status === 'attended' && (
                                    <Chip 
                                      label="✓ Compareceu"
                                      size="small"
                                      sx={{
                                        backgroundColor: 'var(--success-color, #3bc77e)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: '20px'
                                      }}
                                    />
                                  )}
                                  {walletMessages.length > 0 && (
                                    <Chip 
                                      label={`${walletMessages.length} ${walletMessages.length === 1 ? 'mensagem' : 'mensagens'}`}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'var(--success-color, #3bc77e)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: '20px'
                                      }}
                                    />
                                  )}
                                  {sub.nftTransferFailed && (
                                    <Chip 
                                      label="❌ NFT Falhou"
                                      size="small"
                                      sx={{
                                        backgroundColor: 'var(--error-color, #f44336)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: '20px'
                                      }}
                                    />
                                  )}
                                  {sub.rewardDistributionFailed && (
                                    <Chip 
                                      label="❌ Recompensa Falhou"
                                      size="small"
                                      sx={{
                                        backgroundColor: 'var(--error-color, #f44336)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: '20px'
                                      }}
                                    />
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                  <Typography 
                                    variant="caption" 
                                    className="text-secondary"
                                    sx={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}
                                  >
                                    <CalendarIcon sx={{ fontSize: '0.9rem' }} />
                                    {sub.attendedAt ? `Check-in: ${formatDate(sub.attendedAt)}` : `Inscrito em ${formatDate(sub.subscribedAt)}`}
                                  </Typography>
                                  {(sub.nftTransferFailed || sub.rewardDistributionFailed) && isAdmin && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRetryTransfers(sub.walletAddress);
                                      }}
                                      sx={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        minHeight: '24px',
                                        borderColor: 'var(--warning-color, #ff9800)',
                                        color: 'var(--warning-color, #ff9800)',
                                        '&:hover': {
                                          borderColor: 'var(--warning-color, #ff9800)',
                                          backgroundColor: 'rgba(255, 152, 0, 0.1)'
                                        }
                                      }}
                                    >
                                      🔄 Tentar Novamente
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                              {walletMessages.length > 0 && (
                                <Box sx={{ 
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease'
                                }}>
                                  ▼
                                </Box>
                              )}
                            </Box>
                            
                            {/* On-Chain Messages */}
                            {isExpanded && walletMessages.length > 0 && (
                              <Box sx={{ 
                                px: 2.5, 
                                pb: 2,
                                pt: 1,
                                borderTop: '1px solid var(--border-color)'
                              }}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    mb: 1,
                                    display: 'block'
                                  }}
                                >
                                  📝 Mensagens On-Chain
                                </Typography>
                                <Stack spacing={1}>
                                  {walletMessages.map((msg, msgIndex) => (
                                    <Box 
                                      key={msgIndex}
                                      sx={{
                                        p: 1.5,
                                        backgroundColor: 'var(--bg-main)',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)'
                                      }}
                                    >
                                      <Typography 
                                        sx={{ 
                                          fontSize: '0.8rem',
                                          color: 'var(--text-primary)',
                                          fontFamily: 'monospace',
                                          wordBreak: 'break-word',
                                          mb: 0.5
                                        }}
                                      >
                                        <strong>Tipo:</strong> {msg.decodedMessage.type || 'N/A'}
                                      </Typography>
                                      {msg.decodedMessage.eventName && (
                                        <Typography 
                                          sx={{ 
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            mb: 0.5
                                          }}
                                        >
                                          <strong>Evento:</strong> {msg.decodedMessage.eventName}
                                        </Typography>
                                      )}
                                      <Typography 
                                        variant="caption"
                                        sx={{ 
                                          fontSize: '0.75rem',
                                          color: 'var(--text-secondary)',
                                          display: 'block'
                                        }}
                                      >
                                        🕒 {formatDate(msg.timestamp)}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                </Box>
              ) : loadingSubscribers ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography className="text-secondary" sx={{ fontSize: '0.95rem' }}>
                  Carregando participantes...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography className="text-secondary" sx={{ fontSize: '0.95rem' }}>
                  Ainda não há participantes inscritos neste evento.
                </Typography>
                {!isSubscribed && userWallet && event.isActive && !isEventFull() && (
                  <Typography 
                    variant="caption" 
                    className="text-secondary"
                    sx={{ mt: 1, display: 'block', fontSize: '0.85rem' }}
                  >
                    Seja o primeiro a se inscrever!
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* QR Code Modal */}
      <Dialog
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'var(--primary-main)', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <QrCodeIcon />
            <Typography variant="h6">QR Code de Check-in</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3, textAlign: 'center' }}>
          {qrCodeData && (
            <>
              <Box
                component="img"
                src={qrCodeData.dataUrl}
                alt="QR Code"
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 'auto',
                  margin: '0 auto',
                  display: 'block',
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, wordBreak: 'break-all' }}>
                <strong>URL:</strong> {qrCodeData.url}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Os participantes devem escanear este QR code no local do evento para confirmar presença.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowQRModal(false)}>
            Fechar
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadQR}
            sx={{
              bgcolor: 'var(--primary-main)',
              '&:hover': {
                bgcolor: 'var(--primary-dark)',
              },
            }}
          >
            Baixar QR Code
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Subscribe Modal */}
      <Dialog
        open={showConfirmSubscribeModal}
        onClose={() => setShowConfirmSubscribeModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'var(--primary-main)', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">Confirmar Inscrição</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'var(--text-primary)',
              fontSize: '1rem',
              lineHeight: 1.6,
              mb: 2
            }}
          >
            Tem certeza que deseja se inscrever neste evento?
          </Typography>
          {event && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'var(--bg-surface-1)', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600, mb: 1 }}>
                {event.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                📍 {event.location}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                📅 {formatDate(event.eventDate)}
                {event.eventTime && ` às ${event.eventTime}`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setShowConfirmSubscribeModal(false)}
            variant="outlined"
            sx={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              '&:hover': {
                borderColor: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmSubscribe}
            variant="contained"
            sx={{
              bgcolor: 'var(--primary-main)',
              color: 'white',
              '&:hover': {
                bgcolor: 'var(--primary-dark)',
              },
            }}
          >
            Sim, confirmar inscrição
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subscribe Result Modal */}
      <Dialog
        open={showSubscribeResultModal}
        onClose={() => setShowSubscribeResultModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle 
          sx={{ 
            bgcolor: subscribeStatus?.type === 'success' ? 'var(--success-color, #3bc77e)' : 'var(--error-color, #f44336)',
            color: 'white'
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
              {subscribeStatus?.type === 'success' ? '✓' : '✗'}
            </Typography>
            <Typography variant="h6">
              {subscribeStatus?.type === 'success' ? 'Inscrição Confirmada!' : 'Erro na Inscrição'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'var(--text-primary)',
              fontSize: '1rem',
              lineHeight: 1.6
            }}
          >
            {subscribeStatus?.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowSubscribeResultModal(false)}
            variant="contained"
            sx={{
              bgcolor: subscribeStatus?.type === 'success' ? 'var(--success-color, #3bc77e)' : 'var(--error-color, #f44336)',
              color: 'white',
              '&:hover': {
                bgcolor: subscribeStatus?.type === 'success' ? '#2fa56a' : '#d32f2f',
              },
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventDetail;

