import { Heading, Button, Separator, Icon, Box, Text } from "@chakra-ui/react";
import { FaCartShopping } from "react-icons/fa6";
import { TbInvoice } from "react-icons/tb";
import { FaWallet } from "react-icons/fa6";



import { NavLink } from "react-router";



export const SaleHEader = () => {


    return <>
    
        <Box 
            style={{border: '', width: '100%', padding: '.8em', }}
            borderBottom={'1px solid'}
            borderBottomColor={'gray.200'}
            bgColor={'white'}
        >

           <div>
             <Heading color={'gray.700'} padding={'2.5'} size={'2xl'} fontWeight={'bolder'}>Ventas</Heading>
           </div>

            <div style={{display: 'flex'}}>
                <Button backgroundColor={'white'} borderColor={'whiteAlpha.100'} color={'gray.700'} margin={'3'} as={NavLink as any} {...({to : 'registrar',})} css={{
                    "&[aria-current='page']": {
                    backgroundColor: "var(--chakra-colors-gray-700)",
                    color: "white",
                    }
                }}>
                    
                    <Icon  fontSize={'lg'}>
                        <FaCartShopping />
                    </Icon>
                    <span>Caja Venta</span>
                </Button>


                <Button backgroundColor={'white'} borderColor={'whiteAlpha.100'} color={'gray.700'} margin={'3'} as={NavLink as any} {...({to : 'historial-facturas',})} css={{
                    "&[aria-current='page']": {
                    backgroundColor: "var(--chakra-colors-gray-700)",
                    color: "white",
                    }
                }}>
                    
                    <Icon  fontSize={'lg'}>
                        <TbInvoice />
                    </Icon>
                    <span>Historial Facturas</span>
                </Button>

                <Button backgroundColor={'white'} borderColor={'whiteAlpha.100'} color={'gray.700'} margin={'3'} as={NavLink as any} {...({to : 'cartera',})} css={{
                    "&[aria-current='page']": {
                    backgroundColor: "var(--chakra-colors-gray-700)",
                    color: "white",
                    }
                }}>
                    
                    <Icon  fontSize={'lg'}>
                        <FaWallet />
                    </Icon>
                    <span>Cartera (CxC)</span>
                </Button>



                {/* <Button backgroundColor={'white'} borderColor={'whiteAlpha.100'} color={'gray.700'} margin={'3'} as={NavLink as any}  {...({to : 'entradas-y-excel',})} css={{
                    "&[aria-current='page']": {
                    backgroundColor: "var(--chakra-colors-gray-700)",
                    color: "white",
                    }
                }}>
                

                    <Icon fontSize={'lg'}>
                        <FaTruckRampBox />
                    </Icon>
                    <span>Entradas y Excle</span>
                                       
                </Button> */}
            </div>


            {/* <Separator width={'100%'} borderColor={'gray.700'} /> */}
        </Box>
    
    </>
};
