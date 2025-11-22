import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { appConfig } from "../../config";
import { MetamaskContext } from "../../contexts/MetamaskContext";
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import "./EditEvent.css";

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    location: "",
    maxParticipants: 0,
    eventDate: "",
    eventTime: "",
    rewardTokenId: "",
    rewardAmount: 0,
  });

  // Get admin wallet for authentication
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const adminWallet = metamaskCtx.metamaskAccountAddress || walletConnectCtx.accountId || '';

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events/${id}`);
        if (!response.ok) throw new Error("Erro ao buscar evento.");
        
        const data = await response.json();
        if (data.success && data.event) {
          const event = data.event;
          setEventData({
            name: event.name,
            description: event.description || "",
            location: event.location,
            maxParticipants: event.maxParticipants || 0,
            eventDate: event.eventDate ? event.eventDate.split('T')[0] : "",
            eventTime: event.eventTime || "",
            rewardTokenId: event.rewardTokenId || "",
            rewardAmount: event.rewardAmount || 0,
          });
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar evento");
        console.error("Erro ao buscar evento:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminWallet) {
      alert("Por favor, conecte sua carteira admin primeiro.");
      return;
    }
    
    try {
      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "wallet-address": adminWallet,
        },
        body: JSON.stringify({
          name: eventData.name,
          description: eventData.description,
          location: eventData.location,
          maxParticipants: eventData.maxParticipants || undefined,
          eventDate: eventData.eventDate || undefined,
          eventTime: eventData.eventTime || undefined,
          rewardTokenId: eventData.rewardTokenId || undefined,
          rewardAmount: eventData.rewardAmount || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao atualizar evento");
      }
      
      alert("Evento atualizado com sucesso!");
      navigate("/event-list");
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar evento");
      console.error("Erro ao atualizar evento:", err);
    }
  };
  
  if (loading) return <div className="container"><p>Carregando...</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;

  return (
    <div className="container">
      <div className="edit-event-box">
        <h1>Editar Evento</h1>
        <form className="edit-form" onSubmit={handleSubmit}>
          <label>Nome do Evento</label>
          <input
            type="text"
            value={eventData.name}
            onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
            required
          />

          <label>Local</label>
          <input
            type="text"
            value={eventData.location}
            onChange={(e) =>
              setEventData({ ...eventData, location: e.target.value })
            }
            required
          />

          <label>Descrição</label>
          <textarea
            value={eventData.description}
            onChange={(e) =>
              setEventData({ ...eventData, description: e.target.value })
            }
          />

          <label>Número Máximo de Participantes</label>
          <input
            type="number"
            min={1}
            value={eventData.maxParticipants || ""}
            onChange={(e) =>
              setEventData({ ...eventData, maxParticipants: e.target.value ? Number(e.target.value) : 0 })
            }
          />

          <label>Data do Evento</label>
          <input
            type="date"
            value={eventData.eventDate}
            onChange={(e) =>
              setEventData({ ...eventData, eventDate: e.target.value })
            }
          />

          <label>Horário do Evento</label>
          <input
            type="time"
            value={eventData.eventTime}
            onChange={(e) =>
              setEventData({ ...eventData, eventTime: e.target.value })
            }
          />

          <label>Token ID da Recompensa</label>
          <input
            type="text"
            value={eventData.rewardTokenId}
            onChange={(e) =>
              setEventData({ ...eventData, rewardTokenId: e.target.value })
            }
            placeholder="Ex: 0.0.123456"
          />

          <label>Quantidade de Tokens</label>
          <input
            type="number"
            min={1}
            value={eventData.rewardAmount || ""}
            onChange={(e) =>
              setEventData({ ...eventData, rewardAmount: e.target.value ? Number(e.target.value) : 0 })
            }
            placeholder="Quantidade de tokens a distribuir"
          />

          <button type="submit" className="botao_submit">
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
}