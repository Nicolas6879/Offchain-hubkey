import React, { useEffect, useState } from "react";
import { appConfig } from "../../config";
import { useAdmin } from "../../contexts/AdminContext";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import * as productService from "../../services/productService";
import "./ManageProducts.css";

interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  images?: string[]; // Array of up to 3 images
  price: number;
  available: number;
  sold: number;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ManageProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    available: 0,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  
  // Get admin authentication
  const { adminWallet } = useAdmin();
  const token = localStorage.getItem('token');
  const storedWalletAddress = localStorage.getItem('walletAddress');

  // Helper function to construct photo URL
  const getPhotoUrl = (image?: string): string | undefined => {
    if (!image) return undefined;
    // If it's already a full URL, return as-is
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    // If it starts with /, prepend backend URL
    if (image.startsWith('/')) {
      return `${appConfig.networks.testnet.backendUrl}${image}`;
    }
    // Otherwise, prepend backend URL with /api/images/ prefix
    return `${appConfig.networks.testnet.backendUrl}/api/images/${image}`;
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const productsData = await productService.getAllProducts();
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || "Erro ao carregar produtos.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleDelete = async (id: string) => {
    const walletAddress = adminWallet || storedWalletAddress || '';
    
    if (!token && !walletAddress) {
      alert("Por favor, faça login como admin primeiro.");
      return;
    }

    const confirmDelete = window.confirm("Tem certeza que deseja excluir este produto?");
    if (!confirmDelete) return;

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      if (walletAddress) {
        headers["wallet-address"] = walletAddress;
      }

      const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/admin/products/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao excluir o produto.");
      }

      alert("Produto excluído com sucesso!");
      fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(err.message || "Erro ao excluir o produto.");
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        available: product.available,
      });
      if (product.image) {
        setPreviewImage(getPhotoUrl(product.image) || '');
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        available: 0,
      });
      setPreviewImage('');
    }
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      available: 0,
    });
    setPhotoFile(null);
    setPreviewImage('');
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setPhotoFile(file);
      } else {
        alert("Por favor, selecione apenas arquivos de imagem.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const walletAddress = adminWallet || storedWalletAddress || '';
    
    if (!token && !walletAddress) {
      alert("Por favor, faça login como admin primeiro.");
      return;
    }

    if (!formData.name.trim()) {
      alert("O nome do produto é obrigatório.");
      return;
    }

    if (formData.price < 0) {
      alert("O preço deve ser maior ou igual a zero.");
      return;
    }

    if (formData.available < 0) {
      alert("A quantidade disponível deve ser maior ou igual a zero.");
      return;
    }

    setSaving(true);

    try {
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

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        available: Number(formData.available),
      };

      if (photoData) {
        payload.image = photoData;
      }

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      if (walletAddress) {
        headers["wallet-address"] = walletAddress;
      }

      const url = editingProduct 
        ? `${appConfig.networks.testnet.backendUrl}/api/admin/products/${editingProduct._id}`
        : `${appConfig.networks.testnet.backendUrl}/api/admin/products`;
      
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao ${editingProduct ? 'atualizar' : 'criar'} o produto.`);
      }

      alert(`Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!`);
      handleCloseModal();
      fetchProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert(err.message || `Erro ao ${editingProduct ? 'atualizar' : 'criar'} o produto.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="manage-products-container"><p>Carregando produtos...</p></div>;
  }

  if (error) {
    return <div className="manage-products-container"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="manage-products-container">
      <div className="manage-products-header">
        <div className="manage-products-header-content">
          <h1>Gerenciar Produtos</h1>
          <button className="add-button" onClick={() => handleOpenModal()}>
            <AddIcon />
            Novo Produto
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="no-products">
          <p>Nenhum produto cadastrado. Clique em "Novo Produto" para começar.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Preço</th>
                <th>Disponível</th>
                <th>Vendidos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    {product.image ? (
                      <img 
                        src={getPhotoUrl(product.image)} 
                        alt={product.name}
                        className="product-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=?';
                        }}
                      />
                    ) : (
                      <div className="no-image">Sem imagem</div>
                    )}
                  </td>
                  <td>
                    <div className="product-name-cell">
                      <strong>{product.name}</strong>
                      {product.description && (
                        <small>
                          {product.description.length > 80 
                            ? `${product.description.substring(0, 80)}...` 
                            : product.description}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="price-badge">{product.price} tokens</span>
                  </td>
                  <td>
                    <span className="stock-badge">{product.available}</span>
                  </td>
                  <td>
                    <span className="sold-badge">{product.sold}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="edit-button"
                      onClick={() => handleOpenModal(product)}
                      title="Editar"
                    >
                      <EditIcon />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(product._id)}
                      title="Excluir"
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nome do Produto *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Camiseta Offchain"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o produto..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Preço (tokens) *</label>
                  <input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="available">Quantidade Disponível *</label>
                  <input
                    type="number"
                    id="available"
                    value={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: Number(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image">Imagem do Produto</label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                />
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-button"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="submit-button"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;

