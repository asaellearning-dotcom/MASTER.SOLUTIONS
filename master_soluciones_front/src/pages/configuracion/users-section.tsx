import { UserTable, type UserRow } from "@/components/ui/user-table"
import { UserDetailPanel } from "./UserDetailPanel"
import {
    Box,
    Button,
    CloseButton,
    Dialog,
    Field,
    Icon,
    Input,
    NativeSelect,
    Portal,
    Spinner,
    Text,
} from "@chakra-ui/react"
import axios from "axios";
import { useEffect, useState } from "react";
import { FaUserPlus } from "react-icons/fa6";
import { API_URL } from "@/config";

type PaginationState = {
    page: number;
    pageSize: number;
};

type PaginationMeta = {
    totalRows: number;
    pages: number;
};

type UserRole = {
    id: number;
    code: string;
    name: string;
};

const DEFAULT_PAGINATION: PaginationState = { page: 1, pageSize: 20 };
const MIN_SEARCH_CHARS = 3;

const UserRegisterForm = ({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [documentNumber, setDocumentNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        (async () => {
            try {
                const token = localStorage.getItem('jwtToken');
                const { data } = await axios.get(`${API_URL}/users/roles`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!data.ok) return;

                const nextRoles: UserRole[] = data.roles ?? [];
                setRoles(nextRoles);
                if (nextRoles.length > 0) {
                    setRoleId(String(nextRoles[0].id));
                }
            } catch {
                setError('No se pudieron cargar los roles');
            }
        })();
    }, [isOpen]);

    const clearForm = () => {
        setDocumentNumber('');
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setRoleId(roles[0] ? String(roles[0].id) : '');
        setError('');
    };

    const handleClose = () => {
        clearForm();
        onClose();
    };

    const handleSave = async () => {
        if (!documentNumber.trim() || !fullName.trim() || !email.trim() || !password.trim() || !roleId) {
            setError('Documento, nombre, correo, contraseña y rol son requeridos');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('jwtToken');
            const { data } = await axios.post(
                `${API_URL}/users`,
                {
                    documentNumber: documentNumber.trim(),
                    fullName: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    password: password.trim(),
                    roleId: Number(roleId),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!data.ok) {
                setError(data.message || 'No se pudo guardar el usuario');
                return;
            }

            clearForm();
            onClose();
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error guardando el usuario');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(details) => {
                if (!details.open) handleClose();
            }}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Registrar nuevo usuario</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Box display="flex" flexDirection="column" gap="3">
                                <Field.Root orientation="vertical">
                                    <Field.Label>Documento</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        placeholder="Número de documento"
                                        value={documentNumber}
                                        onChange={(e) => setDocumentNumber(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root orientation="vertical">
                                    <Field.Label>Nombre completo</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        placeholder="Nombre del usuario"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root orientation="vertical">
                                    <Field.Label>Correo electrónico</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        type="email"
                                        placeholder="usuario@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root orientation="vertical">
                                    <Field.Label>Teléfono</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        placeholder="Teléfono"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root orientation="vertical">
                                    <Field.Label>Contraseña</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        type="password"
                                        placeholder="Contraseña de acceso"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root orientation="vertical">
                                    <Field.Label>Rol</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={roleId}
                                            onChange={(e) => setRoleId(e.target.value)}
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

                                {error && (
                                    <Text fontSize="sm" color="red.500" fontWeight="medium">
                                        {error}
                                    </Text>
                                )}
                            </Box>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline" onClick={handleClose}>
                                    Cancelar
                                </Button>
                            </Dialog.ActionTrigger>
                            <Button
                                backgroundColor="blue.500"
                                color="white"
                                onClick={handleSave}
                                loading={saving}
                                disabled={saving}
                            >
                                Guardar
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export const UsersSection = () => {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    const [meta, setMeta] = useState<PaginationMeta>({ totalRows: 0, pages: 1 });
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [licenseUsage, setLicenseUsage] = useState<{ currentUsers: number; maxUsers: number | null }>({
        currentUsers: 0,
        maxUsers: null,
    });

    useEffect(() => {
        getUsers();
    }, [search, pagination.page, pagination.pageSize]);

    const getUsers = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem('jwtToken');
            const params = new URLSearchParams({
                page: String(pagination.page),
                pageSize: String(pagination.pageSize),
            });

            if (search) {
                params.set('search', search);
            }

            const { data } = await axios.get(`${API_URL}/users?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!data.ok) return;

            setUsers(data.users ?? []);
            setMeta({
                totalRows: data.totalRows ?? 0,
                pages: data.pages ?? 1,
            });
            setLicenseUsage({
                currentUsers: data.licenseUsage?.currentUsers ?? 0,
                maxUsers: data.licenseUsage?.maxUsers ?? null,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchText(value);

        const trimmed = value.trim();
        const nextSearch = trimmed.length >= MIN_SEARCH_CHARS ? trimmed : '';

        setSearch(nextSearch);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, page }));
    };

    const handlePageSizeChange = (pageSize: number) => {
        setPagination({ page: 1, pageSize });
    };

    const handleUserCreated = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        if (pagination.page === 1) {
            getUsers();
        }
    };

    const isAtUserLimit =
        licenseUsage.maxUsers != null
        && licenseUsage.currentUsers >= licenseUsage.maxUsers;

    return (
        <div style={{ border: '1px solid blue', height: '100%', display: 'flex', flexDirection: 'column', padding: '.5em', gap: '.5em' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1em', flexWrap: 'wrap' }}>
                <Button
                    backgroundColor={'blue.500'}
                    onClick={() => {
                        if (isAtUserLimit) return;
                        setIsFormOpen(true);
                    }}
                    disabled={isAtUserLimit}
                    title={
                        isAtUserLimit
                            ? 'Se alcanzó el máximo de usuarios de la licencia'
                            : undefined
                    }
                >
                    <Icon color="white" fontSize={'lg'}>
                        <FaUserPlus />
                    </Icon>
                    <span>Nuevo Usuario</span>
                </Button>

                <Text fontSize="sm" color="gray.700" fontWeight="semibold">
                    Usuarios: {licenseUsage.currentUsers}
                    {licenseUsage.maxUsers == null ? '' : ` / ${licenseUsage.maxUsers}`}
                    <Text as="span" color="fg.muted" fontWeight="normal">
                        {' '}(ocupados / máximo licencia)
                    </Text>
                    {isAtUserLimit && (
                        <Text as="span" color="red.500" fontWeight="medium">
                            {' '}· Límite alcanzado
                        </Text>
                    )}
                </Text>
            </div>

            <div>
                <Input
                    type="text"
                    border={'1px solid gray'}
                    placeholder="Buscar nombre o documento (mín. 3 caracteres)"
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            <div style={{ border: '1px solid green' }}>
                {loading ? (
                    <Box
                        height="400px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap="3"
                        borderWidth="1px"
                        rounded="md"
                    >
                        <Spinner size="md" />
                        <Text fontSize="sm">Cargando usuarios...</Text>
                    </Box>
                ) : (
                    <UserTable
                        users={users}
                        pagination={pagination}
                        meta={meta}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onUserSelect={setSelectedUserId}
                    />
                )}
            </div>

            <UserRegisterForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleUserCreated}
            />

            <UserDetailPanel
                userId={selectedUserId}
                onClose={() => setSelectedUserId(null)}
                onUpdated={getUsers}
            />
        </div>
    );
};
