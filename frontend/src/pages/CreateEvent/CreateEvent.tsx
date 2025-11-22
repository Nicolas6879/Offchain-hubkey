import React, { useState, useEffect } from "react";
import "./CreateEvent.css";
import { appConfig } from "../../config";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../contexts/AdminContext";
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Schedule as TimeIcon,
  People as PeopleIcon,
  Image as ImageIcon,
  Token as TokenIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const CreateEvent: React.FC = () => {
  const [eventName, setEventName] = useState("");
  const [location, setLocation] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [rewardTokenId, setRewardTokenId] = useState("");
  const [rewardAmount, setRewardAmount] = useState<number | "">("");
  const [previewImage, setPreviewImage] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  
  // Get authentication (supports both wallet and email/password)
  const { adminWallet } = useAdmin();
  const token = localStorage.getItem('token');
  const storedWalletAddress = localStorage.getItem('walletAddress');

  useEffect(() => {
    if (photoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(photoFile);
    } else {
      setPreviewImage("");
    }
  }, [photoFile]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setPhotoFile(file);
      } else {
        setMessage({ type: "error", text: "Por favor, selecione apenas arquivos de imagem." });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setPhotoFile(file);
      } else {
        setMessage({ type: "error", text: "Por favor, arraste apenas arquivos de imagem." });
      }
    }
  };

  const handleRemoveImage = () => {
    setPhotoFile(null);
    setPreviewImage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated (either via wallet or email/password)
    if (!token && !adminWallet) {
      setMessage({ type: "error", text: "Por favor, faça login primeiro." });
      return;
    }
    
    if (!eventName.trim()) {
      setMessage({ type: "error", text: "O nome do evento é obrigatório." });
      return;
    }

    if (!eventDate) {
      setMessage({ type: "error", text: "A data do evento é obrigatória." });
      return;
    }

    let photoData = "";
    if (photoFile) {
      photoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => reject("Erro ao ler a imagem.");
        reader.readAsDataURL(photoFile);
      });
    }

    const payload = {
      name: eventName.trim(),
      location: location.trim(),
      photo: photoData,
      description,
      maxParticipants: maxParticipants === "" ? null : maxParticipants,
      eventDate: eventDate,
      eventTime: eventTime || null,
      rewardTokenId: rewardTokenId.trim() || null,
      rewardAmount: rewardAmount === "" ? null : rewardAmount,
    };

    try {
      // Prepare headers - include both token and wallet address
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Use adminWallet if available, otherwise use stored wallet address
      const walletAddress = adminWallet || storedWalletAddress || '';
      if (walletAddress) {
        headers["wallet-address"] = walletAddress;
      }

      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/events`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao criar o evento.");
      }

      setMessage({ type: "success", text: "Evento criado com sucesso!" });
      setTimeout(() => {
        navigate("/event-list");
      }, 1500);
    } catch (error) {
      setMessage({ type: "error", text: (error as Error).message || "Erro desconhecido." });
    }
  };

  return (
    <div className="create-event-container">
      {/* Header */}
      <div className="create-event-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Criar Novo Evento</h1>
            <p className="page-subtitle">
              Preencha as informações abaixo para criar um novo evento na plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        <form onSubmit={handleSubmit} className="event-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h2 className="section-title">
              <EventIcon className="section-icon" />
              Informações Básicas
            </h2>

            <div className="form-group">
              <label htmlFor="eventName" className="form-label">
                <EventIcon className="label-icon" />
                Nome do Evento *
              </label>
              <input
                id="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="form-input"
                placeholder="Ex: Meetup Web3 Brasil"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventLocation" className="form-label">
                <LocationIcon className="label-icon" />
                Local do Evento *
              </label>
              <input
                id="eventLocation"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
                placeholder="Ex: São Paulo - SP"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                <DescriptionIcon className="label-icon" />
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder="Descreva o evento, objetivos, agenda, etc..."
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="form-section">
            <h2 className="section-title">
              <ImageIcon className="section-icon" />
              Imagem do Evento
            </h2>

            <div
              className={`dropzone ${isDragging ? 'dragging' : ''} ${previewImage ? 'has-image' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('photoFile')?.click()}
            >
              {previewImage ? (
                <div className="preview-container">
                  <img src={previewImage} alt="Preview" className="preview-image" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    title="Remover imagem"
                  >
                    <CloseIcon />
                  </button>
                </div>
              ) : (
                <div className="dropzone-content">
                  <ImageIcon className="dropzone-icon" />
                  <p className="dropzone-text">
                    Arraste uma imagem aqui ou clique para selecionar
                  </p>
                  <span className="dropzone-hint">PNG, JPG, GIF até 10MB</span>
                </div>
              )}
            </div>
            <input
              id="photoFile"
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="input-file-hidden"
            />
          </div>

          {/* Date & Capacity Section */}
          <div className="form-section">
            <h2 className="section-title">
              <CalendarIcon className="section-icon" />
              Data, Horário e Participantes
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="eventDate" className="form-label">
                  <CalendarIcon className="label-icon" />
                  Data do Evento *
                </label>
                <input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventTime" className="form-label">
                  <TimeIcon className="label-icon" />
                  Horário do Evento
                </label>
                <input
                  id="eventTime"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="maxParticipants" className="form-label">
                <PeopleIcon className="label-icon" />
                Número Máximo de Participantes
              </label>
              <input
                id="maxParticipants"
                type="number"
                min={1}
                value={maxParticipants}
                onChange={(e) => {
                  const val = e.target.value;
                  setMaxParticipants(val === "" ? "" : Number(val));
                }}
                className="form-input"
                placeholder="Deixe em branco para ilimitado"
              />
            </div>
          </div>

          {/* Rewards Section */}
          <div className="form-section">
            <h2 className="section-title">
              <TokenIcon className="section-icon" />
              Recompensas (Opcional)
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rewardTokenId" className="form-label">
                  <TokenIcon className="label-icon" />
                  Token ID da Recompensa
                </label>
                <input
                  id="rewardTokenId"
                  type="text"
                  value={rewardTokenId}
                  onChange={(e) => setRewardTokenId(e.target.value)}
                  placeholder="Ex: 0.0.123456"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rewardAmount" className="form-label">
                  Quantidade de Tokens
                </label>
                <input
                  id="rewardAmount"
                  type="number"
                  min={1}
                  value={rewardAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRewardAmount(val === "" ? "" : Number(val));
                  }}
                  placeholder="Quantidade a distribuir"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="submit-button">
              <AddIcon />
              Criar Evento
            </button>
          </div>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`message-container ${message.type}`}>
            <p className="message-text">{message.text}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEvent;
