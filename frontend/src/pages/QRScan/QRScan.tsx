import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  QrCode as QrCodeIcon,
  CardGiftcard as GiftIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { appConfig } from '../../config';
import { useWalletInterface } from '../../services/wallets/useWalletInterface';
import { useTokenAssociation } from '../../hooks/useTokenAssociation';
import TokenAssociationModal from '../../components/TokenAssociationModal';
import { TOKENS } from '../../config/tokens';
import './QRScan.css';

interface Event {
  _id: string;
  name: string;
  description?: string;
  location: string;
  eventDate: string;
  eventTime?: string;
  photo?: string;
  rewardTokenId?: string;
  rewardAmount?: number;
}

interface CheckInResult {
  isFirstTime: boolean;
  memberNftMinted: boolean;
  rewardDistributed: boolean;
  attendedAt: string;
}

export const QRScan: React.FC = () => {
  const { eventId, token } = useParams<{ eventId: string; token: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  const navigate = useNavigate();
  const { walletInterface, accountId } = useWalletInterface();
  const tokenAssociation = useTokenAssociation();

  useEffect(() => {
    // Get wallet address from localStorage
    const storedWallet = localStorage.getItem('walletAddress');
    setWalletAddress(storedWallet);
    
    // Fetch event details
    fetchEventDetails();
  }, [eventId]);

  // Check if user is first-time participant
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!walletAddress) return;

      try {
        const response = await fetch(
          `${appConfig.networks.testnet.backendUrl}/api/events/subscriptions/me`,
          {
            headers: {
              'wallet-address': walletAddress,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.subscriptions) {
            // Check if any subscription has attended status
            const hasAttended = data.subscriptions.some(
              (sub: any) => sub.status === 'attended'
            );
            setIsFirstTimeUser(!hasAttended);
          }
        }
      } catch (err) {
        console.error('Error checking first-time user:', err);
        // Assume not first-time on error to be safe
        setIsFirstTimeUser(false);
      }
    };

    checkFirstTimeUser();
  }, [walletAddress]);

  const fetchEventDetails = async () => {
    if (!eventId) {
      setError('ID do evento não fornecido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events/${eventId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Evento não encontrado');
      }

      setEvent(data.event);
    } catch (err: any) {
      console.error('Error fetching event:', err);
      setError(err.message || 'Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!walletAddress) {
      setError('Você precisa estar logado para fazer check-in');
      return;
    }

    if (!token) {
      setError('Token QR inválido');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      // Step 1: Check if this is a non-custodial wallet (has walletInterface)
      // Only non-custodial wallets need frontend token association
      const isNonCustodialWallet = walletInterface && accountId;

      if (isNonCustodialWallet) {
        console.log('🔐 Non-custodial wallet detected, checking token associations...');
        
        // Check which tokens need to be associated
        const tokensToCheck: string[] = [];

        // Check if member NFT is needed (first-time user)
        if (isFirstTimeUser) {
          console.log('📋 First-time user detected, will need member NFT association');
          tokensToCheck.push(TOKENS.MEMBER_NFT.id);
        }

        // Check if reward token is needed (event has rewards)
        if (event?.rewardTokenId && event?.rewardAmount) {
          console.log('🎁 Event has rewards, will need reward token association');
          tokensToCheck.push(event.rewardTokenId);
        }

        // Step 2: Ensure all required tokens are associated (only for non-custodial)
        if (tokensToCheck.length > 0) {
          console.log(`🔍 Checking association for ${tokensToCheck.length} token(s)...`);
          
          const associationResult = await tokenAssociation.checkMultipleAssociations(
            accountId,
            tokensToCheck,
            walletInterface
          );

          if (!associationResult.success) {
            if (associationResult.userCancelled) {
              setError('Associação de token cancelada. Check-in não realizado.');
            } else {
              setError(
                associationResult.error ||
                'Falha ao associar tokens necessários. Por favor, tente novamente.'
              );
            }
            setChecking(false);
            return;
          }

          console.log('✅ All tokens associated successfully');
        } else {
          console.log('ℹ️ No token associations required');
        }
      } else {
        console.log('🏦 Custodial wallet detected, backend will handle token associations');
      }

      // Step 3: Proceed with backend check-in
      console.log('📝 Proceeding with backend check-in...');
      const response = await fetch(
        `${appConfig.networks.testnet.backendUrl}/api/events/${eventId}/checkin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'wallet-address': walletAddress,
          },
          body: JSON.stringify({
            qrSecretToken: token,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer check-in');
      }

      if (data.success) {
        setCheckInResult(data.data);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || 'Erro ao fazer check-in');
    } finally {
      setChecking(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box className="qrscan-page theme-transition" sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !event) {
    return (
      <Box className="qrscan-page theme-transition" sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error">
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/events')}
            sx={{ mt: 2 }}
          >
            Ver Eventos
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!walletAddress) {
    return (
      <Box className="qrscan-page theme-transition" sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <QrCodeIcon sx={{ fontSize: 60, color: 'var(--primary-main)', mb: 2 }} />
          <Typography variant="h5" gutterBottom className="text-primary">
            Login Necessário
          </Typography>
          <Typography variant="body1" className="text-secondary" sx={{ mb: 3 }}>
            Você precisa estar logado para fazer check-in no evento.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
            >
              Fazer Login
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/signup')}
            >
              Criar Conta
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (checkInResult) {
    return (
      <Box className="qrscan-page theme-transition" sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          
          <Typography variant="h4" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
            Check-in Realizado!
          </Typography>

          <Typography variant="body1" className="text-secondary" sx={{ mb: 4 }}>
            Sua presença foi confirmada em <strong>{event?.name}</strong>
          </Typography>

          {checkInResult.isFirstTime && (
            <Alert severity="success" icon={<TrophyIcon />} sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" fontWeight="600" gutterBottom>
                🎉 Primeiro Evento!
              </Typography>
              <Typography variant="body2">
                Esta é a primeira vez que você participa de um evento! 
                {checkInResult.memberNftMinted && ' Você recebeu um NFT de membro Offchain!'}
              </Typography>
            </Alert>
          )}

          {checkInResult.rewardDistributed && (
            <Alert severity="info" icon={<GiftIcon />} sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" fontWeight="600" gutterBottom>
                🎁 Recompensa Recebida!
              </Typography>
              <Typography variant="body2">
                Tokens de participação foram enviados para sua carteira.
              </Typography>
            </Alert>
          )}

          <Card sx={{ mt: 3, bgcolor: 'var(--bg-surface-1)' }}>
            <CardContent>
              <Typography variant="caption" className="text-secondary" display="block" gutterBottom>
                Detalhes do Check-in
              </Typography>
              <Typography variant="body2" className="text-primary" gutterBottom>
                <strong>Evento:</strong> {event?.name}
              </Typography>
              <Typography variant="body2" className="text-primary" gutterBottom>
                <strong>Horário:</strong> {new Date(checkInResult.attendedAt).toLocaleString('pt-BR')}
              </Typography>
              {checkInResult.memberNftMinted && (
                <Chip 
                  label="NFT de Membro Recebido" 
                  size="small" 
                  color="success" 
                  sx={{ mt: 1, mr: 1 }}
                />
              )}
              {checkInResult.rewardDistributed && (
                <Chip 
                  label="Recompensa Recebida" 
                  size="small" 
                  color="info" 
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>

          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/events')}
            sx={{ mt: 3 }}
          >
            Ver Outros Eventos
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="qrscan-page theme-transition" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
    }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
        <Box textAlign="center" mb={4}>
          <QrCodeIcon sx={{ fontSize: 60, color: 'var(--primary-main)', mb: 2 }} />
          <Typography variant="h4" gutterBottom className="text-primary" fontWeight="bold">
            Check-in no Evento
          </Typography>
        </Box>

        {event && (
          <Card sx={{ mb: 3, bgcolor: 'var(--bg-surface-1)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom className="text-primary">
                {event.name}
              </Typography>
              {event.description && (
                <Typography variant="body2" className="text-secondary" paragraph>
                  {event.description}
                </Typography>
              )}
              <Typography variant="body2" className="text-secondary">
                <strong>Local:</strong> {event.location}
              </Typography>
              <Typography variant="body2" className="text-secondary">
                <strong>Data:</strong> {formatDate(event.eventDate)}
                {event.eventTime && ` às ${event.eventTime}`}
              </Typography>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Ao confirmar, sua presença será registrada neste evento.
            {' '}Se esta for sua primeira participação, você receberá um NFT de membro!
          </Typography>
        </Alert>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleCheckIn}
          disabled={checking}
          sx={{
            bgcolor: 'var(--primary-main)',
            color: 'white',
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'var(--primary-dark)',
            },
          }}
        >
          {checking ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
              Confirmando presença...
            </>
          ) : (
            'Confirmar Check-in'
          )}
        </Button>

        <Box textAlign="center" mt={2}>
          <Button
            onClick={() => navigate(`/events/${eventId}`)}
            sx={{ textTransform: 'none' }}
          >
            Ver detalhes do evento
          </Button>
        </Box>
      </Paper>

      {/* Token Association Modal */}
      {tokenAssociation.currentToken && (
        <TokenAssociationModal
          isOpen={tokenAssociation.isModalOpen}
          token={tokenAssociation.currentToken}
          onAssociate={tokenAssociation.handleAssociate}
          onCancel={tokenAssociation.handleCancel}
          onSuccess={tokenAssociation.handleSuccess}
        />
      )}
    </Box>
  );
};

export default QRScan;




