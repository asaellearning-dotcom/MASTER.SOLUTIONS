import { Heading, Button, Icon, Box } from "@chakra-ui/react";
import { FaUsers } from "react-icons/fa";
import { NavLink } from "react-router";

export const CustomerHeader = () => {
    return (
        <Box
            style={{ border: '', width: '100%', padding: '.8em' }}
            borderBottom={'1px solid'}
            borderBottomColor={'gray.200'}
            bgColor={'white'}
        >
            <div>
                <Heading color={'gray.700'} padding={'2.5'} size={'2xl'} fontWeight={'bolder'}>
                    Clientes
                </Heading>
            </div>

            <div style={{ display: 'flex' }}>
                <Button
                    backgroundColor={'white'}
                    borderColor={'whiteAlpha.100'}
                    color={'gray.700'}
                    margin={'3'}
                    as={NavLink as any}
                    {...({ to: 'mis-clientes' })}
                    css={{
                        "&[aria-current='page']": {
                            backgroundColor: "var(--chakra-colors-gray-700)",
                            color: "white",
                        }
                    }}
                >
                    <Icon fontSize={'lg'}>
                        <FaUsers />
                    </Icon>
                    <span>Mis Clientes</span>
                </Button>
            </div>
        </Box>
    );
};
