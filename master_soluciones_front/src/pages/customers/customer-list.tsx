import { CustomerTable, type CustomerRow } from "@/components/ui/customer-table"
import { Box, Input, Spinner, Text } from "@chakra-ui/react"
import axios from "axios";
import { useEffect, useState } from "react";
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

export const CustomerList = () => {
    const customersURL = `${API_URL}/customers`;
    const [customers, setCustomers] = useState<CustomerRow[]>([]);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    const [meta, setMeta] = useState<PaginationMeta>({ totalRows: 0, pages: 1 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getCustomers();
    }, [search, pagination.page, pagination.pageSize]);

    const getCustomers = async () => {
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

            const { data } = await axios.get(`${customersURL}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!data.ok) return;

            setCustomers(data.customers ?? []);
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

    return (
        <div style={{ border: '1px solid blue', height: '100%', display: 'flex', flexDirection: 'column', padding: '.5em', gap: '.5em' }}>
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
                        <Text fontSize="sm">Cargando clientes...</Text>
                    </Box>
                ) : (
                    <CustomerTable
                        customers={customers}
                        pagination={pagination}
                        meta={meta}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                )}
            </div>
        </div>
    );
};
