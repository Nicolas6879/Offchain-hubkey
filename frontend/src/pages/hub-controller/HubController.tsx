import React, { useState, useEffect } from "react";
import { adminService, Hub as AdminHub, CreateHubRequest } from "../../services/adminService";
import { useAdminAccess } from "../../contexts/AdminContext";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Info as InfoIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import "./HubController.css";

interface Hub {
  _id: string;
  name: string;
  cidade: string;
  estado: string;
  endereco: string;
  telefone?: string;
  email: string;
}

export default function HubController() {
  const [hubs, setHubs] = useState<AdminHub[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<AdminHub | null>(null);
  const [formData, setFormData] = useState<CreateHubRequest>({
    name: "",
    cidade: "",
    estado: "",
    endereco: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
    websiteUrl: "",
    isActive: true,
    membershipRequired: true
  });
  
  const { adminWallet } = useAdminAccess();

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    if (!adminWallet) {
      setError("Acesso de administrador necessário.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await adminService.getAllHubs(adminWallet);
      if (response.success && response.hubs) {
        setHubs(response.hubs);
      } else {
        setError(response.message || "Erro ao buscar hubs.");
      }
    } catch (err) {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, isActive: boolean) => {
    if (!adminWallet) {
      alert("Acesso de administrador necessário.");
      return;
    }

    const action = isActive ? "desativar" : "reativar";
    const confirmed = window.confirm(`Tem certeza que deseja ${action} este hub?`);
    if (!confirmed) return;

    try {
      const response = await adminService.deleteHub(adminWallet, id, false);
      if (response.success) {
        await fetchHubs(); // Refresh the list
        alert(`Hub ${action === "desativar" ? "desativado" : "reativado"} com sucesso!`);
      } else {
        alert(response.message || "Erro ao realizar ação.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  };

  const handleEdit = (hub: AdminHub) => {
    setEditingHub(hub);
    setFormData({
      name: hub.name,
      cidade: hub.cidade,
      estado: hub.estado,
      endereco: hub.endereco,
      contactEmail: hub.contactEmail,
      contactPhone: hub.contactPhone || "",
      description: hub.description || "",
      websiteUrl: hub.websiteUrl || "",
      isActive: hub.isActive,
      membershipRequired: hub.membershipRequired
    });
    setIsEditModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      cidade: "",
      estado: "",
      endereco: "",
      contactEmail: "",
      contactPhone: "",
      description: "",
      websiteUrl: "",
      isActive: true,
      membershipRequired: true
    });
  };

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminWallet) {
      alert("Acesso de administrador necessário.");
      return;
    }

    try {
      const response = await adminService.createHub(adminWallet, formData);
      
      if (response.success && response.hub) {
        setHubs([...hubs, response.hub]);
        setIsAddModalOpen(false);
        resetForm();
        alert("Hub criado com sucesso!");
      } else {
        alert(response.message || "Erro ao adicionar.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  };

  const handleUpdateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminWallet || !editingHub) {
      alert("Acesso de administrador necessário.");
      return;
    }

    try {
      const response = await adminService.updateHub(adminWallet, editingHub.id, formData);
      
      if (response.success && response.hub) {
        setHubs(hubs.map(h => h.id === editingHub.id ? response.hub! : h));
        setIsEditModalOpen(false);
        setEditingHub(null);
        resetForm();
        alert("Hub atualizado com sucesso!");
      } else {
        alert(response.message || "Erro ao atualizar.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingHub(null);
    resetForm();
  };

  return (
    <div className="container">
      <div className="hubController">
        <div className="hubControllerHeader">
          <BusinessIcon className="pageIcon" />
          <h1 className="titulo">Controle de Hubs</h1>
          <p className="subtitle">Gerencie todos os hubs do sistema</p>
        </div>
        
        <div className="hubHeader">
          <button 
            className="botao_submit small addButton" 
            onClick={() => setIsAddModalOpen(true)}
          >
            <AddIcon className="buttonIcon" />
            Adicionar Hub
          </button>
          {error && <p className="error_message fullwidth">{error}</p>}
        </div>
        
        <div className="hubGrid">
          {loading && (
            <div className="loadingContainer">
              <p>Carregando hubs...</p>
            </div>
          )}
          {hubs.map((hub) => (
            <div key={hub.id} className="hubCard">
              <div className="hubCardHeader">
                <div className="hubNameSection">
                  <h2 className="hubName">{hub.name}</h2>
                  <div className="statusBadge">
                    {hub.isActive ? (
                      <span className="status active">
                        <ActiveIcon className="statusIcon" />
                        Ativo
                      </span>
                    ) : (
                      <span className="status inactive">
                        <InactiveIcon className="statusIcon" />
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
                <div className="hubActions">
                  <button
                    className="actionButton edit"
                    onClick={() => handleEdit(hub)}
                    title="Editar hub"
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="actionButton delete"
                    onClick={() => handleDelete(hub.id, hub.isActive)}
                    title={hub.isActive ? "Desativar hub" : "Reativar hub"}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
              
              <div className="hubInfo">
                <div className="infoItem">
                  <LocationIcon className="infoIcon" />
                  <span>{hub.cidade}, {hub.estado}</span>
                </div>
                <div className="infoItem">
                  <LocationIcon className="infoIcon" />
                  <span>{hub.endereco}</span>
                </div>
                {hub.contactPhone && (
                  <div className="infoItem">
                    <PhoneIcon className="infoIcon" />
                    <span>{hub.contactPhone}</span>
                  </div>
                )}
                <div className="infoItem">
                  <EmailIcon className="infoIcon" />
                  <span>{hub.contactEmail}</span>
                </div>
                {hub.websiteUrl && (
                  <div className="infoItem">
                    <WebsiteIcon className="infoIcon" />
                    <a href={hub.websiteUrl} target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                  </div>
                )}
                {hub.description && (
                  <div className="infoItem description">
                    <InfoIcon className="infoIcon" />
                    <span>{hub.description}</span>
                  </div>
                )}
                <div className="hubMeta">
                  <span className="membershipStatus">
                    {hub.membershipRequired ? "Membership Obrigatório" : "Membership Opcional"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Hub Modal */}
      {isAddModalOpen && (
        <div className="modalOverlay" onClick={closeModals}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <AddIcon className="modalIcon" />
              <h2 className="titulo">Novo Hub</h2>
            </div>
            <form onSubmit={handleAddHub} className="formModal">
              <input 
                type="text" 
                name="name" 
                placeholder="Nome do Hub" 
                required 
                value={formData.name} 
                onChange={handleFormChange} 
              />
              <div className="inputRow">
                <input 
                  type="text" 
                  name="cidade" 
                  placeholder="Cidade" 
                  required 
                  value={formData.cidade} 
                  onChange={handleFormChange} 
                />
                <input 
                  type="text" 
                  name="estado" 
                  placeholder="Estado" 
                  required 
                  value={formData.estado} 
                  onChange={handleFormChange} 
                />
              </div>
              <input 
                type="text" 
                name="endereco" 
                placeholder="Endereço" 
                required 
                value={formData.endereco} 
                onChange={handleFormChange} 
              />
              <div className="inputRow">
                <input 
                  type="text" 
                  name="contactPhone" 
                  placeholder="Telefone (opcional)" 
                  value={formData.contactPhone || ''} 
                  onChange={handleFormChange} 
                />
                <input 
                  type="email" 
                  name="contactEmail" 
                  placeholder="Email" 
                  required 
                  value={formData.contactEmail} 
                  onChange={handleFormChange} 
                />
              </div>
              <textarea 
                name="description" 
                placeholder="Descrição (opcional)" 
                value={formData.description || ''} 
                onChange={handleFormChange} 
                rows={3} 
              />
              <input 
                type="url" 
                name="websiteUrl" 
                placeholder="Site (opcional)" 
                value={formData.websiteUrl || ''} 
                onChange={handleFormChange} 
              />
              <div className="checkboxGroup">
                <label className="checkboxLabel">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    checked={formData.isActive} 
                    onChange={handleFormChange} 
                  />
                  <span>Hub Ativo</span>
                </label>
                <label className="checkboxLabel">
                  <input 
                    type="checkbox" 
                    name="membershipRequired" 
                    checked={formData.membershipRequired} 
                    onChange={handleFormChange} 
                  />
                  <span>Exigir Membership</span>
                </label>
              </div>
              <div className="modalActions">
                <button type="submit" className="botao_submit">Salvar Hub</button>
                <button type="button" className="botao_submit secondary" onClick={closeModals}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hub Modal */}
      {isEditModalOpen && editingHub && (
        <div className="modalOverlay" onClick={closeModals}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <EditIcon className="modalIcon" />
              <h2 className="titulo">Editar Hub</h2>
            </div>
            <form onSubmit={handleUpdateHub} className="formModal">
              <input 
                type="text" 
                name="name" 
                placeholder="Nome do Hub" 
                required 
                value={formData.name} 
                onChange={handleFormChange} 
              />
              <div className="inputRow">
                <input 
                  type="text" 
                  name="cidade" 
                  placeholder="Cidade" 
                  required 
                  value={formData.cidade} 
                  onChange={handleFormChange} 
                />
                <input 
                  type="text" 
                  name="estado" 
                  placeholder="Estado" 
                  required 
                  value={formData.estado} 
                  onChange={handleFormChange} 
                />
              </div>
              <input 
                type="text" 
                name="endereco" 
                placeholder="Endereço" 
                required 
                value={formData.endereco} 
                onChange={handleFormChange} 
              />
              <div className="inputRow">
                <input 
                  type="text" 
                  name="contactPhone" 
                  placeholder="Telefone (opcional)" 
                  value={formData.contactPhone || ''} 
                  onChange={handleFormChange} 
                />
                <input 
                  type="email" 
                  name="contactEmail" 
                  placeholder="Email" 
                  required 
                  value={formData.contactEmail} 
                  onChange={handleFormChange} 
                />
              </div>
              <textarea 
                name="description" 
                placeholder="Descrição (opcional)" 
                value={formData.description || ''} 
                onChange={handleFormChange} 
                rows={3} 
              />
              <input 
                type="url" 
                name="websiteUrl" 
                placeholder="Site (opcional)" 
                value={formData.websiteUrl || ''} 
                onChange={handleFormChange} 
              />
              <div className="checkboxGroup">
                <label className="checkboxLabel">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    checked={formData.isActive} 
                    onChange={handleFormChange} 
                  />
                  <span>Hub Ativo</span>
                </label>
                <label className="checkboxLabel">
                  <input 
                    type="checkbox" 
                    name="membershipRequired" 
                    checked={formData.membershipRequired} 
                    onChange={handleFormChange} 
                  />
                  <span>Exigir Membership</span>
                </label>
              </div>
              <div className="modalActions">
                <button type="submit" className="botao_submit">Atualizar Hub</button>
                <button type="button" className="botao_submit secondary" onClick={closeModals}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
