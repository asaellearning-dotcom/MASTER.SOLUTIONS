import { Stack, Box, Drawer, Button, CloseButton,  Portal, useBreakpointValue, Icon, Heading, Text, Separator   } from '@chakra-ui/react'


import { FaStore } from "react-icons/fa6";
import { FaCircleUser } from "react-icons/fa6";
import { ImStatsDots } from "react-icons/im";
import { FaGear, FaPowerOff } from "react-icons/fa6";
import { BiSolidReport } from "react-icons/bi";
import { FaUsers } from "react-icons/fa";
import { MdPointOfSale } from "react-icons/md";
import { FaBoxesStacked } from "react-icons/fa6";
import { NavLink, useLocation, useNavigate } from 'react-router';
import type { IconType } from 'react-icons';
import { getBasicUserData, hasRole, ROLES } from '@/utils/auth';

type SidebarNavItem = {
    label: string;
    to: string;
    icon: IconType;
    isActive: (pathname: string) => boolean;
    roles: string[];
};

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
    {
        label: 'Dashboard',
        to: '/',
        icon: ImStatsDots,
        isActive: (pathname) => pathname === '/',
        roles: [ROLES.ADMIN],
    },
    {
        label: 'Punto De Venta',
        to: '/ventas/registrar',
        icon: MdPointOfSale,
        isActive: (pathname) => pathname.startsWith('/ventas'),
        roles: [ROLES.ADMIN, ROLES.CASHIER],
    },
    {
        label: 'Clientes',
        to: '/clientes/mis-clientes',
        icon: FaUsers,
        isActive: (pathname) => pathname.startsWith('/clientes'),
        roles: [ROLES.ADMIN],
    },
    {
        label: 'Inventario',
        to: '/inventario/stock-actual',
        icon: FaBoxesStacked,
        isActive: (pathname) => pathname.startsWith('/inventario'),
        roles: [ROLES.ADMIN],
    },
    {
        label: 'Configuración',
        to: '/configuracion/perfil-empresa',
        icon: FaGear,
        isActive: (pathname) => pathname.startsWith('/configuracion'),
        roles: [ROLES.ADMIN],
    },
];

const LogoutButton = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('basicUSerData');
        navigate('/login');
    };

    return (
        <Box width="100%" px="1.3em" pb="1.3em" pt="0.5em">
            <Button
                width="100%"
                variant="ghost"
                justifyContent="flex-start"
                color="red.500"
                _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
                onClick={handleLogout}
            >
                <Icon fontSize="md">
                    <FaPowerOff />
                </Icon>
                <Text marginLeft="2.5" fontWeight="semibold">
                    Cerrar sesión
                </Text>
            </Button>
        </Box>
    );
};

export const SidebarContent = () => {
    const { pathname } = useLocation();
    const visibleItems = SIDEBAR_NAV_ITEMS.filter((item) => hasRole(...item.roles));

    return (
        <Box border={'1px solid transparent'} marginTop={'1.5'} width="100%" flex="1">
            {visibleItems.map((item) => {
                const active = item.isActive(pathname);
                const ItemIcon = item.icon;

                return (
                    <div
                        key={item.label}
                        style={{
                            padding: '0.55em 1.3em',
                            border: '1px solid transparent',
                            display: 'block',
                        }}
                    >
                        <NavLink to={item.to} end={item.to === '/'}>
                            <Box
                                display={'flex'}
                                justifyContent={'start'}
                                alignItems={'center'}
                                width="100%"
                                px="3"
                                py="2.5"
                                borderRadius="md"
                                bg={active ? 'rgba(59,130,246,0.12)' : 'transparent'}
                                borderLeftWidth="3px"
                                borderLeftColor={active ? '#3b82f6' : 'transparent'}
                                _hover={{ bg: active ? 'rgba(59,130,246,0.12)' : 'rgba(148,163,184,0.12)' }}
                                transition="background 0.15s ease"
                            >
                                <Icon color={active ? '#3b82f6' : '#94a3b8'} fontSize="md">
                                    <ItemIcon />
                                </Icon>
                                <Text
                                    color={active ? 'blue.500' : 'gray.800'}
                                    marginLeft={'2.5'}
                                    fontWeight={active ? 'semibold' : 'normal'}
                                >
                                    {item.label}
                                </Text>
                            </Box>
                        </NavLink>
                    </div>
                );
            })}

            {/* <div style={{padding: '1.3em', border: '1px solid transparent', display: 'inline-block'}}>
               <NavLink to={'/'} >
                    <Box display={'flex'} justifyContent={'start'} alignItems={'center'}>
                        <Icon color={'#94a3b8'}>
                            <BiSolidReport />
                        </Icon>
                        <Text color={'gray.800'} marginLeft={'2.5'}>Reportes</Text>
                    </Box>
               </NavLink>
           </div> */}
        </Box>
    );
}

export const SideBarMobile =  () => {
  return (
    <Drawer.Root placement={'start'} >
      <Drawer.Trigger asChild>
        <Button variant="outline" size="sm" position={'absolute'} left={0} top={0} marginBottom={'3em'}>
          Open Drawer
        </Button>
      </Drawer.Trigger>
      <Portal >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content backgroundColor={'rgba(10, 15, 30, 0.9)'}>
            <Drawer.Header>
              <Drawer.Title>Drawer Title <i style={{fontSize: '40px', content: "\f54e", color: 'blue'}}></i>  </Drawer.Title>
            </Drawer.Header> 
            <Drawer.Body display="flex" flexDirection="column">
              <SidebarContent />
              <LogoutButton />
            </Drawer.Body>
            <Drawer.Footer>
              {/* <Button variant="outline">Cancel</Button>
              <Button>Save</Button> */}
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
};

export const SideBarDesktop = () => {
    const userData = getBasicUserData();
    const roleLabel = userData?.roleName || userData?.roleCode || 'Usuario';

    return <>
    
        <Box
            height={'100vh'}
            width={{xl: '17%', lg: '17%'}}
            // borderRightColor={'gray.700'}
            borderRightWidth={'thin'}
            // bg={'gray.200'}
            // backgroundColor={'rgba(10, 15, 30, 0.9)'}
            // display={{sm: 'none', lg: 'block'}}
            
            padding={0}
            margin={0}
            display="flex"
            flexDirection="column"
        >
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1.3em', }}>
               
              <div>
                    <Icon fontSize={'5xl'} color="#3b82f6">
                        <FaStore />
                    </Icon>
              </div>
              
              <div>
                <Heading color={'white'} padding={'2.5'}>Empresa</Heading>
              </div>

              <div style={{
                    padding: '.65em .85em',
                    width: '100%',
                    borderRadius: '.5em',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.35)',
                }}
                >

                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.55em', width: '100%' }}>
                         <Icon color="#2563eb" fontSize={'xl'}>
                            <FaCircleUser />
                        </Icon>
                        <Text
                            color="gray.800"
                            fontWeight="bold"
                            fontSize="md"
                            letterSpacing="0.02em"
                        >
                            {roleLabel}
                        </Text>
                        
                    </div>

               
              </div>
                
            </div>
           
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Separator width={'80%'} borderColor={'gray.700'} />
            </div>

            <SidebarContent />
            <LogoutButton />
        </Box>
    
    
    </>
};


export const SideBar = () => {

    const isMobile = useBreakpointValue({ base: true, lg: false });

    return <>
        {isMobile && <SideBarMobile />}
        {!isMobile && <SideBarDesktop />}
    </>
}
