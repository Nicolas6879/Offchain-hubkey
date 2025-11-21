import React, { useState, useEffect, useCallback, useContext } from "react";
import { useWalletInterface } from "../../services/wallets/useWalletInterface";
import { MetamaskContext } from "../../contexts/MetamaskContext";
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import { useNavigate } from "react-router-dom";
import { appConfig } from "../../config";
import { socketService } from "../../services/socketService"; // Certifique-se que socketService encapsula o socket.io client
import "./HubStatusPage.css";

interface HubAccessRequest {
  id: string;
  hub: {
    _id: string;
    name: string;
    cidade: string;
    estado: string;
    endereco: string;
    contactEmail?: string;
    contactPhone?: string;
    websiteUrl?: string;
  };
  status: 'pending' | 'verified' | 'accessed' | 'rejected';
  requestedAt: string;
  visitDate: string;
  lastAccessed?: string;
  verifiedAt?: string;
}

interface AccessStatusResponse {
  success: boolean;
  requests: HubAccessRequest[];
  message?: string;
}

const StatusIcons = {
  Schedule: () => <span className="icon">⏳</span>,
  CheckCircle: () => <span className="icon">✅</span>,
  VerifiedUser: () => <span className="icon">🔐</span>,
  Error: () => <span className="icon">❌</span>,
  LocationOn: () => <span className="icon">📍</span>,
  Email: () => <span className="icon">📧</span>,
  Phone: () => <span className="icon">📞</span>,
  Language: () => <span className="icon">🌐</span>,
  Refresh: () => <span className="icon">🔄</span>,
  SignalWifi: () => <span className="icon">📶</span>,
  SignalWifiOff: () => <span className="icon">📵</span>,
};

