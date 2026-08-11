import { ProductTable, type ProductRow } from "@/components/ui/product-table"
import {
    Box,
    Button,
    CloseButton,
    Dialog,
    Field,
    Icon,
    Input,
    Portal,
    Spinner,
    Text,
} from "@chakra-ui/react"
import axios from "axios";
import { useEffect, useState } from "react";
import { FaBoxOpen } from "react-icons/fa6"
import { API_URL } from "@/config";

type PaginationState = {
    page: number;
    pageSize: number;
};

type PaginationMeta = {
    totalRows: number;
    pages: number;
};

const DEFAULT_PAGINATION: PaginationState = { page: 1, pageSize: 20 };
const MIN_SEARCH_CHARS = 3;

const ProductRegisterForm = ({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [customCode, setCustomCode] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [price, setPrice] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const clearForm = () => {
        setCustomCode('');
        setName('');
        setQuantity('');
        setUnitCost('');
        setPrice('');
        setError('');
    };

    const handleClose = () => {
        clearForm();
        onClose();
    };

    const handleSave = async () => {
        if (!customCode.trim() || !name.trim()) {
            setError('Código y nombre son requeridos');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('jwtToken');
            const { data } = await axios.post(
                `${API_URL}/products`,
                {
                    customCode: customCode.trim(),
                    name: name.trim(),
                    quantity: Number(quantity || 0),
                    unitCost: Number(unitCost || 0),
                    price: Number(price || 0),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!data.ok) {
                setError(data.message || 'No se pudo crear el producto');
                return;
            }

            clearForm();
            onClose();
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error creando el producto');
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
                            <Dialog.Title>Nuevo producto</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Box display="flex" flexDirection="column" gap="3">
                                <Field.Root>
                                    <Field.Label>Código</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        placeholder="Código del producto"
                                        value={customCode}
                                        onChange={(e) => setCustomCode(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Nombre</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        placeholder="Nombre del producto"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Cantidad</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        type="number"
                                        placeholder="Cantidad inicial"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Costo unitario</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        type="number"
                                        placeholder="Costo unitario"
                                        value={unitCost}
                                        onChange={(e) => setUnitCost(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Precio</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        type="number"
                                        placeholder="Precio de venta"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
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

export const ProductList = () => {
    const productsURL = `${API_URL}/products`;
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    const [meta, setMeta] = useState<PaginationMeta>({ totalRows: 0, pages: 1 });
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        getProducts();
    }, [search, pagination.page, pagination.pageSize]);

    const getProducts = async () => {
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

            const { data } = await axios.get(`${productsURL}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!data.ok) return;

            setProducts(data.products ?? []);
            setMeta({
                totalRows: data.totalRows ?? 0,
                pages: data.pages ?? 1,
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

    const handleProductCreated = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        if (pagination.page === 1) {
            getProducts();
        }
    };

    return (
        <div style={{ border: '1px solid blue', height: '100%', display: 'flex', flexDirection: 'column', padding: '.5em', gap: '.5em' }}>
            <div>
                <Button backgroundColor={'blue.500'} onClick={() => setIsFormOpen(true)}>
                    <Icon color="white" fontSize={'lg'}>
                        <FaBoxOpen />
                    </Icon>
                    <span>Nuevo Producto</span>
                </Button>
            </div>

            <div>
                <Input
                    type="text"
                    border={'1px solid gray'}
                    placeholder="Buscar código o nombre (mín. 3 caracteres)"
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
                        <Text fontSize="sm">Cargando productos...</Text>
                    </Box>
                ) : (
                    <ProductTable
                        products={products}
                        pagination={pagination}
                        meta={meta}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                )}
            </div>

            <ProductRegisterForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleProductCreated}
            />
        </div>
    );
};
