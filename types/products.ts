export type Tier = {
  qty: number;
  price: number;
  percent: number;
  expiry: string;
};

export type WarehouseStock = {
  warehouseName: string;
  inStock: number;
  warehouseCode?: string;
};

export interface BatchInfo {
  batchSysNumber: number;
  batchNumber: string;
  batchAbsEntry: number;
  quantity: number;
  inDate: string;
  expDate: string;
  mnfDate?: string | null;
  daysToExpire: number;
  expirationStatus: string;
}

export interface WarehouseBatch {
  whsCode: string;
  whsName: string;
  stock: number;
  committed: number;
  onOrder: number;
  available: number;
  batches: BatchInfo[];
}

export interface BatchesResponse {
  itemCode: string;
  itemName: string;
  warehouses: WarehouseBatch[];
}

export type Product = {
  itemCode: string;
  itemName: string;
  itemDescription: string;
  suppCatNum: string;
  groupCode: number | string;
  groupName: string;
  subCategoryName?: string;
  inStock: number;
  committed: number;
  ordered: number;
  price: number;
  hasDiscount: boolean;
  taxType: string;
  taxCode: string;
  barCode?: string | null;
  salesUnit: string | null;
  salesItemsPerUnit: number;
  imageUrl?: string | null;
  tiers: Tier[];
  quantity?: number;
  unitPrice?: number;
  originalPrice?: number;
  categoryCode?: string;
  priceListNum?: number;
  priceListName?: string;
  pricingSource?: "GeneralSpecialPrice" | "CustomerSpecialPrice";
  ws: WarehouseStock[];
};