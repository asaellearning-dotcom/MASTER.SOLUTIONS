import {
    Box,
    Button,
    Field,
    Icon,
    IconButton,
    Input,
    NativeSelect,
    Spinner,
    Text,
    HStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaPencil } from "react-icons/fa6";
import { API_URL } from "@/config";

type BusinessProfile = {
    name: string;
    phone: string;
    address: string;
    email: string;
    businessNumber: string;
    businessNumberType: 'NIT' | 'RUT' | string;
};

const EMPTY_PROFILE: BusinessProfile = {
    name: '',
    phone: '',
    address: '',
    email: '',
    businessNumber: '',
    businessNumberType: 'NIT',
};

export const BusinessProfileSection = () => {
    const [form, setForm] = useState<BusinessProfile>(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadBusiness();
    }, []);

    const loadBusiness = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('jwtToken');
            const { data } = await axios.get(`${API_URL}/business`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!data.ok || !data.business) {
                setMessage({ type: 'error', text: 'No se pudo cargar el perfil de la empresa' });
                return;
            }

            setForm({
                name: data.business.name ?? '',
                phone: data.business.phone ?? '',
                address: data.business.address ?? '',
                email: data.business.email ?? '',
                businessNumber: String(data.business.businessNumber ?? ''),
                businessNumberType: data.business.businessNumberType ?? 'NIT',
            });
        } catch {
            setMessage({ type: 'error', text: 'Error cargando el perfil de la empresa' });
        } finally {
            setLoading(false);
        }
    };

    const updateField = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setMessage(null);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.businessNumber.trim()) {
            setMessage({
                type: 'error',
                text: 'Razón social, NIT/RUT y correo electrónico son requeridos',
            });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('jwtToken');
            const { data } = await axios.put(
                `${API_URL}/business`,
                {
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    address: form.address.trim(),
                    email: form.email.trim(),
                    businessNumber: form.businessNumber.trim(),
                    businessNumberType: form.businessNumberType,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!data.ok) {
                setMessage({ type: 'error', text: data.message || 'No se pudo guardar' });
                return;
            }

            setForm({
                name: data.business.name ?? '',
                phone: data.business.phone ?? '',
                address: data.business.address ?? '',
                email: data.business.email ?? '',
                businessNumber: String(data.business.businessNumber ?? ''),
                businessNumberType: data.business.businessNumberType ?? 'NIT',
            });
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Perfil de empresa actualizado' });
        } catch {
            setMessage({ type: 'error', text: 'Error guardando el perfil de la empresa' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ border: '1px solid blue', height: '100%', padding: '.5em', display: 'flex', justifyContent: 'center' }}>
                <Box
                    borderWidth="1px"
                    rounded="md"
                    bg="white"
                    height="400px"
                    width="100%"
                    maxW="42rem"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap="3"
                >
                    <Spinner size="md" />
                    <Text fontSize="sm">Cargando perfil de empresa...</Text>
                </Box>
            </div>
        );
    }

    return (
        <div style={{ border: '1px solid blue', height: '100%', padding: '.5em', display: 'flex', justifyContent: 'center' }}>
            <Box borderWidth="1px" rounded="md" bg="white" p="6" maxW="42rem" width="100%">
                <HStack justify="space-between" align="center" mb="5">
                    <Text color="gray.700" fontWeight="bold" fontSize="lg">
                        Datos básicos de la empresa
                    </Text>
                    <IconButton
                        aria-label={isEditing ? 'Desactivar edición' : 'Editar perfil'}
                        variant="ghost"
                        size="sm"
                        color={isEditing ? 'blue.500' : 'gray.600'}
                        onClick={() => {
                            setIsEditing((prev) => !prev);
                            setMessage(null);
                        }}
                    >
                        <Icon fontSize="md">
                            <FaPencil />
                        </Icon>
                    </IconButton>
                </HStack>

                <Box display="flex" flexDirection="column" gap="4">
                    <Field.Root>
                        <Field.Label>Razón social</Field.Label>
                        <Input
                            border="1px solid gray"
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="Nombre de la empresa"
                            disabled={!isEditing}
                        />
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Teléfono</Field.Label>
                        <Input
                            border="1px solid gray"
                            value={form.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="Teléfono de contacto"
                            disabled={!isEditing}
                        />
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>NIT / RUT</Field.Label>
                        <HStack gap="2" align="flex-start" width="100%">
                            <NativeSelect.Root size="md" width="6.5rem" disabled={!isEditing}>
                                <NativeSelect.Field
                                    value={form.businessNumberType}
                                    onChange={(e) => updateField('businessNumberType', e.target.value)}
                                    disabled={!isEditing}
                                >
                                    <option value="NIT">NIT</option>
                                    <option value="RUT">RUT</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            <Input
                                border="1px solid gray"
                                flex="1"
                                value={form.businessNumber}
                                onChange={(e) => updateField('businessNumber', e.target.value)}
                                placeholder="Número de identificación"
                                disabled={!isEditing}
                            />
                        </HStack>
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Dirección</Field.Label>
                        <Input
                            border="1px solid gray"
                            value={form.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="Dirección comercial"
                            disabled={!isEditing}
                        />
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Correo electrónico</Field.Label>
                        <Input
                            border="1px solid gray"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="empresa@ejemplo.com"
                            disabled={!isEditing}
                        />
                    </Field.Root>

                    {message && (
                        <Text
                            fontSize="sm"
                            color={message.type === 'success' ? 'green.600' : 'red.500'}
                            fontWeight="medium"
                        >
                            {message.text}
                        </Text>
                    )}

                    {isEditing && (
                        <HStack justify="flex-end" mt="2">
                            <Button
                                backgroundColor="blue.500"
                                color="white"
                                onClick={handleSave}
                                loading={saving}
                                disabled={saving}
                            >
                                Guardar cambios
                            </Button>
                        </HStack>
                    )}
                </Box>
            </Box>
        </div>
    );
};
