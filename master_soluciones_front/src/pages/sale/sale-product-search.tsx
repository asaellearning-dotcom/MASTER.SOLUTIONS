import {
    Box,
    ButtonGroup,
    IconButton,
    Input,
    Pagination,
    Spinner,
    Text,
    HStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { SaleProductItem } from "./sale-product-item";
import type { Product } from "../types";
import { API_URL } from "@/config";

type PaginationState = {
    page: number;
    pageSize: number;
};

type PaginationMeta = {
    totalRows: number;
    pages: number;
};

const PAGE_SIZE = 100;
const MIN_SEARCH_CHARS = 3;
const DEFAULT_PAGINATION: PaginationState = { page: 1, pageSize: PAGE_SIZE };

export const SaleProductSearch = () => {
    const productsURL = `${API_URL}/products`;

    const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    const [meta, setMeta] = useState<PaginationMeta>({ totalRows: 0, pages: 1 });
    const [loading, setLoading] = useState(false);

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

            setSearchedProducts(data.products ?? []);
            setMeta({
                totalRows: data.totalRows ?? 0,
                pages: data.pages ?? 1,
            });
        } catch (error) {
            console.error(error);
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

    return (
        <div style={{
            borderRight: '0px solid pink',
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            padding: '.3em',
        }}>
            <div>
                <Box p="1" border="none" borderColor="gray.100" marginBottom={'3.5'}>
                    <Input
                        placeholder="Buscar código o nombre..."
                        _placeholder={{ color: ' #111827' }}
                        color=" #111827"
                        border={'1px solid #D1D5DB'}
                        value={searchText}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        bg={'#FFFFFF'}
                        fontSize={'md'}
                    />
                </Box>
            </div>

            <div style={{
                height: '100%',
                overflow: 'scroll',
                display: 'flex',
                flexDirection: 'column',
                gap: '.5em',
            }}>
                {loading ? (
                    <Box
                        flex="1"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap="3"
                    >
                        <Spinner size="md" />
                        <Text fontSize="sm">Cargando productos...</Text>
                    </Box>
                ) : (
                    <>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {searchedProducts.map((p, index) => (
                                <SaleProductItem
                                    key={p.id}
                                    index={index}
                                    product={p}
                                />
                            ))}
                        </div>

                        {meta.totalRows > pagination.pageSize && (
                            <HStack justify="space-between" wrap="wrap" gap="3" padding=".25em">
                                <Text fontSize="sm" color="fg.muted">
                                    {meta.totalRows} producto{meta.totalRows === 1 ? '' : 's'}
                                </Text>

                                <Pagination.Root
                                    count={meta.totalRows}
                                    pageSize={pagination.pageSize}
                                    page={pagination.page}
                                    onPageChange={(details) => handlePageChange(details.page)}
                                >
                                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                                        <Pagination.PrevTrigger asChild>
                                            <IconButton aria-label="Página anterior">
                                                <LuChevronLeft />
                                            </IconButton>
                                        </Pagination.PrevTrigger>

                                        <Pagination.Items
                                            render={(page) => (
                                                <IconButton
                                                    variant={{ base: "ghost", _selected: "outline" }}
                                                    aria-label={`Página ${page.value}`}
                                                >
                                                    {page.value}
                                                </IconButton>
                                            )}
                                        />

                                        <Pagination.NextTrigger asChild>
                                            <IconButton aria-label="Página siguiente">
                                                <LuChevronRight />
                                            </IconButton>
                                        </Pagination.NextTrigger>
                                    </ButtonGroup>
                                </Pagination.Root>
                            </HStack>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
