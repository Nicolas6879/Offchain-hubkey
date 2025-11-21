import React, { useState, useEffect } from "react";
import "./JoinRequestPage.css";
import { useNavigate } from "react-router-dom";
import { useWalletInterface } from "../../services/wallets/useWalletInterface";
import hederaMirrorNodeService from "../../services/hederaMirrorNodeService";
import { appConfig } from "../../config";

interface JoinRequest {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  walletAddress: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface NFTClaimStatus {
  hasNFT: boolean;
  nftClaimed: boolean;
  nftTokenId?: string;
  nftSerialNumber?: number;
  claimedAt?: string;
  canClaim: boolean;
}

interface TokenAssociationStatus {
  isAssociated: boolean;
  isChecking: boolean;
  error?: string;
}

export default function JoinRequestPage() {
  const [fullName, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [requestData, setRequestData] = useState<JoinRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [nftClaimStatus, setNftClaimStatus] = useState<NFTClaimStatus | null>(null);
  const [claimingNFT, setClaimingNFT] = useState(false);
  const [nftMessage, setNftMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);
  const [tokenAssociation, setTokenAssociation] = useState<TokenAssociationStatus>({
    isAssociated: false,
    isChecking: false
  });
  const navigate = useNavigate();
  const { accountId } = useWalletInterface();

  // Check token association status with the member NFT collection
  const checkTokenAssociation = async (userAccountId: string) => {
    setTokenAssociation(prev => ({ ...prev, isChecking: true, error: undefined }));
    
    try {
      const isAssociated = await hederaMirrorNodeService.isTokenAssociated(userAccountId, nftClaimStatus?.nftTokenId || '');
      setTokenAssociation({
        isAssociated,
        isChecking: false
      });
      
      console.log(`Token association status for ${userAccountId}: ${isAssociated}`);
      return isAssociated;
    } catch (error) {
      console.error('Error checking token association:', error);
      setTokenAssociation({
        isAssociated: false,
        isChecking: false,
        error: 'Failed to check token association'
      });
      return false;
    }
  };

  // Set wallet address from logged wallet
  useEffect(() => {
    if (accountId) {
      setWalletAddress(accountId);
    }
  }, [accountId]);

  // Fetch join requests and check if user already submitted
  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!accountId) {
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
            setIsSubmitted(true);
            setRequestId(userRequest._id);
            setRequestData(userRequest);
            // Save to localStorage
            localStorage.setItem(`join-request-${accountId}`, userRequest._id);
          } else {
            // Clear localStorage if no request found in DB
            localStorage.removeItem(`join-request-${accountId}`);
            setIsSubmitted(false);
            setRequestData(null);
          }
        }
      } catch (error) {
        console.error("Error fetching join requests:", error);
        // Fallback to localStorage check
        const savedRequestId = localStorage.getItem(`join-request-${accountId}`);
        if (savedRequestId) {
          setIsSubmitted(true);
          setRequestId(savedRequestId);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJoinRequests();
  }, [accountId]);

  // Check NFT claim status for approved users
  useEffect(() => {
    const checkNFTStatus = async () => {
      if (!accountId || !requestData || requestData.status !== 'approved') {
        return;
      }

      try {
        const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request/nft-status/${accountId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setNftClaimStatus(data);
          
          // If user has an NFT that can be claimed, check token association
          if (data.hasNFT && !data.nftClaimed && data.canClaim) {
            await checkTokenAssociation(accountId);
          }
        }
      } catch (error) {
        console.error("Error checking NFT status:", error);
      }
    };

    checkNFTStatus();
  }, [accountId, requestData]);

  const handleSubmit = async () => {
    if (!fullName || !phone || !email || !walletAddress) {
      setErrorMessage("Por favor, preencha todos os campos.");
      setStatusMessage("");
      return;
    }

    setErrorMessage("");

    const formData = {
      fullName,
      phone,
      email,
      walletAddress,
    };

    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatusMessage("Solicitação enviada com sucesso!");
        setIsSubmitted(true);
        setRequestId(data.requestId);
        // Save to localStorage to persist the submission state
        localStorage.setItem(`join-request-${accountId}`, data.requestId);
        console.log("Resposta do backend:", data, formData);
      } else {
        setErrorMessage(data.message || "Erro ao enviar a solicitação.");
        setStatusMessage("");
        console.error("Falha no backend:", data);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      setErrorMessage("Erro de conexão com o servidor.");
      setStatusMessage("");

      console.log("Enviando para o backend:", formData);

    }
  };

  const handleNewRequest = () => {
    setIsSubmitted(false);
    setRequestId("");
    setStatusMessage("");
    setErrorMessage("");
    setName("");
    setPhone("");
    setEmail("");
    if (accountId) {
      localStorage.removeItem(`join-request-${accountId}`);
    }
  };

  const handleClaimNFT = async () => {
    if (!accountId) {
      setNftMessage({type: 'error', text: 'Wallet não conectada'});
      return;
    }

    // Check token association first
    const isAssociated = await checkTokenAssociation(accountId);
    if (!isAssociated) {
      setNftMessage({
        type: 'warning', 
        text: `Você precisa associar o token ${nftClaimStatus?.nftTokenId || ''} à sua carteira antes de reivindicar o NFT. Use sua carteira Hashpack para associar o token.`
      });
      return;
    }

    const confirmed = window.confirm(
      'Deseja reivindicar sua chave NFT de membro?\n\nEsta ação irá transferir o NFT para sua carteira.'
    );
    
    if (!confirmed) return;

    setClaimingNFT(true);
    setNftMessage(null);

    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/join-request/claim-nft/${accountId}`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setNftMessage({type: 'success', text: 'NFT transferido com sucesso para sua carteira!'});
        // Update NFT claim status
        setNftClaimStatus(prev => prev ? ({
          ...prev,
          nftClaimed: true,
          canClaim: false
        }) : null);
      } else {
        console.error("Erro ao reivindicar NFT:", data);
        
        // Check if error is related to token association
        if (data.message && data.message.includes('TOKEN_NOT_ASSOCIATED')) {
          setNftMessage({
            type: 'warning', 
            text: `Token não associado. Associe o token ${nftClaimStatus?.nftTokenId || ''} à sua carteira Hashpack primeiro.`
          });
        } else {
          setNftMessage({type: 'error', text: data.message || 'Erro ao reivindicar NFT'});
        }
      }
    } catch (error) {
      console.error("Erro ao reivindicar NFT:", error);
      setNftMessage({type: 'error', text: 'Erro de conexão ao reivindicar NFT'});
    } finally {
      setClaimingNFT(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container">
        <div className="loginRequest">
          <div className="loading-spinner">Carregando...</div>
        </div>
      </div>
    );
  }

  // Show review status UI if already submitted
  if (isSubmitted && requestData) {
    const statusText = requestData.status === 'pending' ? 'Em análise' : 
                      requestData.status === 'approved' ? 'Aprovado' : 
                      requestData.status === 'rejected' ? 'Rejeitado' : requestData.status;
    
    const statusEmoji = requestData.status === 'pending' ? '🔍' : 
                        requestData.status === 'approved' ? '✅' : 
                        requestData.status === 'rejected' ? '❌' : '📋';

    const nextStep = requestData.status === 'pending' ? 'Você receberá uma chave NFT quando aprovado' :
                     requestData.status === 'approved' ? 'Sua chave NFT foi enviada!' :
                     requestData.status === 'rejected' ? 'Você pode enviar uma nova solicitação' :
                     'Entre em contato com os administradores';

    return (
      <div className="container">
        <div className="loginRequest review-status">
          <div className="review-header">
            <h1 className="titulo">
              {requestData.status === 'approved' ? 'Parabéns! Aprovado!' : 
               requestData.status === 'rejected' ? 'Solicitação Rejeitada' : 
               'Solicitação Enviada!'}
            </h1>
            <p className="review-message">
              {requestData.status === 'pending' ? 'Sua solicitação está sendo analisada pelos administradores.' :
               requestData.status === 'approved' ? 'Sua solicitação foi aprovada! Bem-vindo ao Offchain.' :
               requestData.status === 'rejected' ? 'Sua solicitação foi rejeitada. Você pode tentar novamente.' :
               'Status da sua solicitação foi atualizado.'}
            </p>
          </div>

          <div className="request-info">
            <div className="info-section">
              <h3>Detalhes da Solicitação</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Nome:</span>
                  <span className="info-value">{requestData.fullName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{requestData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Telefone:</span>
                  <span className="info-value">{requestData.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Carteira:</span>
                  <span className="info-value wallet-address">{requestData.walletAddress}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">ID da Solicitação:</span>
                  <span className="info-value">{requestData._id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Data de Envio:</span>
                  <span className="info-value">{new Date(requestData.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {/* NFT Section for Approved Users */}
            {requestData.status === 'approved' && nftClaimStatus && (
              <div className="info-section">
                <h3>Chave NFT de Membro</h3>
                
                {nftMessage && (
                  <div className={`message ${nftMessage.type}`}>
                    {nftMessage.text}
                    <button 
                      className="message-close"
                      onClick={() => setNftMessage(null)}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {nftClaimStatus.hasNFT ? (
                  nftClaimStatus.nftClaimed ? (
                    <div className="nft-info">
                      <div className="nft-status">
                        <span className="status-text success">NFT Reivindicado</span>
                      </div>
                      <div className="info-list">
                        {nftClaimStatus.nftTokenId && (
                          <div className="info-item">
                            <span className="info-label">Token ID:</span>
                            <span className="info-value">{nftClaimStatus.nftTokenId}</span>
                          </div>
                        )}
                        {nftClaimStatus.nftSerialNumber && (
                          <div className="info-item">
                            <span className="info-label">Serial Number:</span>
                            <span className="info-value">{nftClaimStatus.nftSerialNumber}</span>
                          </div>
                        )}
                        {nftClaimStatus.claimedAt && (
                          <div className="info-item">
                            <span className="info-label">Data da Reivindicação:</span>
                            <span className="info-value">{new Date(nftClaimStatus.claimedAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="nft-info">
                      <div className="nft-status">
                        <span className="status-text ready">NFT Disponível para Reivindicação</span>
                      </div>
                      <div className="info-list">
                        {nftClaimStatus.nftTokenId && (
                          <div className="info-item">
                            <span className="info-label">Token ID:</span>
                            <span className="info-value">{nftClaimStatus.nftTokenId}</span>
                          </div>
                        )}
                        {nftClaimStatus.nftSerialNumber && (
                          <div className="info-item">
                            <span className="info-label">Serial Number:</span>
                            <span className="info-value">{nftClaimStatus.nftSerialNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Token Association Status */}
                      <div className="association-status">
                        {tokenAssociation.isChecking ? (
                          <div className="status-checking">
                            <span>Verificando associação do token...</span>
                          </div>
                        ) : tokenAssociation.error ? (
                          <div className="status-error">
                            <div className="status-content">
                              <strong>Erro ao verificar associação do token</strong>
                              <p>{tokenAssociation.error}</p>
                            </div>
                            <button 
                              className="botao_submit small" 
                              onClick={() => checkTokenAssociation(accountId!)}
                            >
                              Tentar Novamente
                            </button>
                          </div>
                        ) : !tokenAssociation.isAssociated ? (
                          <div className="status-association-needed">
                            <div className="status-content">
                              <strong>Associação de Token Necessária</strong>
                              <p>Antes de reivindicar seu NFT, você precisa associar o token à sua carteira:</p>
                            </div>
                            
                            <div className="association-instructions">
                              <h5>Como associar no Hashpack:</h5>
                              <ol>
                                <li>Abra sua carteira <strong>Hashpack</strong></li>
                                <li>Vá para a seção de <strong>"Tokens"</strong></li>
                                <li>Clique em <strong>"Associate Token"</strong></li>
                                <li>Digite o Token ID: <code>{nftClaimStatus.nftTokenId}</code></li>
                                <li>Confirme a associação</li>
                              </ol>
                            </div>
                            
                            <button 
                              className="botao_submit secondary" 
                              onClick={() => checkTokenAssociation(accountId!)}
                            >
                              Verificar Associação
                            </button>
                          </div>
                        ) : (
                          <div className="status-ready-to-claim">
                            <div className="status-content">
                              <strong>Token associado com sucesso!</strong>
                              <p>Agora você pode reivindicar sua chave NFT.</p>
                            </div>
                            <button 
                              className="botao_submit nft-claim-button" 
                              onClick={handleClaimNFT}
                              disabled={claimingNFT}
                            >
                              {claimingNFT ? 'Transferindo...' : 'Reivindicar Minha Chave NFT'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="nft-info">
                    <div className="nft-status">
                      <span className="status-text pending">NFT sendo preparado...</span>
                    </div>
                    <p>Sua chave NFT está sendo gerada. Isso pode levar alguns minutos.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {(requestData.status === 'rejected' || requestData.status === 'pending') && (
            <div className="action-section">  
              <div className="action-content">
                <p className="action-text">
                  {requestData.status === 'rejected' ? 'Envie uma nova solicitação para tentar novamente' : 'Você pode cancelar e reenviar sua solicitação'}
                </p>
                <button 
                  className="botao_submit main-action"
                  onClick={handleNewRequest}
                >
                  {requestData.status === 'rejected' ? 'Nova Solicitação' : 'Cancelar e Reenviar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="loginRequest">
        <div className="form-header">
          <h1 className="titulo">Seja Membro Offchain</h1>
          <p className="explanation">
            Os administradores irão analisar sua solicitação. Quando aprovado, você receberá uma chave NFT como membro.
          </p>
        </div>
        
        <div className="form-content">
          <div className="input-group">
            <label>Nome Completo</label>
            <input
              type="text"
              placeholder="Digite seu nome completo"
              value={fullName}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>Telefone</label>
            <input
              type="text"
              placeholder="Digite seu telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>Endereço da Carteira</label>
            <input
              type="text"
              placeholder="Wallet Address"
              value={walletAddress}
              readOnly
              style={{ backgroundColor: 'var(--bg-surface-2)', cursor: 'not-allowed' }}
            />
          </div>

          {/* Exibe mensagem de erro */}
          {errorMessage && <p className="error_message">{errorMessage}</p>}

          <button
            className="botao_submit"
            onClick={handleSubmit}
          >
            ENVIAR
          </button>

          {/* Exibe status de sucesso */}
          {statusMessage && <p className="texto_status">{statusMessage}</p>}
        </div>
      </div>
    </div>
  );
}
