import { Heading, Button, Icon, Box } from "@chakra-ui/react";
import { FaBox } from "react-icons/fa6";
import { FaTruckRampBox } from "react-icons/fa6";
import { NavLink } from "react-router";



export const Header = () => {


    return <>
    
        <Box 
            style={{border: '', width: '100%', padding: '.8em', }}
            borderBottom={'1px solid'}
            borderBottomColor={'gray.200'}
            bgColor={'white'}
        >

           <div>
             <Heading color={'gray.700'} padding={'2.5'} size={'2xl'} fontWeight={'bolder'}>Inventario</Heading>
           </div>

            <div style={{display: 'flex'}}>
                <Button backgroundColor={'white'} borderColor={'whiteAlpha.100'} color={'gray.700'} margin={'3'} as={NavLink as any} {...({to : 'stock-actual',})} css={{
                    "&[aria-current='page']": {
                    backgroundColor: "var(--chakra-colors-gray-700)",
                    color: "white",
                    }
                }}>
                    
                    <Icon  fontSize={'lg'}>
                        <FaBox />
                    </Icon>
                    <span>Stock Actual</span>
                </Button>
                <Button backgroundColor={'white'} borderColor={'whiteAlpha.100'} color={'gray.700'} margin={'3'} as={NavLink as any}  {...({to : 'entradas-y-excel',})} css={{
                    "&[aria-current='page']": {
                    backgroundColor: "var(--chakra-colors-gray-700)",
                    color: "white",
                    }
                }}>
                

                    <Icon fontSize={'lg'}>
                        <FaTruckRampBox />
                    </Icon>
                    <span>Entradas y Excle</span>
                                       
                </Button>
            </div>


            {/* <Separator width={'100%'} borderColor={'gray.700'} /> */}
        </Box>
    
    </>
};
