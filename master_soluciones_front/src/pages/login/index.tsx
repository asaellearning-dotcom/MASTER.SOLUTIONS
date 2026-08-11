import axios from 'axios';
import { useNavigate } from 'react-router';
import {
    Box,
    Button,
    Field,
    Heading,
    Icon,
    Input,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaStore } from "react-icons/fa6";
import { API_URL } from '@/config';
import { ROLES } from '@/utils/auth';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [businessNumber, setBusinessNumber] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            const raw = localStorage.getItem('basicUSerData');
            const roleCode = raw ? JSON.parse(raw)?.roleCode : null;
            navigate(roleCode === ROLES.CASHIER ? '/ventas/registrar' : '/inventario');
        }
    }, []);

    const signIn = async () => {
        if (!userEmail || !password || !businessNumber) {
            setError('Completa NIT/RUT, correo y contraseña');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const url = `${API_URL}/users/login`;
            const body = {
                email: userEmail,
                password,
                businessNumber,
            };

            const { data } = await axios.post(url, body);

            if (!data.ok) {
                setError(data.message || 'Credenciales incorrectas');
                return;
            }

            localStorage.setItem('jwtToken', data.token);
            localStorage.setItem('basicUSerData', JSON.stringify(data.userData));
            navigate(
                data.userData?.roleCode === ROLES.CASHIER
                    ? '/ventas/registrar'
                    : '/inventario'
            );
        } catch (err: any) {
            setError(
                err?.response?.data?.message
                || 'Error al iniciar sesión. Intenta más tarde'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            signIn();
        }
    };

    return (
        <Box
            minH="100vh"
            w="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={{ base: '4', sm: '6', md: '8' }}
            py={{ base: '8', md: '10' }}
            bg="gray.100"
            backgroundImage="linear-gradient(160deg, #eff6ff 0%, #f3f4f6 45%, #e2e8f0 100%)"
        >
            <Box
                w="100%"
                maxW={{ base: '100%', sm: '26rem', md: '28rem' }}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                px={{ base: '5', sm: '7', md: '8' }}
                py={{ base: '7', sm: '8', md: '9' }}
            >
                <VStack align="stretch" gap={{ base: '5', md: '6' }}>
                    <Box textAlign="center">
                        <Icon color="#3b82f6" fontSize={{ base: '4xl', md: '5xl' }} mb="3">
                            <FaStore />
                        </Icon>
                        <Heading
                            color="gray.800"
                            size={{ base: 'lg', md: 'xl' }}
                            fontWeight="bolder"
                            letterSpacing="tight"
                        >
                            MASTER SOLUCIONES
                        </Heading>
                        <Text
                            color="gray.500"
                            fontSize={{ base: 'xs', md: 'sm' }}
                            mt="2"
                            textTransform="uppercase"
                            letterSpacing="0.06em"
                        >
                            Software administrativo
                        </Text>
                    </Box>

                    <VStack align="stretch" gap="4" onKeyDown={handleKeyDown}>
                        <Field.Root>
                            <Field.Label color="gray.700">NIT / RUT</Field.Label>
                            <Input
                                border="1px solid"
                                borderColor="gray.300"
                                bg="white"
                                color="gray.800"
                                placeholder="Número de la empresa"
                                value={businessNumber}
                                onChange={(e) => {
                                    setBusinessNumber(e.target.value);
                                    setError('');
                                }}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label color="gray.700">Correo electrónico</Field.Label>
                            <Input
                                border="1px solid"
                                borderColor="gray.300"
                                bg="white"
                                color="gray.800"
                                type="email"
                                placeholder="usuario@empresa.com"
                                value={userEmail}
                                onChange={(e) => {
                                    setUserEmail(e.target.value);
                                    setError('');
                                }}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label color="gray.700">Contraseña</Field.Label>
                            <Input
                                border="1px solid"
                                borderColor="gray.300"
                                bg="white"
                                color="gray.800"
                                type="password"
                                placeholder="Tu contraseña"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                            />
                        </Field.Root>

                        {error && (
                            <Text fontSize="sm" color="red.500" fontWeight="medium">
                                {error}
                            </Text>
                        )}

                        <Button
                            mt="1"
                            w="100%"
                            backgroundColor="blue.500"
                            color="white"
                            size="lg"
                            onClick={signIn}
                            loading={loading}
                            disabled={loading}
                            _hover={{ backgroundColor: 'blue.600' }}
                        >
                            Iniciar sesión
                        </Button>
                    </VStack>
                </VStack>
            </Box>
        </Box>
    );
};
