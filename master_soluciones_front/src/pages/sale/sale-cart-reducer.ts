import { type SaleCartAction, type SaleCartState } from "./sale-cart-context";


export const saleCartReducer = (saleCartState: SaleCartState, action: SaleCartAction ): SaleCartState => {
    const { type, payload } = action;

    switch (type) {
        case 'ADD_TO_CART': {
            const newState = {...saleCartState};
            // newState.items.push(payload);
            // newState.total = newState.items.reduce((subtotal, item) => subtotal + item.subtotal, 0);
            
            console.log('ADD TO CART: ', newState)
            return {...saleCartState, items: [...newState.items, payload], total: newState.total + payload.subtotal};
        }

            

        case 'REMOVE_FROM_CART':{
            // const productsUpd = saleCartState.items.filter((product) => product.id !== payload.id);
            const itemDeleted = saleCartState.items.find(item => item.id === payload.id)!;
            return { ...saleCartState, items: saleCartState.items.filter(item => item.id!== itemDeleted.id), total: saleCartState.total - itemDeleted.subtotal  }
        }


        case 'INCREMENT_QUANTITY': {

            const itemFound = saleCartState.items.find(item => item.id === payload.id)!;
            itemFound.quantity = payload.increment;
            itemFound.subtotal = itemFound.unitPrice * payload.increment;
            const total = saleCartState.items.reduce((subtotal, item) => subtotal + item.subtotal, 0);
            return { ...saleCartState, items: [...saleCartState.items], total,}
        }

        case 'ADD_CUSTOMER': {
            return { ...saleCartState, customer: payload };
        }

        case 'RESET_SALECART' : {
            return { items: [], total: 0, customer: undefined }
        }
            
        default:{
            console.log('[ACTION TYPE UNKNOWN]')
            return {...saleCartState, total: 101};
        }
            
    }
};
