import { createContext, type Dispatch } from 'react';

export type ProductOrdered = {
  productId: number;
  productCodde: string;
  quantity: number;
}

export type ItemSelected = {
  id: number;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  stock: number;
};

export type Customer = {
  id: string;
  documentId: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  email: string;
};

export type SaleCartState = {
  items: ItemSelected[],
  total: number;
  customer?: Customer,
};

export type SaleCartAction =
  | {
      type: "ADD_TO_CART";
      payload: ItemSelected;
    }
  | {
      type: "REMOVE_FROM_CART";
      payload: {
        id: number;
      };
    }
  | {
    type: "INCREMENT_QUANTITY",
    payload: {
      id: number,
      increment: number
    }
  }
  | {
    type: "ADD_CUSTOMER",
    payload: Customer,
  }
  | {
    type: "RESET_SALECART",
    payload: {}
  }

export type SaleCartDispatch = Dispatch<SaleCartAction>;

/***
 * 
 *  =============================== TYPES ^ ===============================
 * 
*/


export const SaleCartContext = createContext<SaleCartState | null>(null);
export const SaleCartDispatchContext = createContext<SaleCartDispatch | null>(null);



