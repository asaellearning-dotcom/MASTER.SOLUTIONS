import {
    Box,
    Drawer,
    Button,
    CloseButton,
    Portal,
    useBreakpointValue,
    Icon,
    Heading,
    Text,
    Separator,
} from '@chakra-ui/react';
import { FaStore, FaCircleUser, FaGear, FaPowerOff, FaBoxesStacked } from 'react-icons/fa6';
import { ImStatsDots } from 'react-icons/im';
import { FaUsers } from 'react-icons/fa';
import { MdPointOfSale, MdMenu } from 'react-icons/md';
import { NavLink, useLocation, useNavigate } from 'react-router';
import type { IconType } from 'react-icons';
import { useState } from 'react';
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
        to: '/dashboard',
        icon: ImStatsDots,
        isActive: (pathname) => pathname === '/' || pathname.startsWith('/dashboard'),
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

const SidebarBrandHeader = ({ compact = false }: { compact?: boolean }) => {
    const userData = getBasicUserData();
    const roleLabel = userData?.roleName || userData?.roleCode || 'Usuario';

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            px={compact ? '4' : '1.3em'}
            py={compact ? '4' : '1.3em'}
            gap="2"
        >
            <Icon fontSize={compact ? '4xl' : '5xl'} color="#3b82f6">
                <FaStore />
            </Icon>

            <Heading
                color="gray.800"
                size={compact ? 'md' : 'lg'}
                fontWeight="bolder"
                letterSpacing="tight"
                textAlign="center"
            >
                Master Soluciones
            </Heading>

            <Box
                px="3"
                py="2"
                width="100%"
                borderRadius="md"
                display="flex"
                justifyContent="center"
                alignItems="center"
                bg="rgba(59,130,246,0.12)"
                border="1px solid rgba(59,130,246,0.25)"
            >
                <Box display="flex" alignItems="center" gap="2">
                    <Icon color="#2563eb" fontSize="lg">
                        <FaCircleUser />
                    </Icon>
                    <Text color="gray.800" fontWeight="semibold" fontSize="sm">
                        {roleLabel}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};

const LogoutButton = ({ onLogout }: { onLogout?: () => void }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('basicUSerData');
        onLogout?.();
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

export const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
    const { pathname } = useLocation();
    const visibleItems = SIDEBAR_NAV_ITEMS.filter((item) => hasRole(...item.roles));

    return (
        <Box width="100%" flex="1" py="1">
            {visibleItems.map((item) => {
                const active = item.isActive(pathname);
                const ItemIcon = item.icon;

                return (
                    <Box key={item.label} px="1.3em" py="1">
                        <NavLink to={item.to} end={item.to === '/'} onClick={onNavigate}>
                            <Box
                                display="flex"
                                alignItems="center"
                                width="100%"
                                px="3"
                                py="2.5"
                                borderRadius="md"
                                bg={active ? 'rgba(59,130,246,0.12)' : 'transparent'}
                                borderLeftWidth="3px"
                                borderLeftColor={active ? '#3b82f6' : 'transparent'}
                                _hover={{
                                    bg: active ? 'rgba(59,130,246,0.12)' : 'rgba(148,163,184,0.12)',
                                }}
                                transition="background 0.15s ease"
                            >
                                <Icon color={active ? '#3b82f6' : '#94a3b8'} fontSize="md">
                                    <ItemIcon />
                                </Icon>
                                <Text
                                    color={active ? 'blue.500' : 'gray.800'}
                                    marginLeft="2.5"
                                    fontWeight={active ? 'semibold' : 'normal'}
                                >
                                    {item.label}
                                </Text>
                            </Box>
                        </NavLink>
                    </Box>
                );
            })}
        </Box>
    );
};

export const SideBarMobile = () => {
    const [open, setOpen] = useState(false);

    const closeDrawer = () => setOpen(false);

    return (
        <>
            <Box
                position="fixed"
                top="0"
                left="0"
                right="0"
                zIndex="20"
                height="3.5rem"
                bg="white"
                borderBottom="1px solid"
                borderColor="gray.200"
                display="flex"
                alignItems="center"
                px="4"
                gap="3"
                boxShadow="sm"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    minW="auto"
                    px="2"
                    color="gray.700"
                    _hover={{ bg: 'gray.100' }}
                    onClick={() => setOpen(true)}
                    aria-label="Abrir menú"
                >
                    <Icon fontSize="xl">
                        <MdMenu />
                    </Icon>
                </Button>

                <Box display="flex" alignItems="center" gap="2" minW="0">
                    <Icon fontSize="xl" color="#3b82f6">
                        <FaStore />
                    </Icon>
                    <Text
                        fontWeight="bold"
                        color="gray.800"
                        fontSize="sm"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                    >
                        Master Soluciones
                    </Text>
                </Box>
            </Box>

            <Drawer.Root
                open={open}
                placement="start"
                onOpenChange={(details) => setOpen(details.open)}
            >
                <Portal>
                    <Drawer.Backdrop bg="blackAlpha.400" />
                    <Drawer.Positioner>
                        <Drawer.Content
                            bg="white"
                            maxW="18rem"
                            boxShadow="lg"
                        >
                            <Drawer.Header
                                borderBottomWidth="1px"
                                borderColor="gray.200"
                                py="3"
                                px="4"
                            >
                                <Drawer.Title fontSize="md" fontWeight="semibold" color="gray.800">
                                    Menú
                                </Drawer.Title>
                                <Drawer.CloseTrigger asChild position="absolute" top="3" right="3">
                                    <CloseButton size="sm" />
                                </Drawer.CloseTrigger>
                            </Drawer.Header>

                            <Drawer.Body
                                display="flex"
                                flexDirection="column"
                                p="0"
                                overflowY="auto"
                            >
                                <SidebarBrandHeader compact />
                                <Separator borderColor="gray.200" width="85%" mx="auto" />
                                <SidebarContent onNavigate={closeDrawer} />
                                <Box mt="auto">
                                    <LogoutButton onLogout={closeDrawer} />
                                </Box>
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </>
    );
};

export const SideBarDesktop = () => {
    return (
        <Box
            height="100vh"
            width={{ xl: '17%', lg: '17%' }}
            borderRightWidth="1px"
            borderRightColor="gray.200"
            bg="white"
            padding={0}
            margin={0}
            display="flex"
            flexDirection="column"
            flexShrink={0}
        >
            <SidebarBrandHeader />
            <Separator width="80%" borderColor="gray.200" mx="auto" />
            <SidebarContent />
            <LogoutButton />
        </Box>
    );
};

export const SideBar = () => {
    const isMobile = useBreakpointValue({ base: true, lg: false });

    return isMobile ? <SideBarMobile /> : <SideBarDesktop />;
};

export const MOBILE_TOPBAR_HEIGHT = '3.5rem';
