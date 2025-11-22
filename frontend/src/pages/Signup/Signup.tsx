import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { appConfig } from '../../config';
import { WalletWelcome } from '../../components/WalletWelcome';
import { WalletSelectionDialog } from '../../components/dialogs';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import './Signup.css';

interface WalletData {
  accountId: string;
  publicKey: string;
  privateKey: string;
}

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  
  const navigate = useNavigate();
  
  // Handle wallet connection auth
  useWalletAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios');
      return false;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta');
      }

      if (data.success && data.wallet) {
        // Store token and auth method
        localStorage.setItem('token', data.token);
        localStorage.setItem('walletAddress', data.wallet.accountId);
        localStorage.setItem('authMethod', 'email'); // Email/password with auto-generated wallet
        
        // Show wallet information
        setWalletData(data.wallet);
        setShowWalletModal(true);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletModalClose = () => {
    setShowWalletModal(false);
    // Navigate to events page after wallet setup
    navigate('/events');
  };

  return (
    <Box className="signup-page theme-transition" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      px: 2,
    }}>
      <Paper elevation={3} sx={{ 
        maxWidth: 500,
        width: '100%',
        p: 4,
        bgcolor: 'var(--bg-surface-1)',
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          className="text-primary"
          sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}
        >
          Criar Conta
        </Typography>

        <Typography 
          variant="body2" 
          className="text-secondary"
          sx={{ textAlign: 'center', mb: 4 }}
        >
          Uma carteira Hedera será criada automaticamente para você
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nome (opcional)"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Senha"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            helperText="Mínimo 6 caracteres"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Confirmar Senha"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              bgcolor: 'var(--primary-main)',
              color: 'white',
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              mb: 2,
              '&:hover': {
                bgcolor: 'var(--primary-dark)',
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                Criando conta e carteira...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2" className="text-secondary">
              Já tem uma conta?{' '}
              <Button
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
              >
                Fazer login
              </Button>
            </Typography>
          </Box>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OU
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<AccountBalanceWalletIcon />}
          onClick={() => setShowWalletDialog(true)}
          sx={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              borderColor: 'var(--primary-main)',
              backgroundColor: 'rgba(var(--primary-main-rgb), 0.1)',
            },
          }}
        >
          Conectar Carteira Existente
        </Button>

        <Typography
          variant="caption"
          display="block"
          textAlign="center"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          Já possui uma carteira Hedera? Conecte-se diretamente
        </Typography>
      </Paper>

      <WalletSelectionDialog 
        open={showWalletDialog} 
        setOpen={setShowWalletDialog}
        onClose={() => setShowWalletDialog(false)}
      />

      {/* Wallet Welcome Modal */}
      {walletData && (
        <WalletWelcome
          open={showWalletModal}
          accountId={walletData.accountId}
          privateKey={walletData.privateKey}
          publicKey={walletData.publicKey}
          onClose={handleWalletModalClose}
        />
      )}
    </Box>
  );
};

export default Signup;

