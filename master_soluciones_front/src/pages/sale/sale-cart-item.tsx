import { Box, HStack, IconButton, NumberInput } from "@chakra-ui/react";
import type { ItemSelected } from "./sale-cart-context";
import { FaTrashAlt } from "react-icons/fa";
import { LuMinus, LuPlus } from "react-icons/lu";
import { useSaleCart } from "./use-sale-cart";
import { formatCOP } from "@/utils/format";

export const SaleCartItem = ({
    item
}: {
    item: ItemSelected
}) => {

    
    const {deleteItem, incrementQuantity } = useSaleCart();
    // const [quantity, setQuantity] = useState(item.quantity);


    return (
        <div
            key={item.id}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'start',
                borderBottom: '1px solid gray',
                borderStyle: 'dashed',
                backgroundColor: 'white',
                padding: '.5em',
                width: '100%'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'end', width: '100%' }}>
                <Box  
                    cursor={'pointer'} 
                    color='#DC2626' 
                    backgroundColor={'white'} 
                    _hover={{ backgroundColor: '#DC2626', color: 'white'   }} 
                    style={{ border: '1px solid white', padding: '.5em', borderRadius: '.5em'}}
                    onClick={() => {deleteItem(item.id)}}
                >
                    <FaTrashAlt height={'16px'} width={'16px'} />
                </Box>
            </div>
            <div style={{ display: 'flex',  justifyContent: 'space-between', width: '100%', border: '0px solid cyan' }}>
                <p style={{flex: '4', border: '0px solid green', display: 'flex', alignItems: 'center', color: '#1a202c'}}>
                    {item.name}
                </p>
            </div>
            <p style={{flex: '2', border: '0px solid blue', display: 'flex', justifyContent: 'end', alignItems: 'center', color:'#4a5568'}} >
                Precio: {formatCOP(item.unitPrice)}
            </p>
            <div style={{
                width: '100%',
                display: 'flex',
                border: '0px solid brown', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '.2em',
            }} >
                
                <p style={{
                    border: '0px solid orange', 
                    flex: 2, 
                    display: 'flex', 
                    // justifyContent: 'end', 
                    alignItems: 'center',
                    color: '#1a202c',
                    fontWeight: '600'
                }}>
                    Sub total: {formatCOP(item.subtotal)}
                </p>

                <NumberInput.Root 
                    unstyled spinOnPress={false} min={1} max={10}
                    value={item.quantity.toString()}
                    onValueChange={(detail) => {
                        incrementQuantity(item.id, detail.valueAsNumber);
                    }}
                >
                    <HStack gap="2">
                        <NumberInput.DecrementTrigger asChild>
                        <IconButton variant="outline" size="sm">
                            <LuMinus />
                        </IconButton>
                        </NumberInput.DecrementTrigger>
                        <NumberInput.Input textAlign="center" fontSize="lg" minW="3ch" />
                        <NumberInput.IncrementTrigger asChild>
                        <IconButton variant="outline" size="sm" onClick={() => {

                    

                        }}>
                            <LuPlus />
                        </IconButton>
                        </NumberInput.IncrementTrigger>
                    </HStack>
                </NumberInput.Root>
            </div>
        </div>
    )
};