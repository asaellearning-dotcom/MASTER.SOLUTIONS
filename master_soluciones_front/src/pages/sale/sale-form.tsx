import { SaleCart } from "./sale-cart";
import { SaleProductSearch } from "./sale-product-search";
import { SaleCartContext, SaleCartDispatchContext, type SaleCartState,} from './sale-cart-context'
import { useEffect, useReducer } from "react";
import { saleCartReducer } from "./sale-cart-reducer";


export const initialSaleCartState: SaleCartState = {
    items: [
        // {
        //     code: '2dfb',
        //     id: 1202,
        //     name: 'Cooco fee',
        //     quantity: 1,
        //     stock: 3,
        //     subtotal: 2300,
        //     unitPrice: 3400
        // }
    ],
    total: 0,
};

export const SaleFormPanel = () => {    
    const [saleCartData, dispatch] = useReducer(saleCartReducer, initialSaleCartState);

    useEffect(() => {

        console.log('-------> ', saleCartData)
    }, [saleCartData]);
    
    return <>

        <SaleCartContext  value={saleCartData}>
            <SaleCartDispatchContext value={dispatch}>

                <div style={{
                    height: '100%',
                    display: 'flex',
                    
                    borderRadius: '.5em',
                    // gap: '.5em'
                }}>
                    <SaleProductSearch />
                    <SaleCart />
                </div>
            </SaleCartDispatchContext>
        </SaleCartContext>
    </>
};