export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type StockMovementType = 'IN' | 'OUT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  type: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: FollowUpNote[];
}

export interface FollowUpNote {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string; // Decimal comes as string from Prisma
  currentStock: number;
  minStockAlert: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  type: StockMovementType;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer;
  status: ChallanStatus;
  totalQuantity: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: ChallanItem[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
