/**
 * Sales Service
 * 
 * Handles all API calls related to sales management and reporting
 */

import { appConfig } from '../config';

const API_BASE_URL = `${appConfig.networks.testnet.backendUrl}/api`;

export interface SalesPurchase {
  _id: string;
  productId: {
    _id: string;
    name: string;
    image?: string;
  };
  userId: {
    _id: string;
    name?: string;
    email: string;
    walletAddress: string;
  };
  walletAddress: string;
  quantity: number;
  pricePerItem: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  deliveryStatus: 'pending' | 'delivered';
  productName: string;
  productImage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalProductsSold: number;
}

export interface ProductStats {
  _id: string;
  productName: string;
  totalQuantity: number;
  totalValue: number;
  salesCount: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface SalesResponse {
  success: boolean;
  purchases: SalesPurchase[];
  pagination: Pagination;
  summary: SalesSummary;
  productStats: ProductStats[];
}

export interface SalesFilters {
  page?: number;
  limit?: number;
  deliveryStatus?: 'pending' | 'delivered';
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  startDate?: string;
  endDate?: string;
  productId?: string;
  search?: string;
}

/**
 * Get all sales with optional filtering and pagination (Admin only)
 */
export const getAllSales = async (
  filters: SalesFilters,
  adminWallet: string
): Promise<SalesResponse> => {
  try {
    // Build query params
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.deliveryStatus) params.append('deliveryStatus', filters.deliveryStatus);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.productId) params.append('productId', filters.productId);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/admin/sales?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'wallet-address': adminWallet,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch sales');
    }

    return data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

/**
 * Update delivery status of a purchase (Admin only)
 */
export const updateDeliveryStatus = async (
  purchaseId: string,
  deliveryStatus: 'pending' | 'delivered',
  adminWallet: string
): Promise<SalesPurchase> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/sales/${purchaseId}/delivery-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'wallet-address': adminWallet,
      },
      body: JSON.stringify({ deliveryStatus }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update delivery status');
    }

    return data.purchase;
  } catch (error) {
    console.error('Error updating delivery status:', error);
    throw error;
  }
};

/**
 * Export sales data to CSV format
 */
export const exportSalesToCSV = (purchases: SalesPurchase[]): void => {
  if (purchases.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Define CSV headers
  const headers = [
    'ID da Venda',
    'Data',
    'Produto',
    'Comprador (Nome)',
    'Comprador (Email)',
    'Comprador (Wallet)',
    'Quantidade',
    'Preço Unitário',
    'Valor Total',
    'Status Pagamento',
    'Status Entrega',
  ];

  // Convert purchases to CSV rows
  const rows = purchases.map(purchase => [
    purchase._id,
    new Date(purchase.createdAt).toLocaleString('pt-BR'),
    purchase.productName,
    purchase.userId?.name || 'N/A',
    purchase.userId?.email || 'N/A',
    purchase.walletAddress,
    purchase.quantity,
    purchase.pricePerItem,
    purchase.totalAmount,
    purchase.status,
    purchase.deliveryStatus === 'delivered' ? 'Entregue' : 'Pendente',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Escape commas and quotes in cell content
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `vendas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Calculate sales statistics from purchases
 */
export const calculateSalesStats = (purchases: SalesPurchase[]) => {
  const totalSales = purchases.length;
  const totalRevenue = purchases.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProductsSold = purchases.reduce((sum, sale) => sum + sale.quantity, 0);
  const pendingDeliveries = purchases.filter(p => p.deliveryStatus === 'pending').length;
  const completedDeliveries = purchases.filter(p => p.deliveryStatus === 'delivered').length;

  return {
    totalSales,
    totalRevenue,
    totalProductsSold,
    pendingDeliveries,
    completedDeliveries,
  };
};

