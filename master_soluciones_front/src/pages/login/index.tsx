import axios from 'axios';
import { useNavigate } from 'react-router';
import {
    Box,
    Button,
    ButtonGroup,
    Field,
    Heading,
    Icon,
    IconButton,
    Input,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaStore } from "react-icons/fa6";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { API_URL } from '@/config';
import { ROLES } from '@/utils/auth';

type LoginMethod = 'email' | 'document';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [businessNumber, setBusinessNumber] = useState('');
    const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
    const [userEmail, setUserEmail] = useState('');
    const [documentId, setDocumentId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            const raw = localStorage.getItem('basicUSerData');
            const roleCode = raw ? JSON.parse(raw)?.roleCode : null;
            navigate(roleCode === ROLES.CASHIER ? '/ventas/registrar' : '/dashboard');
        }
    }, []);

    const signIn = async () => {
        const loginValue = loginMethod === 'email' ? userEmail.trim() : documentId.trim();

        if (!loginValue || !password || !businessNumber.trim()) {
            setError(
                loginMethod === 'email'
                    ? 'Completa NIT/RUT, correo y contraseña'
                    : 'Completa NIT/RUT, documento y contraseña'
            );
            return;
        }

        setLoading(true);
        setError('');

        try {
            const url = `${API_URL}/users/login`;
            const body: {
                password: string;
                businessNumber: string;
                email?: string;
                documentId?: string;
            } = {
                password,
                businessNumber: businessNumber.trim(),
            };

            if (loginMethod === 'email') {
                body.email = loginValue;
            } else {
                body.documentId = loginValue;
            }

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
                    : '/dashboard'
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
                            <Field.Label color="gray.700">Iniciar sesión con</Field.Label>
                            <ButtonGroup size="sm" variant="outline" w="100%">
                                <Button
                                    flex="1"
                                    onClick={() => {
                                        setLoginMethod('email');
                                        setDocumentId('');
                                        setError('');
                                    }}
                                    bg={loginMethod === 'email' ? 'gray.700' : 'white'}
                                    color={loginMethod === 'email' ? 'white' : 'gray.700'}
                                    borderColor="gray.300"
                                    _hover={{
                                        bg: loginMethod === 'email' ? 'gray.800' : 'gray.50',
                                    }}
                                >
                                    Correo
                                </Button>
                                <Button
                                    flex="1"
                                    onClick={() => {
                                        setLoginMethod('document');
                                        setUserEmail('');
                                        setError('');
                                    }}
                                    bg={loginMethod === 'document' ? 'gray.700' : 'white'}
                                    color={loginMethod === 'document' ? 'white' : 'gray.700'}
                                    borderColor="gray.300"
                                    _hover={{
                                        bg: loginMethod === 'document' ? 'gray.800' : 'gray.50',
                                    }}
                                >
                                    Documento
                                </Button>
                            </ButtonGroup>
                        </Field.Root>

                        {loginMethod === 'email' ? (
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
                        ) : (
                            <Field.Root>
                                <Field.Label color="gray.700">Documento</Field.Label>
                                <Input
                                    border="1px solid"
                                    borderColor="gray.300"
                                    bg="white"
                                    color="gray.800"
                                    placeholder="Número de documento"
                                    value={documentId}
                                    onChange={(e) => {
                                        setDocumentId(e.target.value);
                                        setError('');
                                    }}
                                />
                            </Field.Root>
                        )}

                        <Field.Root>
                            <Field.Label color="gray.700">Contraseña</Field.Label>
                            <Box position="relative" w="100%">
                                <Input
                                    w="100%"
                                    border="1px solid"
                                    borderColor="gray.300"
                                    bg="white"
                                    color="gray.800"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Tu contraseña"
                                    value={password}
                                    pr="10"
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                />
                                <IconButton
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    position="absolute"
                                    right="1"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    size="sm"
                                    variant="ghost"
                                    color="gray.500"
                                    _hover={{ color: 'gray.700', bg: 'transparent' }}
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? <LuEyeOff /> : <LuEye />}
                                </IconButton>
                            </Box>
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
