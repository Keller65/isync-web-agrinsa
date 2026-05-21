export interface OrderLineType {
  itemCode: string;
  itemDescription: string;
  itemName: string;
  barCode: string;
  quantity: number;
  priceAfterVAT?: number;
  priceList?: number;
  price?: number;
  suppCatNum?: string;
  unitPriceNoVAT?: number;
  basePriceNoVAT?: number;
  taxCode: string;
  stock?: number;
  warehouseCode?: string;
}

export interface InvoiceType {
  docEntry: number;
  docNum: number;
  numAtCard: string;
  cardCode: string;
  cardName: string;
  docDate: string;
  docDueDate: string;
  docTotal: number;
  balanceDue: number;
  paidAmount?: number;
}

export interface OrderDetailType {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  address: string;
  docDate: string;
  vatSum: number;
  docTotal: number;
  comments: string;
  salesPersonCode: number;
  priceListNum: number;
  salesPersonName: string;
  lines: OrderLineType[];
}

export interface OrderDataType {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  address: string;
  docDate: string;
  vatSum: number;
  docTotal: number;
  comments: string;
  salesPersonCode: number;
  priceListNum: number;
  lines: OrderLineType[];
}
