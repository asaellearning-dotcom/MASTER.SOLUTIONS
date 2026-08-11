import { Button, Text } from "@chakra-ui/react";
import type { Product } from "../types";
import { useSaleCart } from "./use-sale-cart";
import { formatCOP } from "@/utils/format";

export const SaleProductItem = ({
    product:  p,
    index,
}: {
    product: Product,
    index: number,
    
}) => {

    const { addItem, items } = useSaleCart();


    return (
        <div style={{
            // border: '0px solid gray',
            border: '1px solid #E5E7EB',
            borderRadius: '.5em',
            padding: '.5em',
            margin: '1em 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'start',
            backgroundColor: 'white',
        }}>

            <div>
                <p style={{display: 'flex', gap: '.5em'}}>
                    
                    <span style={{color: '#727272', fontWeight: '500', fontSize: '13px', marginBottom: '2px' }}>{p.customCode} # {++index}</span>
                </p>
                
                <p style={{ fontWeight: '600', fontSize: '16px', color:'#111111', marginBottom: '4px' }} >{p.name}</p>
                <p style={{ color: '#555555', fontSize: '13px', fontWeight: '400', marginBottom: '4px' }}>
                    <span>Stock disponible: </span>
                    <span>{p.stock} Unidades</span>
                </p>

                <p style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: '#555555',
                    marginBottom: '12px'

                }}>
                    Precio: {formatCOP(p.price)}
                </p>
            </div>
            
            <div style={{width: '100%', marginTop: '.5em'}}>

                {
                    items.some((item) => item.id === p.id) && (
                        <Text color={'purple.400'} fontWeight={'600'}>
                            AGREGADO
                        </Text>
                    ) || (
                        <Button 
                            _hover={ p.stock  ? {bg: 'green.600', color: 'white'} : {}}
                            bgColor={'white'}
                            color={p.stock ? 'green.600' : 'gray.400'}
                            height={'4/6'} 
                            padding={'.3em'} 
                            width={'30%'}
                            onClick={() => {
                                if(!p.stock) {
                                    return;
                                }

                                console.log('Cuantos clicks: ');
                                addItem({
                                    code: p.customCode,
                                    id: p.id,
                                    name: p.name,
                                    quantity: 1,
                                    stock: p.stock,
                                    subtotal: p.price,
                                    unitPrice: p.price
                                });
                            }}
                        >
                            AGREGAR A LA COMPRA
                        </Button>
                    )
                }
            </div>

        </div>
    )

};