export default function HubStatusPage() {
  const { accountId } = useWalletInterface();
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [accessRequests, setAccessRequests] = useState<HubAccessRequest[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const walletType = metamaskCtx.metamaskAccountAddress ? 'MetaMask' : 
                     walletConnectCtx.accountId ? 'WalletConnect' : 'Unknown';
  const isWalletConnected = !!(metamaskCtx.metamaskAccountAddress || walletConnectCtx.accountId);

  console.log('HubStatus wallet detection:', {
    accountId,
    metamaskAddress: metamaskCtx.metamaskAccountAddress,
    walletConnectId: walletConnectCtx.accountId,
    walletConnectConnected: walletConnectCtx.isConnected,
    detectedType: walletType,
    isConnected: isWalletConnected
  });

  const fetchAccessStatus = useCallback(async () => {
    if (!isWalletConnected || !accountId) {
      setErrorMessage("Carteira não conectada");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${appConfig.networks.testnet.backendUrl}/api/hub-access/status/${accountId}`
      );
      const data: AccessStatusResponse = await response.json();

      if (response.ok && data.success) {
        setAccessRequests(data.requests);
        setErrorMessage("");

        // Manter esta parte para depuração, se necessário
        const verifiedRequest = data.requests.find(
          (request) => request.status === 'verified'
        );
        if (verifiedRequest) {
            console.log("Status 'verified' encontrado no backend:", verifiedRequest.id);
        }

      } else {
        setErrorMessage(data.message || "Erro ao buscar status do acesso");
        setAccessRequests([]);
      }
    } catch (error) {
      console.error('Error fetching access status:', error);
      setErrorMessage("Erro de conexão ao buscar status");
      setAccessRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdate(new Date());
    }
  }, [isWalletConnected, accountId]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  useEffect(() => {
    if (isWalletConnected && accountId) {
      console.log('HubStatus: Connecting to socket with wallet:', accountId, 'type:', walletType);
      
      socketService.connect();
      // O evento 'register' é usado para o cliente se registrar com sua carteira
      socketService.registerWallet(accountId); // Isso envia o evento 'register'

      socketService.onConnectionChange(handleConnectionChange);

      // --- AJUSTE AQUI: O evento que vem do backend é 'signature_needed' ---
      const handleSignatureNeeded = (data: { requestId: string, message: string, hubId: string }) => {
        console.log('🚨 Signature needed event received from backend:', data);
        // Usar localStorage para evitar múltiplos redirecionamentos para a mesma solicitação
        const processedRequestId = localStorage.getItem(`processed_signature_needed_${accountId}`);
        
        if (!processedRequestId || processedRequestId !== data.requestId) {
          console.log("Redirecionando para /realtime-signature porque a assinatura foi solicitada para esta requisição:", data.requestId);
          localStorage.setItem(`processed_signature_needed_${accountId}`, data.requestId);
          // Opcional: Você pode passar os dados para a página de assinatura via state ou localStorage
          // navigate('/realtime-signature', { state: { requestId: data.requestId, message: data.message, hubId: data.hubId } });
          navigate('/realtime-signature');
        } else {
          console.log("Evento 'signature_needed' para requisição já processada ou duplicada:", data.requestId);
        }
      };

      // --- EVENTOS EXISTENTES (mantidos ou ajustados) ---
      const handleSignatureConfirmed = () => {
        console.log('✅ Signature confirmed - refreshing access status');
        fetchAccessStatus(); 
      };

      const handleStatusChanged = (data: any) => {
        console.log('🔄 Hub access status changed:', data);
        // O backend emite 'hub_access_status_changed' com 'memberWallet'
        if (data.memberWallet && data.memberWallet.toLowerCase() === accountId.toLowerCase()) {
          console.log('Status change affects current user - refreshing');
          fetchAccessStatus(); 
        }
      };

      // REGISTRO DOS LISTENERS
      socketService.onSocketEvent('signature_needed', handleSignatureNeeded); // AJUSTADO!
      socketService.onSocketEvent('signature_confirmed', handleSignatureConfirmed);
      socketService.onSocketEvent('hub_access_status_changed', handleStatusChanged);

      return () => {
        socketService.offConnectionChange(handleConnectionChange);
        // DESREGISTRO DOS LISTENERS
        socketService.offSocketEvent('signature_needed', handleSignatureNeeded); // AJUSTADO!
        socketService.offSocketEvent('signature_confirmed', handleSignatureConfirmed);
        socketService.offSocketEvent('hub_access_status_changed', handleStatusChanged);
      };
    } else {
      console.log('HubStatus: Wallet not connected, not connecting to socket');
    }
  }, [isWalletConnected, accountId, walletType, handleConnectionChange, fetchAccessStatus, navigate]);

  // Initial load
  useEffect(() => {
    fetchAccessStatus();
  }, [fetchAccessStatus]);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAccessStatus();
  };

  const getStatusDisplay = (status: string) => { 
    switch (status) {
      case 'pending':
        return { 
          color: 'warning', 
          icon: <StatusIcons.Schedule />, 
          text: 'Aguardando Verificação',
          description: 'O hub ainda não processou sua solicitação. Aguarde o email de verificação.'
        };
      case 'verified':
        return { 
          color: 'info', 
          icon: <StatusIcons.VerifiedUser />, 
          text: 'Assinatura Verificada',
          description: 'Sua identidade foi verificada digitalmente. Aguarde aprovação final do hub.'
        };
      case 'accessed':
        return { 
          color: 'success', 
          icon: <StatusIcons.CheckCircle />, 
          text: '✅ Acesso Aprovado',
          description: 'Hub verificou sua identidade e aprovou o acesso! Você está autorizado a visitar.'
        };
      case 'rejected':
        return { 
          color: 'error', 
          icon: <StatusIcons.Error />, 
          text: 'Acesso Negado',
          description: 'Sua solicitação foi rejeitada pelo hub'
        };
      default:
        return { 
          color: 'info', 
          icon: <StatusIcons.Schedule />, 
          text: 'Status Desconhecido',
          description: 'Status não reconhecido'
        };
    }
  };

  if (!isWalletConnected) {
    return (
      <div className="container">
        <div className="wallet-not-connected">
          <h1 className="wallet-not-connected-title">Carteira não conectada</h1>
          <p className="wallet-not-connected-description">
            Por favor, conecte sua carteira para verificar o status de suas solicitações de acesso.
          </p>
          <div className="debug-info">
            <strong>Debug info:</strong><br/>
            MetaMask: {metamaskCtx.metamaskAccountAddress || 'não conectado'}<br/>
            WalletConnect: {walletConnectCtx.accountId || 'não conectado'}<br/>
            Detected accountId: {accountId || 'nenhum'}<br/>
            Wallet type: {walletType}
          </div>
          <button 
            className="primary-button"
            onClick={() => navigate('/hub-access-request')}
          >
            Fazer Nova Solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hub-status-container">
        <div className="hub-status-header">
          <h1 className="hub-status-title">Status do Acesso ao Hub</h1>
          <p className="hub-status-subtitle">
            Conectado como: <strong>{accountId}</strong>
          </p>
          
          <div className="connection-status">
            {isConnected ? (
              <>
                <StatusIcons.SignalWifi />
                <span>Atualizações em tempo real ativas</span>
              </>
            ) : (
              <>
                <StatusIcons.SignalWifiOff />
                <span>Desconectado - atualizações manuais apenas</span>
              </>
            )}
          </div>
        </div>

        <div className="hub-status-content">
          <div className="refresh-controls">
            <span className="last-update">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </span>
            <button
              className="refresh-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <StatusIcons.Refresh />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          {loading && (
            <div className="loading-skeleton">
              {[1, 2, 3].map((item) => (
                <div key={item} className="skeleton-card">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line subtitle"></div>
                  <div className="skeleton-line content"></div>
                </div>
              ))}
            </div>
          )}

          {!loading && accessRequests.length === 0 && !errorMessage && (
            <div className="empty-state">
              <h2 className="empty-state-title">Nenhuma solicitação de acesso encontrada</h2>
              <p className="empty-state-description">
                Você ainda não fez nenhuma solicitação de acesso para hubs.
              </p>
              <button 
                className="primary-button"
                onClick={() => navigate('/hub-access-request')}
              >
                Solicitar Acesso a Hub
              </button>
            </div>
          )}

          {!loading && accessRequests.map((request) => {
            const statusDisplay = getStatusDisplay(request.status);
            
            return (
              <div key={request.id} className="access-request-card">
                <div className="card-header">
                  <h2 className="hub-name">{request.hub.name}</h2>
                  <div className={`status-chip ${statusDisplay.color}`}>
                    {statusDisplay.icon}
                    {statusDisplay.text}
                  </div>
                </div>

                <p className="status-description">{statusDisplay.description}</p>

                <div className="hub-info-section">
                  <h3 className="section-title">Informações do Hub</h3>
                  <div className="hub-info-grid">
                    <div className="info-item">
                      <StatusIcons.LocationOn />
                      <span>{request.hub.endereco}, {request.hub.cidade}, {request.hub.estado}</span>
                    </div>
                    {request.hub.contactEmail && (
                      <div className="info-item">
                        <StatusIcons.Email />
                        <span>{request.hub.contactEmail}</span>
                      </div>
                    )}
                    {request.hub.contactPhone && (
                      <div className="info-item">
                        <StatusIcons.Phone />
                        <span>{request.hub.contactPhone}</span>
                      </div>
                    )}
                    {request.hub.websiteUrl && (
                      <div className="info-item">
                        <StatusIcons.Language />
                        <a 
                          href={request.hub.websiteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="info-link"
                        >
                          {request.hub.websiteUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="timeline-section">
                  <div className="timeline-grid">
                    <div className="timeline-item">
                      <span className="timeline-label">Solicitado em</span>
                      <div className="timeline-value">
                        {new Date(request.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-label">Data da Visita</span>
                      <div className="timeline-value">
                        {new Date(request.visitDate).toLocaleString()}
                      </div>
                    </div>
                    {request.verifiedAt && (
                      <div className="timeline-item">
                        <span className="timeline-label">Verificado em</span>
                        <div className="timeline-value">
                          {new Date(request.verifiedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {request.lastAccessed && (
                      <div className="timeline-item">
                        <span className="timeline-label">Último Acesso</span>
                        <div className="timeline-value">
                          {new Date(request.lastAccessed).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="action-alert info">
                    <div className="action-alert-title">Próximos passos:</div>
                    <div className="action-alert-content">
                      Aguarde o hub processar sua solicitação. 
                      Você receberá uma notificação quando a verificação de assinatura for solicitada.
                    </div>
                  </div>
                )}

                {request.status === 'verified' && (
                  <div className="action-alert info">
                    <div className="action-alert-title">Identidade verificada!</div>
                    <div className="action-alert-content">
                      Sua assinatura digital foi confirmada. 
                      Aguarde o hub processar a aprovação final.
                    </div>
                  </div>
                )}

                {request.status === 'accessed' && (
                  <div className="action-alert success">
                    <div className="action-alert-title">🎉 Acesso APROVADO!</div>
                    <div className="action-alert-content">
                      <p>
                        <strong>Parabéns!</strong> O hub verificou sua identidade Offchain 
                        e aprovou seu acesso. Você está autorizado a visitar.
                      </p>
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-surface-2)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div className="action-alert-title">📍 Instruções para a visita:</div>
                        <ul>
                          <li>Mantenha sua carteira conectada</li>
                          <li>Apresente-se na recepção</li>
                          <li>Mostre esta confirmação de acesso</li>
                          <li>Aproveite sua visita ao hub!</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!loading && accessRequests.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
              <button 
                className="primary-button"
                onClick={() => navigate('/hub-access-request')}
              >
                Solicitar Acesso a Outro Hub
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}