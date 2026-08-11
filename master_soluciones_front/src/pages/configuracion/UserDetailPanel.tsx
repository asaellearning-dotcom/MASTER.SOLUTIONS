import {
    Box,
    Button,
    CloseButton,
    Drawer,
    Field,
    Input,
    NativeSelect,
    Portal,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { API_URL } from "@/config";

type UserRole = {
    id: number;
    code: string;
    name: string;
};

type UserDetail = {
    id: number;
    documentNumber: string;
    fullName: string;
    email: string;
    phone?: string | null;
    roleId: number;
};

type UserDetailPanelProps = {
    userId: number | null;
    onClose: () => void;
    onUpdated: () => void;
};

export const UserDetailPanel = ({ userId, onClose, onUpdated }: UserDetailPanelProps) => {
    const [form, setForm] = useState({
        documentNumber: '',
        fullName: '',
        email: '',
        phone: '',
        roleId: '',
        password: '',
    });
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (userId == null) {
            setError(null);
            setSuccess(null);
            return;
        }

        const load = async () => {
            setLoading(true);
            setError(null);
            setSuccess(null);

            try {
                const token = localStorage.getItem('jwtToken');
                const [userRes, rolesRes] = await Promise.all([
                    axios.get(`${API_URL}/users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${API_URL}/users/roles`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (!userRes.data.ok || !userRes.data.user) {
                    setError('No se pudo cargar el usuario');
                    return;
                }

                const user: UserDetail = userRes.data.user;
                setForm({
                    documentNumber: user.documentNumber ?? '',
                    fullName: user.fullName ?? '',
                    email: user.email ?? '',
                    phone: user.phone ?? '',
                    roleId: String(user.roleId ?? ''),
                    password: '',
                });

                if (rolesRes.data.ok) {
                    setRoles(rolesRes.data.roles ?? []);
                }
            } catch {
                setError('Error al obtener el usuario');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [userId]);

    const updateField = (key: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError(null);
        setSuccess(null);
    };

    const handleSave = async () => {
        if (userId == null) return;

        if (!form.documentNumber.trim() || !form.fullName.trim() || !form.email.trim() || !form.roleId) {
            setError('Documento, nombre, correo y rol son requeridos');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('jwtToken');
            const { data } = await axios.put(
                `${API_URL}/users/${userId}`,
                {
                    documentNumber: form.documentNumber.trim(),
                    fullName: form.fullName.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    roleId: Number(form.roleId),
                    password: form.password.trim(),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!data.ok) {
                setError(data.message || 'No se pudo actualizar el usuario');
                return;
            }

            setForm((prev) => ({ ...prev, password: '' }));
            setSuccess('Usuario actualizado');
            onUpdated();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error actualizando el usuario');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer.Root
            open={userId != null}
            placement="end"
            onOpenChange={(details) => {
                if (!details.open) onClose();
            }}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content
                        w={{ base: "100%", md: "450px" }}
                        maxW="100vw"
                        h="100%"
                        display="flex"
                        flexDirection="column"
                    >
                        <Drawer.Header borderBottomWidth="1px" flexShrink={0}>
                            <Drawer.Title>Editar usuario</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body flex="1" minH="0" overflowY="auto" py="4">
                            {loading ? (
                                <Box display="flex" alignItems="center" justifyContent="center" gap="3" py="10">
                                    <Spinner size="md" />
                                    <Text fontSize="sm">Cargando usuario...</Text>
                                </Box>
                            ) : error && !form.fullName ? (
                                <Text color="red.500">{error}</Text>
                            ) : (
                                <VStack align="stretch" gap="4">
                                    <Field.Root>
                                        <Field.Label>Documento</Field.Label>
                                        <Input
                                            border="1px solid gray"
                                            value={form.documentNumber}
                                            onChange={(e) => updateField('documentNumber', e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Nombre completo</Field.Label>
                                        <Input
                                            border="1px solid gray"
                                            value={form.fullName}
                                            onChange={(e) => updateField('fullName', e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Correo electrónico</Field.Label>
                                        <Input
                                            border="1px solid gray"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Teléfono</Field.Label>
                                        <Input
                                            border="1px solid gray"
                                            value={form.phone}
                                            onChange={(e) => updateField('phone', e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Rol</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.roleId}
                                                onChange={(e) => updateField('roleId', e.target.value)}
                                            >
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Nueva contraseña (opcional)</Field.Label>
                                        <Input
                                            border="1px solid gray"
                                            type="password"
                                            placeholder="Dejar vacío para no cambiar"
                                            value={form.password}
                                            onChange={(e) => updateField('password', e.target.value)}
                                        />
                                    </Field.Root>

                                    {error && (
                                        <Text fontSize="sm" color="red.500" fontWeight="medium">
                                            {error}
                                        </Text>
                                    )}
                                    {success && (
                                        <Text fontSize="sm" color="green.600" fontWeight="medium">
                                            {success}
                                        </Text>
                                    )}

                                    <Button
                                        backgroundColor="blue.500"
                                        color="white"
                                        onClick={handleSave}
                                        loading={saving}
                                        disabled={saving}
                                    >
                                        Guardar cambios
                                    </Button>
                                </VStack>
                            )}
                        </Drawer.Body>

                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};
