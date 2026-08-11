import { useContext, useEffect } from "react"
import { SaleCartContext, SaleCartDispatchContext, type Customer, type ItemSelected } from "./sale-cart-context"

export const useSaleCart = () => {


    const state = useContext(SaleCartContext);
    const dispatch = useContext(SaleCartDispatchContext);
    if (!state || !dispatch) {
        throw new Error('Sale cart contex is not setup');
    }

    useEffect(() => {
        console.log('Hola desde [','] Ha cambiado el Estado!!', state);
    }, [state]);

    return {


        items: state.items,
        total: state.total,
        customer: state.customer,

        addItem: function (item: ItemSelected) {
            console.log('Emitting the Event with a Dispatch')
            dispatch({
                type: 'ADD_TO_CART',
                payload: item
            });
        },


        deleteItem: function(productId: number) {

            dispatch({
                type: 'REMOVE_FROM_CART',
                payload: {id: productId},
            })
        },

        incrementQuantity: function(productId: number, increment: number) {
            dispatch({
                type: 'INCREMENT_QUANTITY',
                payload: { id: productId, increment }
            })
        },

        addCustomer: function(customer: Customer) {

            dispatch({
                type: 'ADD_CUSTOMER',
                payload: customer,
            })
        },

        resetSaleCart: function() {
            dispatch({
                type: 'RESET_SALECART',
                payload: {},
            })
        }

    }
};


