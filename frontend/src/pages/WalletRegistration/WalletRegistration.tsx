import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { appConfig } from '../../config';
import './WalletRegistration.css';

interface LocationState {
  walletAddress: string;
}

export const WalletRegistration: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletAddress = state?.walletAddress;

  useEffect(() => {
    // Redirect if no wallet address provided
    if (!walletAddress) {
      navigate('/signup');
    }
  }, [walletAddress, navigate]);

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Create account with connected wallet
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/auth/wallet-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          walletAddress: walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao criar conta');
      }

      // Store token and wallet address
      localStorage.setItem('token', data.token);
      localStorage.setItem('walletAddress', walletAddress);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('authMethod', 'wallet'); // WalletConnect authentication
      if (formData.name) {
        localStorage.setItem('userName', formData.name);
      }

      // Redirect to events page
      navigate('/events');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return null;
  }

  return (
    <Box className="wallet-registration-page theme-transition" sx={{ 
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
          sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}
        >
          Complete seu Cadastro
        </Typography>

        <Typography 
          variant="body2" 
          className="text-secondary"
          sx={{ textAlign: 'center', mb: 3 }}
        >
          Sua carteira foi conectada! Agora precisamos de algumas informações.
        </Typography>

        {/* Locked Wallet Address */}
        <Paper elevation={1} sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: 'var(--bg-surface-2)',
          border: '1px solid var(--border-color)'
        }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LockIcon sx={{ color: 'var(--primary-main)', fontSize: '1.2rem' }} />
            <Typography variant="body2" fontWeight="600" color="var(--text-primary)">
              Carteira Conectada
            </Typography>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace',
              color: 'var(--text-secondary)',
              wordBreak: 'break-all'
            }}
          >
            {walletAddress}
          </Typography>
        </Paper>

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
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Senha"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            helperText="Mínimo de 6 caracteres"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Confirmar Senha"
            type="password"
            name="confirmPassword"
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
                Criando conta...
              </>
            ) : (
              'Finalizar Cadastro'
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
      </Paper>
    </Box>
  );
};

export default WalletRegistration;

