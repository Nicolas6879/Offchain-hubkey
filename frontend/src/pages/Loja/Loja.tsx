import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { appConfig } from "../../config";
import { MetamaskContext } from "../../contexts/MetamaskContext";
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import { 
  AccountBalanceWallet as WalletIcon,
  LocalOffer as PriceIcon,
  Inventory as StockIcon,
} from '@mui/icons-material';
import * as productService from "../../services/productService";
import "./Loja.css";

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

const Loja: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  // Get wallet address from multiple sources
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const storedWalletAddress = localStorage.getItem('walletAddress');
  const walletAddress = metamaskCtx.metamaskAccountAddress || walletConnectCtx.accountId || storedWalletAddress || '';

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
    fetchProducts();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, fetchBalance]);

  if (loading) {
    return <div className="loja-container"><p>Carregando produtos...</p></div>;
  }

  if (error) {
    return <div className="loja-container"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="loja-container">
      <div className="loja-header">
        <div className="loja-header-content">
          <h1>Loja Offchain</h1>
          {walletAddress && (
            <div className="balance-display">
              <WalletIcon />
              <span>Saldo: {tokenBalance} tokens</span>
            </div>
          )}
        </div>
      </div>

      {!walletAddress && (
        <div className="warning-message">
          <div>
            <p>⚠️ Conecte sua carteira para comprar produtos</p>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="no-products">
          <p>Nenhum produto disponível no momento.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              {product.image && (
                <div 
                  className="product-image" 
                  onClick={() => navigate(`/loja/${product._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <img 
                    src={getPhotoUrl(product.image)} 
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Imagem+Indisponível';
                    }}
                  />
                </div>
              )}
              <div className="product-info">
                <h3 
                  className="product-name"
                  onClick={() => navigate(`/loja/${product._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {product.name}
                </h3>
                {product.description && (
                  <p className="product-description">
                    {product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description}
                  </p>
                )}
                <div className="product-details">
                  <div className="detail-item">
                    <PriceIcon fontSize="small" />
                    <span>{product.price} tokens</span>
                  </div>
                  <div className="detail-item">
                    <StockIcon fontSize="small" />
                    <span>{product.available} disponíveis</span>
                  </div>
                </div>
                <div className="product-stats">
                  <span className="sold-count">{product.sold} vendidos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Loja;

