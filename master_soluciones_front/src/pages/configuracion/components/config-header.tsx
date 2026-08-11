import { Heading, Button, Icon, Box } from "@chakra-ui/react";
import { FaBuilding, FaUsersGear } from "react-icons/fa6";
import { NavLink } from "react-router";

const tabButtonStyles = {
    "&[aria-current='page']": {
        backgroundColor: "var(--chakra-colors-gray-700)",
        color: "white",
    },
};

export const ConfigHeader = () => {
    return (
        <Box
            style={{ border: '', width: '100%', padding: '.8em' }}
            borderBottom={'1px solid'}
            borderBottomColor={'gray.200'}
            bgColor={'white'}
        >
            <div>
                <Heading color={'gray.700'} padding={'2.5'} size={'2xl'} fontWeight={'bolder'}>
                    Configuración
                </Heading>
            </div>

            <div style={{ display: 'flex' }}>
                <Button
                    backgroundColor={'white'}
                    borderColor={'whiteAlpha.100'}
                    color={'gray.700'}
                    margin={'3'}
                    as={NavLink as any}
                    {...({ to: 'perfil-empresa' })}
                    css={tabButtonStyles}
                >
                    <Icon fontSize={'lg'}>
                        <FaBuilding />
                    </Icon>
                    <span>Perfil empresa</span>
                </Button>

                <Button
                    backgroundColor={'white'}
                    borderColor={'whiteAlpha.100'}
                    color={'gray.700'}
                    margin={'3'}
                    as={NavLink as any}
                    {...({ to: 'usuarios' })}
                    css={tabButtonStyles}
                >
                    <Icon fontSize={'lg'}>
                        <FaUsersGear />
                    </Icon>
                    <span>Usuarios</span>
                </Button>
            </div>
        </Box>
    );
};
