import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { appConfig } from "../../config";
import { MetamaskContext } from "../../contexts/MetamaskContext";
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import { 
  ShoppingCart as CartIcon,
  AccountBalanceWallet as WalletIcon,
  ArrowBack as BackIcon,
  LocalOffer as PriceIcon,
  Inventory as StockIcon,
} from '@mui/icons-material';
import * as productService from "../../services/productService";
import "./ProductDetail.css";

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

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasing, setPurchasing] = useState(false);
  
  // Get wallet address from multiple sources
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const storedWalletAddress = localStorage.getItem('walletAddress');
  const walletAddress = metamaskCtx.metamaskAccountAddress || walletConnectCtx.accountId || storedWalletAddress || '';

  // Helper function to construct photo URL
  const getPhotoUrl = (image?: string): string | undefined => {
    if (!image) return undefined;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    if (image.startsWith('/')) {
      return `${appConfig.networks.testnet.backendUrl}${image}`;
    }
    return `${appConfig.networks.testnet.backendUrl}/api/images/${image}`;
  };

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const productData = await productService.getProductById(id);
      setProduct(productData);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || "Erro ao carregar produto.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const balanceData = await productService.getUserBalance(walletAddress);
      setTokenBalance(balanceData.tokenBalance);
    } catch (err: any) {
      console.error('Error fetching balance:', err);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, fetchBalance]);

  const handlePurchase = async () => {
    if (!product || !walletAddress) return;

    const totalCost = product.price * quantity;
    if (tokenBalance < totalCost) {
      alert(`Saldo insuficiente. Você tem ${tokenBalance} tokens mas precisa de ${totalCost} tokens.`);
      return;
    }

    if (product.available < quantity) {
      alert(`Estoque insuficiente. Apenas ${product.available} itens disponíveis.`);
      return;
    }

    setPurchasing(true);
    try {
      const result = await productService.purchaseProduct(
        product._id,
        quantity,
        walletAddress
      );

      alert(`Compra realizada com sucesso! Novo saldo: ${result.newBalance} tokens`);
      setTokenBalance(result.newBalance);
      setQuantity(1);
      
      // Refresh product to get updated availability
      await fetchProduct();
    } catch (err: any) {
      console.error('Error purchasing product:', err);
      alert(err.message || "Erro ao realizar compra.");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <p className="loading-text">Carregando produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="error-container">
          <p className="error-message">{error || "Produto não encontrado"}</p>
          <button className="back-button" onClick={() => navigate('/loja')}>
            <BackIcon />
            Voltar para Loja
          </button>
        </div>
      </div>
    );
  }

  const totalCost = product.price * quantity;
  const canPurchase = walletAddress && product.available > 0 && tokenBalance >= totalCost;

  return (
    <div className="product-detail-container">
      {/* Header */}
      <div className="product-detail-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate('/loja')}>
            <BackIcon />
            Voltar para Loja
          </button>
          {walletAddress && (
            <div className="balance-display">
              <WalletIcon />
              <span>Saldo: {tokenBalance} tokens</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Content */}
      <div className="product-content">
        {/* Product Image */}
        <div className="product-image-section">
          {product.image ? (
            <img 
              src={getPhotoUrl(product.image)} 
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Imagem+Indisponível';
              }}
            />
          ) : (
            <div className="no-image-placeholder">
              <StockIcon style={{ fontSize: '5rem' }} />
              <p>Sem imagem disponível</p>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info-section">
          <h1 className="product-title">{product.name}</h1>
          
          {product.description && (
            <p className="product-description">{product.description}</p>
          )}

          <div className="product-stats">
            <div className="stat-item">
              <PriceIcon />
              <div>
                <span className="stat-label">Preço</span>
                <span className="stat-value">{product.price} tokens</span>
              </div>
            </div>
            <div className="stat-item">
              <StockIcon />
              <div>
                <span className="stat-label">Disponível</span>
                <span className="stat-value">{product.available} unidades</span>
              </div>
            </div>
            <div className="stat-item">
              <CartIcon />
              <div>
                <span className="stat-label">Vendidos</span>
                <span className="stat-value">{product.sold} unidades</span>
              </div>
            </div>
          </div>

          {!walletAddress && (
            <div className="warning-box">
              <p>⚠️ Conecte sua carteira para comprar este produto</p>
            </div>
          )}

          {walletAddress && product.available === 0 && (
            <div className="warning-box">
              <p>❌ Produto esgotado</p>
            </div>
          )}

          {walletAddress && product.available > 0 && (
            <div className="purchase-section">
              <div className="quantity-selector">
                <label>Quantidade:</label>
                <div className="quantity-controls">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    max={product.available}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.available, parseInt(e.target.value) || 1)))}
                  />
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.min(product.available, quantity + 1))}
                    disabled={quantity >= product.available}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="total-display">
                <span>Total:</span>
                <span className="total-value">{totalCost} tokens</span>
              </div>

              <button 
                className="buy-button"
                onClick={handlePurchase}
                disabled={!canPurchase || purchasing}
              >
                <CartIcon />
                {purchasing ? 'Processando...' : 'Comprar Agora'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

