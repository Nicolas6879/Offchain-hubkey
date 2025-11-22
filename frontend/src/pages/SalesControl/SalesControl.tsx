import React, { useState, useEffect, useCallback } from 'react';
import './SalesControl.css';
import { useWalletAddress } from '../../hooks/useWalletAddress';
import {
  FileDownload as ExportIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  FilterList as FilterIcon,
  ClearAll as ClearIcon,
  ShoppingCart as SalesIcon,
} from '@mui/icons-material';
import {
  getAllSales,
  updateDeliveryStatus,
  exportSalesToCSV,
  SalesPurchase,
  SalesFilters,
  SalesSummary,
  ProductStats,
  Pagination,
} from '../../services/salesService';

const SalesControl: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesPurchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalRevenue: 0,
    totalProductsSold: 0,
  });
  const [productStats, setProductStats] = useState<ProductStats[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
  });
  const [filters, setFilters] = useState<SalesFilters>({
    page: 1,
    limit: 50,
  });
  const [updatingDelivery, setUpdatingDelivery] = useState<string | null>(null);

  // Use useWalletAddress instead of useWalletInterface to support both custodial and non-custodial wallets
  const walletAddress = useWalletAddress();

  // Fetch sales data
  const fetchSales = useCallback(async () => {
    if (!walletAddress) {
      setError('Wallet não conectada');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await getAllSales(filters, walletAddress);

      setSalesData(response.purchases);
      setSummary(response.summary);
      setProductStats(response.productStats);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError(err.message || 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Handle delivery status update
  const handleMarkAsDelivered = async (purchaseId: string) => {
    if (!walletAddress) return;

    try {
      setUpdatingDelivery(purchaseId);
      
      await updateDeliveryStatus(purchaseId, 'delivered', walletAddress);
      
      // Update local state
      setSalesData(prev =>
        prev.map(sale =>
          sale._id === purchaseId ? { ...sale, deliveryStatus: 'delivered' } : sale
        )
      );
    } catch (err: any) {
      console.error('Error updating delivery status:', err);
      alert(err.message || 'Erro ao atualizar status de entrega');
    } finally {
      setUpdatingDelivery(null);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SalesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle export
  const handleExport = () => {
    exportSalesToCSV(salesData);
  };

  // Group sales by product
  const groupedSales = productStats.reduce((acc, stat) => {
    const productSales = salesData.filter(
      sale => sale.productId?._id === stat._id || sale.productName === stat.productName
    );
    
    if (productSales.length > 0) {
      acc[stat.productName] = {
        totalQuantity: stat.totalQuantity,
        totalValue: stat.totalValue,
        sales: productSales,
      };
    }
    
    return acc;
  }, {} as { [product: string]: { totalQuantity: number; totalValue: number; sales: SalesPurchase[] } });

  if (loading) {
    return (
      <div className="sales-container">
        <div className="loading-container">
          <p>Carregando vendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-container">
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-container">
      {/* Header */}
      <div className="sales-header">
        <div className="sales-header-content">
          <div className="header-text">
            <h1 className="page-title">Controle de Vendas</h1>
            <p className="page-subtitle">
              Gerencie e acompanhe todas as vendas realizadas
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-container">
          <div className="stat-item">
            <SalesIcon className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{summary.totalSales}</span>
              <span className="stat-label">Total de Vendas</span>
            </div>
          </div>
          <div className="stat-item">
            <ExportIcon className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{summary.totalRevenue.toFixed(2)}</span>
              <span className="stat-label">Receita Total (Tokens)</span>
            </div>
          </div>
          <div className="stat-item">
            <CheckIcon className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{summary.totalProductsSold}</span>
              <span className="stat-label">Produtos Vendidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar - Filters & Actions */}
      <div className="controls-bar">
        <div className="controls-container">
          <div className="filters-wrapper">
            <FilterIcon className="filter-icon" />
            <div className="filter-row">
              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={filters.deliveryStatus || ''}
                  onChange={(e) => handleFilterChange({ deliveryStatus: e.target.value as any || undefined })}
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="delivered">Entregue</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Data Inicial:</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
                />
              </div>

              <div className="filter-group">
                <label>Data Final:</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
                />
              </div>

              <div className="filter-group">
                <label>Buscar:</label>
                <input
                  type="text"
                  placeholder="Produto ou comprador..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
                />
              </div>

              <button 
                className="clear-filters-btn" 
                onClick={() => setFilters({ page: 1, limit: 50 })}
                title="Limpar todos os filtros"
              >
                <ClearIcon />
                Limpar
              </button>
            </div>
          </div>

          <div className="actions-wrapper">
            <button 
              className="export-btn" 
              onClick={handleExport} 
              disabled={salesData.length === 0}
              title="Exportar vendas para CSV"
            >
              <ExportIcon />
              Exportar CSV
            </button>
            <span className="results-count">
              {salesData.length} de {pagination.totalItems} vendas
            </span>
          </div>
        </div>
      </div>

      {/* Content - Sales Tables */}
      <div className="page-content">
        {Object.keys(groupedSales).length === 0 ? (
          <div className="empty-state">
            <SalesIcon className="empty-icon" />
            <h3 className="empty-title">Nenhuma venda encontrada</h3>
            <p className="empty-text">
              Não há vendas registradas com os filtros selecionados. Tente ajustar os filtros ou aguarde novas vendas.
            </p>
          </div>
        ) : (
          Object.entries(groupedSales).map(([product, data]) => (
            <div key={product} className="product-sales-group">
              <div className="product-group-header">
                <h2 className="product-group-title">{product}</h2>
                <div className="product-group-stats">
                  <span className="group-stat">
                    <strong>{data.totalQuantity}</strong> unidades
                  </span>
                  <span className="group-stat primary">
                    <strong>{data.totalValue.toFixed(2)}</strong> tokens
                  </span>
                </div>
              </div>

              <div className="sales-table-wrapper">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Comprador</th>
                      <th>Email</th>
                      <th>Qtd</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th className="actions-th">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((sale) => (
                      <tr key={sale._id}>
                        <td className="date-cell">
                          {new Date(sale.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="buyer-cell">
                          <strong>{sale.userId?.name || 'N/A'}</strong>
                        </td>
                        <td className="email-cell">{sale.userId?.email || 'N/A'}</td>
                        <td className="quantity-cell">
                          <span className="quantity-badge">{sale.quantity}</span>
                        </td>
                        <td className="value-cell">
                          <span className="value-badge">{sale.totalAmount.toFixed(2)}</span>
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${sale.deliveryStatus}`}>
                            {sale.deliveryStatus === 'delivered' ? (
                              <>
                                <CheckIcon className="status-icon" />
                                Entregue
                              </>
                            ) : (
                              <>
                                <PendingIcon className="status-icon" />
                                Pendente
                              </>
                            )}
                          </span>
                        </td>
                        <td className="actions-cell">
                          {sale.deliveryStatus === 'delivered' ? (
                            <button className="delivery-button delivered" disabled>
                              <CheckIcon />
                              Entregue
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsDelivered(sale._id)}
                              className="delivery-button pending"
                              disabled={updatingDelivery === sale._id}
                            >
                              {updatingDelivery === sale._id ? (
                                'Atualizando...'
                              ) : (
                                <>
                                  <CheckIcon />
                                  Marcar como Entregue
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesControl;