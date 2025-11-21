import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  Divider,
  Stack
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWalletInterface } from '../../services/wallets/useWalletInterface';
import { getCurrentTheme } from '../../utils/themeUtils';
import { AnimatedGradientButton } from '../../components';
import offchainDark from '../../assets/offchain_dark.png';
import offchainLight from '../../assets/offchain_light.png';
import offchainEvent from '../../assets/offchain_event.png';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { accountId, walletInterface } = useWalletInterface();
  const [currentTheme, setCurrentTheme] = useState(() => getCurrentTheme());

  useEffect(() => {
    // Função para atualizar o tema
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

    // Escuta mudanças no localStorage também
    window.addEventListener('storage', updateTheme);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  const handleConnectWallet = () => {
    if (accountId) {
      // Se já está conectado, vai para o processo de cadastro
      navigate('/join-request');
    } else {
      // Se não está conectado, precisa conectar primeiro
      // O botão de conexão está no navbar, então mostramos uma mensagem
      alert('Por favor, conecte sua carteira usando o botão "Connect Wallet" no canto superior direito.');
    }
  };



  return (
    <Box className="landing-page theme-transition">
      {/* Hero Section */}
      <Box sx={{ 
        py: 8, 
        px: { xs: 3, md: 6 },
        display: 'flex',
        alignItems: 'start',
        justifyContent: 'center',
        minHeight: '90vh'
      }}>
        <Box sx={{ 
          width: '100%',
          textAlign: 'center',
          maxWidth: '800px'
        }}>
          <Stack spacing={4} alignItems="center">
            <Box>
              <img 
                src={currentTheme !== 'dark' ? offchainDark : offchainLight}
                alt="Offchain Brazil Logo"
                style={{ 
                  maxWidth: '300px', 
                  width: '100%', 
                  height: 'auto',
                  marginBottom: '24px'
                }}
              />
            </Box>
            
            <Typography 
              variant="h1" 
              component="h1" 
              className="text-primary"
              sx={{ 
                fontSize: { xs: '2rem', md: '2.5rem' },
                color: 'var(--text-primary)',
                fontWeight: 'bold',
              }}
            >
              SEJA MEMBRO{' '}
              <Box component="span" sx={{ 
                color: 'var(--text-primary)',
                textDecoration: 'underline',
                textDecorationColor: 'var(--primary-main)'
              }}>
                OFFCHAIN
              </Box>{' '}
              <Box component="span" sx={{ color: 'var(--primary-main)' }}>
                GRATUITAMENTE
              </Box>
            </Typography>
            <Typography 
              variant="h5" 
              className="text-secondary"
              sx={{ 
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.6,
                fontWeight: 'medium'
              }}
            >
              Conecte sua carteira Hedera • Faça seu cadastro • Seja aprovado
              <br /><br />
              <Box component="span" sx={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                ✨ Receba sua NFT de membro ✨
              </Box>
              <br />
              🏢 Acesse hubs físicos no Brasil todo
              <br />
              🤝 Faça parte da nossa comunidade Web3
            </Typography>
            
            <Box sx={{ mt: 4 }}>
              <AnimatedGradientButton
                onClick={handleConnectWallet}
              >
                {accountId ? 'Começar Meu Cadastro' : 'Conectar Carteira'}
              </AnimatedGradientButton>
            </Box>
            
            {accountId && (
              <Typography variant="body2" className="text-secondary">
                ✅ Carteira conectada: {accountId}
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'var(--border-color)' }} />

      {/* About Section */}
      <Box sx={{ py: 8, px: { xs: 3, md: 6 } }}>
        <Typography 
          variant="h3" 
          component="h2" 
          className="text-primary"
          sx={{ 
            textAlign: 'center', 
            mb: 6,
            fontWeight: 'bold'
          }}
        >
          O que é a Offchain Brazil?
        </Typography>
        
        {/* Event Image Section */}
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Card 
            className="theme-transition"
            sx={{ 
              width: '100%',
              backgroundColor: 'var(--bg-surface-1)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              borderRadius: '20px'
            }}
          >
            <img
              src={offchainEvent}
              alt="Offchain Brazil Event"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </Card>
          <Typography 
            variant="body2" 
            className="text-secondary"
            sx={{ mt: 2, fontStyle: 'italic' }}
          >
            Nossos eventos presenciais conectam a comunidade blockchain brasileira
          </Typography>
        </Box>
        
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Card 
              className="theme-transition"
              sx={{ 
                p: 4,
                backgroundColor: 'var(--bg-surface-1)',
                border: '1px solid var(--border-color)',
                height: '100%'
              }}
            >
              <Typography 
                variant="h5" 
                className="text-primary"
                sx={{ mb: 3, fontWeight: 'bold' }}
              >
                🚀 A Iniciativa
              </Typography>
              <Typography 
                variant="body1" 
                className="text-secondary"
                sx={{ lineHeight: 1.7 }}
              >
                Neste vasto cenário de evolução das criptomoedas, o Brasil não fica atrás. Apesar das barreiras 
                financeiras e da falta de suporte do mercado interno em comparação com o internacional, nosso país 
                é um dos líderes em investimentos cripto. Porém, enfrentamos desafios: projetos incríveis, nacionais 
                e internacionais, muitas vezes permanecem desconhecidos ou lutam para crescer devido à falta de 
                visibilidade e recursos.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              className="theme-transition"
              sx={{ 
                p: 4,
                backgroundColor: 'var(--bg-surface-1)',
                border: '1px solid var(--border-color)',
                height: '100%'
              }}
            >
              <Typography 
                variant="h5" 
                className="text-primary"
                sx={{ mb: 3, fontWeight: 'bold' }}
              >
                💡 Nascimento da Solução
              </Typography>
              <Typography 
                variant="body1" 
                className="text-secondary"
                sx={{ lineHeight: 1.7 }}
              >
                Diante dessas dificuldades, nasceu o Super Encontro BR no X(Twitter) Spaces, um espaço onde nossas 
                comunidades poderiam dialogar e juntas encontrar soluções. Descobrimos um problema significativo: 
                apesar das inúmeras oportunidades nas comunidades das blockchains, essas oportunidades não estavam 
                chegando às comunidades que tanto as procuravam.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              className="theme-transition"
              sx={{ 
                p: 4,
                backgroundColor: 'var(--bg-surface-1)',
                border: '1px solid var(--border-color)',
                height: '100%'
              }}
            >
              <Typography 
                variant="h5" 
                className="text-primary"
                sx={{ mb: 3, fontWeight: 'bold' }}
              >
                🎯 Missão e Objetivos
              </Typography>
              <Typography 
                variant="body1" 
                className="text-secondary"
                sx={{ lineHeight: 1.7 }}
              >
                Nosso propósito é claro: servir como uma ponte entre as blockchains e os projetos, facilitando o 
                fluxo de informações e oportunidades entre eles. Queremos criar um ambiente onde a inovação flua 
                livremente. Além disso, buscamos levar conhecimento para além dos limites da web3, organizando 
                eventos em faculdades, meetups presenciais e online, hackathons e muito mais.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              className="theme-transition"
              sx={{ 
                p: 4,
                backgroundColor: 'var(--bg-surface-1)',
                border: '1px solid var(--border-color)',
                height: '100%'
              }}
            >
              <Typography 
                variant="h5" 
                className="text-primary"
                sx={{ mb: 3, fontWeight: 'bold' }}
              >
                🤝 Nosso Compromisso
              </Typography>
              <Typography 
                variant="body1" 
                className="text-secondary"
                sx={{ lineHeight: 1.7 }}
              >
                No coração da OffChain Brazil está a transparência e a imparcialidade. Não favorecemos nenhuma 
                comunidade blockchain ou projeto em particular, e não buscamos privilegiar nenhum com informações 
                exclusivas. Acreditamos na conversa aberta e no entendimento mútuo. Deixamos que as próprias 
                blockchains filtrem projetos maliciosos e promovam a segurança.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card 
              className="theme-transition"
              sx={{ 
                p: 6,
                backgroundColor: 'var(--bg-surface-1)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ mb: 3, fontWeight: 'bold', color: 'inherit' }}
              >
                🌟 Nossa Visão
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ lineHeight: 1.7, color: 'inherit' }}
              >
                Imaginamos um mercado cripto brasileiro robusto, impulsionado por uma variedade de projetos 
                inovadores que não apenas transformam nosso cenário nacional, mas também ecoam internacionalmente. 
                Acreditamos que, ao criar conexões sólidas e oportunidades transparentes, podemos alcançar este objetivo.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LandingPage; 