import React, { useState, useEffect, useCallback, useContext } from "react";
import { Box, Paper, Typography, Button, Alert, CircularProgress, Card, CardContent } from "@mui/material";
import { CheckCircle, Error as ErrorIcon, PendingActions, SignalWifi1Bar, SignalWifiOff } from "@mui/icons-material";
import { useWalletInterface } from "../../services/wallets/useWalletInterface";
import { MetamaskContext } from "../../contexts/MetamaskContext";
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import socketService, { SignatureRequest } from "../../services/socketService";
import "./RealtimeSignaturePage.css";

interface SignatureRequestData extends SignatureRequest {
  timestamp: Date;
}

const RELOAD_FLAG_KEY = 'realtimeSignaturePageReloaded';

export default function RealtimeSignaturePage() {
  const { accountId, walletInterface } = useWalletInterface();
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  
  const [isConnected, setIsConnected] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<SignatureRequestData | null>(null);
  const [isSigningInProgress, setIsSigningInProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [signatureHistory, setSignatureHistory] = useState<Array<{
    requestId: string;
    message: string;
    status: 'completed' | 'failed';
    timestamp: Date;
  }>>([]);

  const walletType = metamaskCtx.metamaskAccountAddress ? 'MetaMask' : 
                     walletConnectCtx.accountId ? 'WalletConnect' : 'Unknown';
  const isWalletConnected = !!(metamaskCtx.metamaskAccountAddress || walletConnectCtx.accountId);

  console.log('Wallet detection:', {
    accountId,
    metamaskAddress: metamaskCtx.metamaskAccountAddress,
    walletConnectId: walletConnectCtx.accountId,
    walletConnectConnected: walletConnectCtx.isConnected,
    detectedType: walletType,
    isConnected: isWalletConnected
  });

  const handleSignatureRequest = useCallback((request: SignatureRequest) => {
    console.log('Received signature request:', request);
    setCurrentRequest({
      ...request,
      timestamp: new Date()
    });
    setStatusMessage("");
    setErrorMessage("");
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (connected) {
      setStatusMessage("Conectado ao servidor de verificação");
    } else {
      setStatusMessage("Desconectado do servidor");
    }
  }, []);

  // Use this useEffect specifically for the hard refresh logic
  useEffect(() => {
    // Check if the page has already been reloaded in this session
    const hasReloaded = sessionStorage.getItem(RELOAD_FLAG_KEY);
    
    if (!hasReloaded) {
      console.log('RealtimeSignaturePage: Primeira visita na sessão, forçando hard refresh.');
      sessionStorage.setItem(RELOAD_FLAG_KEY, 'true'); // Set the flag
      window.location.reload(); // Perform the hard reload
    } else {
      console.log('RealtimeSignaturePage: Já recarregada nesta sessão.');
      // After the first reload, proceed with soft refresh logic for subsequent renders
      // or if the page was accessed via navigation within the SPA.
      setCurrentRequest(null); 
      setIsSigningInProgress(false); 
      setStatusMessage("Aguardando solicitação de assinatura..."); 
      setErrorMessage(""); 
    }

    // This part remains the same for socket connection and cleanup
    if (isWalletConnected && accountId) {
      console.log('Conectando ao socket com a carteira:', accountId, 'tipo:', walletType);
      
      socketService.connect();
      socketService.registerWallet(accountId);
      
      socketService.onSignatureRequest(handleSignatureRequest);
      socketService.onConnectionChange(handleConnectionChange);

      return () => {
        socketService.offSignatureRequest(handleSignatureRequest);
        socketService.offConnectionChange(handleConnectionChange);
      };
    } else {
      console.log('Carteira não conectada, desconectando socket');
      socketService.unregisterWallet();
      socketService.disconnect();
      setIsConnected(false);
    }
    // Note: The dependency array should include dependencies from the socket logic,
    // but not from the reload logic itself to avoid re-triggering reload on state changes.
  }, [isWalletConnected, accountId, walletType, handleSignatureRequest, handleConnectionChange]);


  const handleSignMessage = async () => {
    if (!currentRequest || !walletInterface || !accountId || !isWalletConnected) {
      setErrorMessage("Dados de solicitação ou carteira não disponíveis");
      return;
    }

    setIsSigningInProgress(true);
    setErrorMessage("");
    
    if (walletType === 'WalletConnect') {
      setStatusMessage("Solicitando assinatura via WalletConnect...");
    } else {
      setStatusMessage("Assinando mensagem...");
    }

    try {
      console.log('Iniciando processo de assinatura para a mensagem:', currentRequest.message);
      console.log('Interface da carteira:', walletInterface);
      console.log('ID da conta:', accountId);
      console.log('Tipo de carteira:', walletType);

      const signature = await walletInterface.signMessage(currentRequest.message);
      
      console.log('Assinatura obtida:', signature ? 'Sucesso' : 'Falha');
      console.log('Valor da assinatura:', signature);
      
      if (signature) {
        if (walletType === 'WalletConnect') {
          setStatusMessage("Assinatura WalletConnect obtida! Enviando para verificação...");
        } else {
          setStatusMessage("Assinatura obtida! Enviando para verificação...");
        }
        
        console.log('Enviando assinatura para o backend...');
        
        socketService.submitSignature({
          requestId: currentRequest.requestId,
          signature: signature,
          message: currentRequest.message
        });

        setSignatureHistory(prev => [...prev, {
          requestId: currentRequest.requestId,
          message: currentRequest.message,
          status: 'completed',
          timestamp: new Date()
        }]);

        if (walletType === 'WalletConnect') {
          setStatusMessage("Assinatura WalletConnect enviada com sucesso!");
        } else {
          setStatusMessage("Assinatura enviada com sucesso!");
        }
        setCurrentRequest(null); 
      } else {
        throw new Error("Assinatura não foi obtida");
      }
    } catch (error: any) {
      console.error('Erro ao assinar mensagem:', error);
      
      let displayErrorMessage = "Erro ao assinar mensagem";
      if (error.message) {
        displayErrorMessage = error.message;
      }
      setErrorMessage(displayErrorMessage);
      
      setSignatureHistory(prev => [...prev, {
        requestId: currentRequest.requestId,
        message: currentRequest.message,
        status: 'failed',
        timestamp: new Date()
      }]);
    } finally {
      setIsSigningInProgress(false);
    }
  };

  const handleRejectSignature = () => {
    if (currentRequest) {
      setSignatureHistory(prev => [...prev, {
        requestId: currentRequest.requestId,
        message: currentRequest.message,
        status: 'failed',
        timestamp: new Date()
      }]);
      setCurrentRequest(null); 
      setStatusMessage("Solicitação de assinatura rejeitada");
    }
  };

  if (!isWalletConnected) {
    return (
      <Box className="container">
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
          <Typography variant="h4" gutterBottom color="error">
            Carteira não conectada
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Por favor, conecte sua carteira para receber solicitações de assinatura em tempo real.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Debug info:</strong><br/>
            MetaMask: {metamaskCtx.metamaskAccountAddress || 'não conectado'}<br/>
            WalletConnect: {walletConnectCtx.accountId || 'não conectado'}<br/>
            Detected accountId: {accountId || 'nenhum'}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="container">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Assinatura em Tempo Real
        </Typography>
        
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Conectado como: <strong>{accountId}</strong> ({walletType})
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
          {isConnected ? (
            <>
              <SignalWifi1Bar color="success" sx={{ mr: 1 }} />
              <Typography color="success.main">Conectado ao servidor</Typography>
            </>
          ) : (
            <>
              <SignalWifiOff color="error" sx={{ mr: 1 }} />
              <Typography color="error.main">Desconectado</Typography>
            </>
          )}
        </Box>

        {currentRequest ? (
          <Card sx={{ mb: 3, border: '2px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">
                <PendingActions sx={{ mr: 1, verticalAlign: 'middle' }} />
                Solicitação de Assinatura Recebida
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Recebido em: {currentRequest.timestamp.toLocaleString()}
              </Typography>
              
              {walletType === 'WalletConnect' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>🔗 WalletConnect Detectado</strong><br/>
                    A mensagem será assinada usando o método nativo de assinatura do Hedera WalletConnect.
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                <strong>Mensagem para assinar:</strong>
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {currentRequest.message}
                </Typography>
              </Paper>

              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSignMessage}
                  disabled={isSigningInProgress}
                  startIcon={isSigningInProgress ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {isSigningInProgress ? 'Assinando...' : 
                   walletType === 'WalletConnect' ? 'Assinar via WalletConnect' : 'Assinar Mensagem'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRejectSignature}
                  disabled={isSigningInProgress}
                  startIcon={<ErrorIcon />}
                >
                  Rejeitar
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ mb: 3 }}> 
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aguardando solicitação de assinatura...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quando um hub solicitar verificação de acesso, a solicitação aparecerá aqui
                <span className="loading-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </Typography>
            </CardContent>
          </Card>
        )}

        {statusMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {statusMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {signatureHistory.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Histórico de Assinaturas
              </Typography>
              {signatureHistory.slice(-5).reverse().map((item, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {item.timestamp.toLocaleString()}
                    </Typography>
                    {item.status === 'completed' ? (
                      <CheckCircle color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {item.message.length > 50 ? `${item.message.substring(0, 50)}...` : item.message}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  );
}