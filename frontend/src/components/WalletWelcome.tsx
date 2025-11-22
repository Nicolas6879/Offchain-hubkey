import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface WalletWelcomeProps {
  open: boolean;
  accountId: string;
  privateKey: string;
  publicKey: string;
  onClose: () => void;
}

export const WalletWelcome: React.FC<WalletWelcomeProps> = ({
  open,
  accountId,
  privateKey,
  publicKey,
  onClose,
}) => {
  const [understood, setUnderstood] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadQR = (data: string, filename: string) => {
    const canvas = document.createElement('canvas');
    const qrSize = 400;
    canvas.width = qrSize;
    canvas.height = qrSize;
    
    // This is a simplified download - in production you'd want to render the QR properly
    const link = document.createElement('a');
    link.download = `${filename}.txt`;
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`;
    link.click();
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle sx={{ 
        bgcolor: 'var(--primary-main)', 
        color: 'white',
        textAlign: 'center',
        py: 3
      }}>
        <Typography variant="h4" component="div" fontWeight="bold">
          🎉 Carteira Criada com Sucesso!
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="600">
            IMPORTANTE: Guarde essas informações com segurança!
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Esta é a ÚNICA vez que você verá sua chave privada. Sem ela, você não poderá acessar sua carteira.
            Tire um print da tela ou copie as informações antes de continuar.
          </Typography>
        </Alert>

        {/* Account ID Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'var(--bg-surface-1)' }}>
          <Typography variant="h6" gutterBottom color="var(--text-primary)">
            ID da Conta (Wallet Address)
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: 'monospace', 
                bgcolor: 'var(--bg-surface-2)', 
                p: 1.5, 
                borderRadius: 1,
                flex: 1,
                wordBreak: 'break-all'
              }}
            >
              {accountId}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopy(accountId, 'accountId')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {copied === 'accountId' ? 'Copiado!' : 'Copiar'}
            </Button>
          </Box>
          
          <Typography variant="caption" color="var(--text-secondary)" display="block" textAlign="center" sx={{ mt: 1 }}>
            Este é seu endereço público para receber transferências
          </Typography>
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Private Key Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: 'var(--bg-surface-1)', 
            border: '2px solid var(--primary-main)',
            boxShadow: '0 4px 20px rgba(255, 87, 34, 0.15)'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: 'var(--primary-main)' }}>
            ⚠️ Chave Privada (CONFIDENCIAL)
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} mb={2}>
            Nunca compartilhe esta chave com ninguém! Qualquer pessoa com acesso a ela pode controlar sua carteira.
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                bgcolor: 'var(--bg-surface-2)', 
                color: 'var(--text-primary)',
                p: 1.5, 
                borderRadius: 1,
                flex: 1,
                wordBreak: 'break-all',
                border: '1px solid var(--border-color)'
              }}
            >
              {privateKey}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopy(privateKey, 'privateKey')}
              sx={{ 
                whiteSpace: 'nowrap',
                bgcolor: 'var(--primary-main)',
                color: 'var(--primary-contrast)',
                '&:hover': {
                  bgcolor: 'var(--primary-dark)'
                }
              }}
            >
              {copied === 'privateKey' ? 'Copiado!' : 'Copiar'}
            </Button>
          </Box>
          
          <Box display="flex" justifyContent="center" my={2}>
            <Box 
              p={2} 
              bgcolor="white" 
              borderRadius={2} 
              border="2px solid var(--primary-main)"
              sx={{ boxShadow: '0 2px 10px rgba(255, 87, 34, 0.2)' }}
            >
              <QRCodeSVG value={privateKey} size={200} />
            </Box>
          </Box>
          
          <Typography 
            variant="caption" 
            sx={{ color: 'var(--text-secondary)' }} 
            display="block" 
            textAlign="center"
          >
            Guarde este QR code em local seguro - é sua chave de acesso
          </Typography>
        </Paper>

        {/* Instructions */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="600" gutterBottom>
            Como guardar sua carteira:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Tire um print desta tela e guarde em local seguro</li>
            <li>Ou copie e cole as informações em um arquivo protegido</li>
            <li>Você pode salvar os QR codes como imagem</li>
            <li>NUNCA compartilhe sua chave privada com ninguém</li>
          </ul>
        </Alert>

        {/* Confirmation Checkbox */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'var(--bg-surface-1)', borderRadius: 2 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={understood} 
                onChange={(e) => setUnderstood(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                Eu entendo que preciso guardar essas informações com segurança e que não poderei recuperá-las depois.
              </Typography>
            }
          />
        </Box>

        {/* Continue Button */}
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            variant="contained"
            size="large"
            disabled={!understood}
            onClick={onClose}
            sx={{
              bgcolor: 'var(--primary-main)',
              color: 'white',
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'var(--primary-dark)',
              },
              '&:disabled': {
                bgcolor: '#ccc',
                color: '#666',
              },
            }}
          >
            Continuar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WalletWelcome;

