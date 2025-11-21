/**
 * @fileoverview Protected route component for admin-only pages
 */

import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { AdminPanelSettings, Block, Home } from '@mui/icons-material';
import { useAdminAccess } from '../contexts/AdminContext';
import { useWalletInterface } from '../services/wallets/useWalletInterface';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { hasAdminAccess, isCheckingAdmin } = useAdminAccess();
  const { accountId } = useWalletInterface();

  // Show loading state while checking admin status
  if (isCheckingAdmin) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          Verificando privilégios de administrador...
        </Typography>
      </Box>
    );
  }

  // Show access denied if user is not an admin
  if (!hasAdminAccess) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        gap={3}
        sx={{ textAlign: 'center', px: 3 }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: '50%',
            backgroundColor: 'error.light',
            color: 'error.contrastText'
          }}
        >
          <Block sx={{ fontSize: '60px' }} />
        </Box>
        
        <Typography variant="h4" color="error" gutterBottom>
          Acesso Negado
        </Typography>
        
        <Typography variant="body1" color="text.secondary" maxWidth="500px">
          {!accountId 
            ? 'Você precisa conectar uma carteira para acessar esta página.'
            : 'Esta página requer privilégios de administrador. Sua carteira não tem as permissões necessárias para acessar esta área.'
          }
        </Typography>
        
        <Box display="flex" gap={2} mt={2}>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => window.location.href = '/'}
            sx={{ minWidth: '150px' }}
          >
            Página Inicial
          </Button>
          
          {!accountId && (
            <Button
              variant="outlined"
              onClick={() => {
                // This will trigger the wallet connection dialog
                // You might want to add a custom handler here
                window.location.href = '/';
              }}
            >
              Conectar Carteira
            </Button>
          )}
        </Box>
        
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            <AdminPanelSettings sx={{ fontSize: '16px', mr: 1, verticalAlign: 'text-bottom' }} />
            Se você acredita que deveria ter acesso de administrador, entre em contato com o administrador do sistema.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Render the protected content if user has admin access
  return <>{children}</>;
};

// Alternative component for inline admin checks (doesn't replace the page)
interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ 
  children, 
  fallback = null, 
  showMessage = false 
}) => {
  const { hasAdminAccess, isCheckingAdmin } = useAdminAccess();

  if (isCheckingAdmin) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Verificando...
        </Typography>
      </Box>
    );
  }

  if (!hasAdminAccess) {
    if (showMessage) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Função disponível apenas para administradores
        </Typography>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}; 