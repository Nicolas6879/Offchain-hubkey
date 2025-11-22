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
import { WalletSelectionDialog } from '../../components/dialogs';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import authEvents from '../../services/authEvents';
import './Login.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  
  const navigate = useNavigate();
  
  // Handle wallet connection auth
  useWalletAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      // Store token and wallet address
      localStorage.setItem('token', data.token);
      localStorage.setItem('walletAddress', data.user.walletAddress);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('authMethod', 'email'); // Email/password authentication
      if (data.user.name) {
        localStorage.setItem('userName', data.user.name);
      }

      // Emit login event to notify all listeners (this will trigger AdminContext check)
      authEvents.emitLogin({
        walletAddress: data.user.walletAddress,
        authMethod: 'email',
        userEmail: data.user.email,
        userName: data.user.name,
      });

      // Small delay to ensure AdminContext has time to check admin status
      await new Promise(resolve => setTimeout(resolve, 300));

      // Redirect to events page
      navigate('/events');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-page theme-transition" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      px: 2,
    }}>
      <Paper elevation={3} sx={{ 
        maxWidth: 450,
        width: '100%',
        p: 4,
        bgcolor: 'var(--bg-surface-1)',
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          className="text-primary"
          sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}
        >
          Login
        </Typography>

        <Typography 
          variant="body2" 
          className="text-secondary"
          sx={{ textAlign: 'center', mb: 4 }}
        >
          Entre com sua conta Offchain
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2" className="text-secondary">
              Não tem uma conta?{' '}
              <Button
                onClick={() => navigate('/signup')}
                sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
              >
                Criar conta
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
          Já possui uma carteira Hedera? Conecte-se usando WalletConnect
        </Typography>
      </Paper>

      <WalletSelectionDialog 
        open={showWalletDialog} 
        setOpen={setShowWalletDialog}
        onClose={() => setShowWalletDialog(false)}
      />
    </Box>
  );
};

export default Login;

