import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  Menu, 
  MenuItem, 
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  PendingActions as PendingActionsIcon,
  Business as HubIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { useWalletInterface } from '../../services/wallets/useWalletInterface';
import { useAdminAccess } from '../../contexts/AdminContext';
import { WalletSelectionDialog } from '../dialogs';
import { useNavigate } from 'react-router-dom';
import { toggleTheme, getCurrentTheme } from '../../utils/themeUtils';
import '../../pages/landing/LandingPage.css';
import path from 'path';

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentTheme, setCurrentTheme] = useState(() => getCurrentTheme());
  const { accountId, walletInterface } = useWalletInterface();
  const { hasAdminAccess, isCheckingAdmin } = useAdminAccess();
  const navigate = useNavigate();

  const handleConnect = async () => {
    if (accountId) {
      walletInterface?.disconnect();
    } else {
      setOpen(true);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setCurrentTheme(newTheme);
  };

  useEffect(() => {
    if (accountId) {
      setOpen(false);
    }
  }, [accountId]);

  // Sincroniza mudanças de tema
  useEffect(() => {
    const updateTheme = () => {
      setCurrentTheme(getCurrentTheme());
    };

    // Observer para mudanças no atributo data-theme do documento
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    // Observa mudanças no data-theme do documento
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const menuItems = [
    {
      label: 'Página Inicial',
      icon: <HomeIcon />,
      path: '/',
      section: 'main'
    },
    {
      label: 'Meus Dados',
      icon: <PersonAddIcon />,
      path: '/join-request',
      section: 'user'
    },
    {
      label: 'Solicitar Acesso ao Hub',
      icon: <HubIcon />,
      path: '/hub-access-request',
      section: 'user'
    },
    {
      label: 'Status do Acesso',
      icon: <CheckCircleIcon />,
      path: '/hub-access-status',
      section: 'user'
    },
    {
      label: 'Assinatura em Tempo Real',
      icon: <EditIcon />,
      path: '/realtime-signature',
      section: 'user'
    },
    {
      label: 'Aprovar Solicitações',
      icon: <AdminPanelSettingsIcon />,
      path: '/approve-join',
      section: 'admin'
    },
    { label: 'Gerenciar Usuários',
      icon: <AdminPanelSettingsIcon />,
      path: '/manage-users',
      section: 'admin'
    },
    { label: 'Gerenciar Hubs',
      icon: <AdminPanelSettingsIcon />,
      path: '/hub-controller',
      section: 'admin'
    }
  ];

  return (
    <AppBar 
      position="static" 
      className="theme-transition"
      sx={{ 
        backgroundColor: 'var(--bg-main)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <IconButton
          edge="start"
          aria-label="menu"
          onClick={handleMenuOpen}
          className="theme-transition"
          sx={{ 
            mr: 2,
            color: 'var(--text-primary)',
            '&:hover': {
              backgroundColor: 'var(--primary-main)',
              color: 'var(--primary-contrast)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            color: 'var(--text-primary)',
            fontWeight: 'bold',
            fontSize: '1.3rem'
          }}
        >
          <Box component="span" sx={{ color: 'var(--primary-main)' }}>
            Offchain
          </Box>{' '}
          Hubs
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Admin Badge */}
          {hasAdminAccess && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--success-main)',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                gap: 0.5
              }}
            >
              <AdminPanelSettingsIcon sx={{ fontSize: '16px' }} />
              ADMIN
            </Box>
          )}
          
          {/* Loading indicator for admin check */}
          {isCheckingAdmin && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem'
              }}
            >
              Verificando...
            </Box>
          )}
          
          <IconButton
            onClick={handleThemeToggle}
            title={`Mudar para modo ${currentTheme === 'dark' ? 'claro' : 'escuro'}`}
            className="theme-transition"
            sx={{
              color: 'var(--text-primary)',
              '&:hover': {
                backgroundColor: 'var(--primary-main)',
                color: 'var(--primary-contrast)',
                transform: 'rotate(180deg)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {currentTheme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          
          <Button 
            onClick={handleConnect}
            className="theme-transition"
            sx={{
              color: accountId ? 'var(--primary-contrast)' : 'var(--text-primary)',
              backgroundColor: accountId ? 'var(--primary-main)' : 'transparent',
              border: `2px solid ${accountId ? 'var(--primary-main)' : 'var(--primary-main)'}`,
              borderRadius: '25px',
              px: 3,
              py: 1,
              fontWeight: 'bold',
              fontSize: '0.9rem',
              textTransform: 'none',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: 'var(--primary-main)',
                color: 'var(--primary-contrast)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px hsla(14, 100%, 57%, 0.4)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 0,
                height: 0,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                transition: 'width 0.3s ease, height 0.3s ease',
                pointerEvents: 'none'
              },
              '&:hover::before': {
                width: '300px',
                height: '300px'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {accountId ? accountId : 'Conectar Carteira'}
          </Button>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        className="theme-transition"
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-surface-1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            minWidth: '280px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            mt: 1,
            '& .MuiMenuItem-root': {
              color: 'var(--text-primary)',
              borderRadius: '8px',
              margin: '4px 8px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'var(--primary-main)',
                color: 'var(--primary-contrast)',
                transform: 'translateX(4px)'
              }
            },
            '& .MuiListItemIcon-root': {
              color: 'inherit',
              minWidth: '36px'
            },
            '& .MuiDivider-root': {
              borderColor: 'var(--border-color)',
              margin: '8px 0'
            }
          }
        }}
      >
        {/* Seção Principal */}
        {menuItems
          .filter(item => item.section === 'main')
          .map((item) => (
            <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))
        }
        
        <Divider />
        
        {/* Seção do Usuário */}
        <Typography 
          variant="subtitle2" 
          sx={{ 
            px: 2, 
            py: 1, 
            color: 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
        >
          Solicitações de Usuário
        </Typography>
        
        {menuItems
          .filter(item => item.section === 'user')
          .map((item) => (
            <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))
        }
        
        {hasAdminAccess && [
          <Divider key="admin-divider" />,
          
          /* Seção Administrativa */
          <Typography 
            key="admin-section-title"
            variant="subtitle2" 
            sx={{ 
              px: 2, 
              py: 1, 
              color: 'var(--text-secondary)',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            Área Administrativa
          </Typography>,
          
          ...menuItems
            .filter(item => item.section === 'admin')
            .map((item) => (
              <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))
        ]}
      </Menu>

      <WalletSelectionDialog open={open} setOpen={setOpen} onClose={() => setOpen(false)} />
    </AppBar>
  );
};

export default NavBar;