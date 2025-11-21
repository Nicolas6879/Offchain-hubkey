import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, Hub } from "../../services/adminService";
import { appConfig } from "../../config";
import { useWalletInterface } from "../../services/wallets/useWalletInterface";
import "./HubAccessRequestPage.css";

interface JoinRequest {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  walletAddress: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  nftTokenId?: string;
  nftSerialNumber?: number;
}

export default function HubAccessRequestPage() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHubId, setSelectedHubId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userJoinRequest, setUserJoinRequest] = useState<JoinRequest | null>(null);

  const navigate = useNavigate();
  const { accountId } = useWalletInterface();

  // Fetch user's join request data from backend
  useEffect(() => {
    const fetchUserJoinRequest = async () => {
      if (!accountId) {
        setErrorMessage("Por favor, conecte sua carteira primeiro.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request`);
        const data = await response.json();

        if (response.ok && data.success) {
          // Find request for current wallet
          const userRequest = data.joinRequests.find(
            (request: JoinRequest) => request.walletAddress === accountId
          );

          if (userRequest) {
            setUserJoinRequest(userRequest);
          } else {
            setErrorMessage("Nenhuma solicitação de adesão encontrada para esta carteira. Complete o processo de join request primeiro.");
          }
        } else {
          setErrorMessage("Erro ao buscar dados do usuário.");
        }
      } catch (error) {
        console.error('Error fetching user join request:', error);
        setErrorMessage('Erro de conexão ao buscar dados do usuário.');
      }
    };

    fetchUserJoinRequest();
  }, [accountId]);

  // Fetch hubs from backend using admin service
  useEffect(() => {
    const fetchHubs = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        
        const response = await adminService.getActiveHubs();
        
        if (response.success && response.hubs) {
          setHubs(response.hubs);
        } else {
          setErrorMessage(response.message || 'Failed to load hubs');
        }
      } catch (error) {
        console.error('Error fetching hubs:', error);
        setErrorMessage('Unable to load hubs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHubs();
  }, []);

  const handleStatusCheck = async () => {
    if (!selectedHubId) return;

    if (!userJoinRequest) {
      setErrorMessage("Dados do usuário não encontrados. Complete o processo de join request primeiro.");
      return;
    }

    if (!accountId) {
      setErrorMessage("Por favor, conecte sua carteira primeiro.");
      return;
    }

    // Validate that user has NFT token ID
    if (!userJoinRequest.nftTokenId) {
      setErrorMessage("NFT não encontrado. Você precisa ter um NFT aprovado para solicitar acesso ao hub. Entre em contato com o suporte.");
      return;
    }

    // Prepare the payload with proper NFT token ID
    const tokenId = userJoinRequest.nftSerialNumber 
      ? `${userJoinRequest.nftTokenId}:${userJoinRequest.nftSerialNumber}`
      : userJoinRequest.nftTokenId;

    const payload = {
      walletAddress: accountId,
      email: userJoinRequest.email,
      name: userJoinRequest.fullName,
      tokenId: tokenId,
      hubId: selectedHubId,
      visitDate: new Date().toISOString(),
    };

    // Validate all required fields before sending
    const missingFields = [];
    if (!payload.walletAddress) missingFields.push("walletAddress");
    if (!payload.email) missingFields.push("email");
    if (!payload.name) missingFields.push("name");
    if (!payload.tokenId) missingFields.push("tokenId");
    if (!payload.hubId) missingFields.push("hubId");

    if (missingFields.length > 0) {
      setErrorMessage(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`);
      return;
    }

    try {
      console.log("Sending hub access request with payload:", payload);
      
      const res = await fetch(`${appConfig.networks.testnet.backendUrl}/api/hub-access/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMessage("Solicitação enviada com sucesso!");
        // Save selected hub data for status page
        const selectedHubData = hubs.find(hub => hub.id === selectedHubId);
        if (selectedHubData) {
          localStorage.setItem("selectedHub", selectedHubId);
          localStorage.setItem("selectedHubName", selectedHubData.name);
        }
        navigate("/hub-access-status");
      } else {
        setErrorMessage(result.message || "Erro ao solicitar acesso");
      }
    } catch (err) {
      setErrorMessage("Erro de conexão ao enviar solicitação");
      console.error("Error sending hub access request:", err);
    }
  };

  if (loading) {
    return (
      <div className="new-container">
        <div className="new-status-check">
          <h1 className="new-titulo-status">Carregando...</h1>
          <p>Buscando hubs disponíveis e dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="new-container">
        <div className="new-status-check">
          <h1 className="new-titulo-status">Carteira não conectada</h1>
          <p>Por favor, conecte sua carteira para continuar.</p>
        </div>
      </div>
    );
  }

  if (!userJoinRequest) {
    return (
      <div className="new-container">
        <div className="new-status-check">
          <h1 className="new-titulo-status">Dados do usuário não encontrados</h1>
          <p>Nenhuma solicitação de adesão encontrada para esta carteira.</p>
          <p>Complete o processo de join request primeiro.</p>
          <button 
            className="new-botao-access"
            onClick={() => navigate('/join-request')}
          >
            Ir para Join Request
          </button>
        </div>
      </div>
    );
  }

  if (userJoinRequest.status !== 'approved') {
    return (
      <div className="new-container">
        <div className="new-status-check">
          <h1 className="new-titulo-status">Solicitação não aprovada</h1>
          <p>Sua solicitação de adesão está com status: <strong>{userJoinRequest.status}</strong></p>
          <p>Apenas membros aprovados podem solicitar acesso a hubs.</p>
          <button 
            className="new-botao-access"
            onClick={() => navigate('/join-request')}
          >
            Ver Status da Solicitação
          </button>
        </div>
      </div>
    );
  }

  // Check if user has NFT token
  if (!userJoinRequest.nftTokenId) {
    return (
      <div className="new-container">
        <div className="new-status-check">
          <h1 className="new-titulo-status">NFT não encontrado</h1>
          <p>Sua solicitação foi aprovada, mas você ainda não possui um NFT associado.</p>
          <p>Entre em contato com o suporte para obter seu NFT de membro.</p>
          <div className="user-info">
            <p><strong>Usuário:</strong> {userJoinRequest.fullName}</p>
            <p><strong>Email:</strong> {userJoinRequest.email}</p>
            <p><strong>Status:</strong> {userJoinRequest.status}</p>
            <p><strong>NFT Token ID:</strong> {userJoinRequest.nftTokenId || "Não disponível"}</p>
            <p><strong>NFT Serial:</strong> {userJoinRequest.nftSerialNumber || "Não disponível"}</p>
          </div>
          <button 
            className="new-botao-access"
            onClick={() => navigate('/join-request')}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="new-container">
      <div className="new-status-check">
        <h1 className="new-titulo-status">Solicitação de Acesso a Hub</h1>
        <div className="user-info">
          <p><strong>Usuário:</strong> {userJoinRequest.fullName}</p>
          <p><strong>Email:</strong> {userJoinRequest.email}</p>
          <p><strong>Wallet:</strong> {accountId}</p>
          <p><strong>NFT Token:</strong> {userJoinRequest.nftTokenId}:{userJoinRequest.nftSerialNumber}</p>
        </div>

        {errorMessage && (
          <div className="new-error">
            {errorMessage}
          </div>
        )}

        {hubs.length === 0 ? (
          <div className="no-hubs-message">
            <p>Nenhum hub disponível no momento.</p>
            <button 
              className="new-botao-access"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            <select
              className="new-select-local"
              value={selectedHubId}
              onChange={(e) => {
                const selected = e.target.value;
                setSelectedHubId(selected);
                localStorage.setItem("selectedHub", selected);
              }}
            >
              <option value="" disabled hidden>
                Selecione o Hub
              </option>
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>

            {selectedHubId && (
              <div className="hub-details">
                {(() => {
                  const hub = hubs.find(h => h.id === selectedHubId);
                  return hub ? (
                    <div className="hub-info">
                      <h3>{hub.name}</h3>
                      <div className="hub-info-grid">
                        <div className="info-item">
                          <strong>Endereço:</strong> {hub.endereco}
                        </div>
                        <div className="info-item">
                          <strong>Cidade:</strong> {hub.cidade}, {hub.estado}
                        </div>
                        {hub.contactPhone && (
                          <div className="info-item">
                            <strong>Telefone:</strong> {hub.contactPhone}
                          </div>
                        )}
                        <div className="info-item">
                          <strong>Email:</strong> {hub.contactEmail}
                        </div>
                        {hub.description && (
                          <div className="info-item description">
                            <strong>Descrição:</strong> {hub.description}
                          </div>
                        )}
                        {hub.websiteUrl && (
                          <div className="info-item">
                            <strong>Website:</strong> 
                            <a href={hub.websiteUrl} target="_blank" rel="noopener noreferrer">
                              {hub.websiteUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <button
              className="new-botao-access"
              onClick={handleStatusCheck}
              disabled={!selectedHubId}
            >
              Solicitar Acesso
            </button>
          </>
        )}

        {statusMessage && <p className="new-success">{statusMessage}</p>}
      </div>
    </div>
  );
}