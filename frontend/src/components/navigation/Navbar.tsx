import React, { useState, useEffect, useContext } from 'react';
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
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Business as HubIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  EventNote as EventNoteIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useAdminAccess } from '../../contexts/AdminContext';
import { MetamaskContext } from '../../contexts/MetamaskContext';
import { WalletConnectContext } from '../../contexts/WalletConnectContext';
import { useNavigate } from 'react-router-dom';
import { toggleTheme, getCurrentTheme } from '../../utils/themeUtils';
import authEvents from '../../services/authEvents';
import '../../pages/landing/LandingPage.css';

const NavBar = () => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentTheme, setCurrentTheme] = useState(() => getCurrentTheme());
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'email' | 'wallet' | null>(null);
  const { hasAdminAccess, isCheckingAdmin } = useAdminAccess();
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const navigate = useNavigate();

  // Check localStorage for logged in user and sync with wallet contexts
  useEffect(() => {
    const storedWallet = localStorage.getItem('walletAddress');
    const storedAuthMethod = localStorage.getItem('authMethod') as 'email' | 'wallet' | null;
    setWalletAddress(storedWallet);
    setAuthMethod(storedAuthMethod);
  }, []);

  // Update wallet address when wallet contexts change
  useEffect(() => {
    const connectedWallet = metamaskCtx.metamaskAccountAddress || walletConnectCtx.accountId;
    if (connectedWallet) {
      setWalletAddress(connectedWallet);
      // Also update localStorage to keep in sync
      localStorage.setItem('walletAddress', connectedWallet);
    }
  }, [metamaskCtx.metamaskAccountAddress, walletConnectCtx.accountId]);

  // Listen to auth events for real-time updates
  useEffect(() => {
    const handleLogin = (data: any) => {
      console.log('🔄 Navbar: Login event received', data);
      const storedWallet = localStorage.getItem('walletAddress');
      const storedAuthMethod = localStorage.getItem('authMethod') as 'email' | 'wallet' | null;
      setWalletAddress(storedWallet);
      setAuthMethod(storedAuthMethod);
    };

    const handleLogout = () => {
      console.log('🔄 Navbar: Logout event received');
      setWalletAddress(null);
      setAuthMethod(null);
    };

    const handleWalletConnected = (data: any) => {
      console.log('🔄 Navbar: Wallet connected event received', data);
      if (data.walletAddress) {
        setWalletAddress(data.walletAddress);
        setAuthMethod('wallet');
      }
    };

    // Subscribe to auth events
    const unsubLogin = authEvents.onLogin(handleLogin);
    const unsubLogout = authEvents.onLogout(handleLogout);
    const unsubWalletConnected = authEvents.onWalletConnected(handleWalletConnected);

    // Cleanup
    return () => {
      unsubLogin();
      unsubLogout();
      unsubWalletConnected();
    };
  }, []);

  const handleLogout = async () => {
    console.log('Logout iniciado, método de autenticação:', authMethod);
    
    // If logged in via wallet, disconnect it
    if (authMethod === 'wallet') {
      try {
        // Disconnect MetaMask if connected
        if (metamaskCtx.metamaskAccountAddress && metamaskCtx.walletInterface) {
          console.log('Desconectando MetaMask...');
          metamaskCtx.walletInterface.disconnect();
        }
        
        // Disconnect WalletConnect if connected
        if (walletConnectCtx.accountId && walletConnectCtx.walletInterface) {
          console.log('Desconectando WalletConnect...', walletConnectCtx.accountId);
          walletConnectCtx.walletInterface.disconnect();
          console.log('WalletConnect desconectado');
        }
        
        // Give time for wallets to disconnect
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Erro ao desconectar carteira:', error);
      }
    }

    // Clear all localStorage
    console.log('Limpando localStorage...');
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('authMethod');
    
    setWalletAddress(null);
    setAuthMethod(null);
    
    // Emit logout event to notify all listeners
    authEvents.emitLogout();
    
    console.log('Logout completo, navegando para página inicial');
    navigate('/');
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
      label: 'Eventos',
      icon: <EventNoteIcon />,
      path: '/events',
      section: 'main'
    },
    {
      label: 'Loja',
      icon: <ShoppingCartIcon />,
      path: '/loja',
      section: 'main'
    },
    // Login/Signup for non-logged users
    ...(walletAddress ? [] : [
      {
        label: 'Login',
        icon: <LoginIcon />,
        path: '/login',
        section: 'auth'
      },
      {
        label: 'Criar Conta',
        icon: <PersonAddIcon />,
        path: '/signup',
        section: 'auth'
      }
    ]),
    // User options for logged in users
    ...(walletAddress ? [
      {
        label: 'Meu Perfil',
        icon: <PersonIcon />,
        path: '/profile',
        section: 'user'
      }
    ] : []),
    // Itens administrativos
    {
      label: 'Criar Evento',
      icon: <AdminPanelSettingsIcon />,
      path: '/create-event',
      section: 'admin'
    },
    { label: 'Gerenciar Usuários',
      icon: <AdminPanelSettingsIcon />,
      path: '/manage-users',
      section: 'admin'
    },
    { label: 'Gerenciar Eventos',
      icon: <AdminPanelSettingsIcon />,
      path: '/event-list',
      section: 'admin'
    },
    { label: 'Gerenciar Produtos',
      icon: <InventoryIcon />,
      path: '/manage-products',
      section: 'admin'
    },
    {
      label: 'Gerenciar Vendas',
      icon: <InventoryIcon />,
      path: '/sales-control',
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
          Hub
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
          
          {walletAddress ? (
            // Logged in: Show wallet address and logout
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--primary-main)',
                  color: 'var(--primary-contrast)',
                  px: 2,
                  py: 0.75,
                  borderRadius: '25px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  gap: 0.5
                }}
                title={authMethod === 'wallet' ? 'Conectado via WalletConnect' : 'Conectado via Email/Senha'}
              >
                <AccountCircleIcon sx={{ fontSize: '18px' }} />
                {walletAddress}
                {authMethod === 'wallet' && (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.7rem',
                      opacity: 0.8,
                      ml: 0.5,
                    }}
                  >
                    (Wallet)
                  </Typography>
                )}
              </Box>
              <Button
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                className="theme-transition"
                sx={{
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '25px',
                  px: 2,
                  py: 0.75,
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'var(--error-main)',
                    color: 'white',
                    borderColor: 'var(--error-main)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            // Not logged in: Show login and signup buttons
            <>
              <Button
                onClick={() => navigate('/login')}
                className="theme-transition"
                sx={{
                  color: 'var(--text-primary)',
                  border: '2px solid var(--primary-main)',
                  borderRadius: '25px',
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'var(--primary-main)',
                    color: 'var(--primary-contrast)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                className="theme-transition"
                sx={{
                  color: 'var(--primary-contrast)',
                  backgroundColor: 'var(--primary-main)',
                  borderRadius: '25px',
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'var(--primary-dark)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px hsla(14, 100%, 57%, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Criar Conta
              </Button>
            </>
          )}
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
        
        {/* Auth Section - Login/Signup */}
        {!walletAddress && menuItems.filter(item => item.section === 'auth').length > 0 && [
          <Divider key="auth-divider" />,
          <Typography 
            key="auth-title"
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
            Conta
          </Typography>,
          ...menuItems
            .filter(item => item.section === 'auth')
            .map((item) => (
              <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))
        ]}
        
        {/* User Section - For logged in users */}
        {walletAddress && menuItems.filter(item => item.section === 'user').length > 0 && [
          <Divider key="user-divider" />,
          <Typography 
            key="user-title"
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
            Minha Conta
          </Typography>,
          ...menuItems
            .filter(item => item.section === 'user')
            .map((item) => (
              <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            )),
          <MenuItem key="logout" onClick={() => { handleMenuClose(); handleLogout(); }}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </MenuItem>
        ]}
        
        {hasAdminAccess && [
          <Divider key="admin-divider" />,
          <Typography 
            key="admin-title"
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
    </AppBar>
  );
};

export default NavBar;