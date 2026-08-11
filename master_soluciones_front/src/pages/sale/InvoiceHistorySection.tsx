import { Table, Pagination, ButtonGroup, IconButton, Input, NativeSelect, HStack, Text } from "@chakra-ui/react"
import axios from "axios";
import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import { InvoiceDetailPanel } from "./InvoiceDetailPanel";
import { API_URL } from "@/config";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

export type InvoiceSummary = {
    createdAt: string;
    customerFullName: string;
    cashierFullName?: string | null;
    invoiceId: number;
    invoiceNumber: string;
    total: string;
}

type PaginationState = {
    page: number;
    pageSize: number;
}

type PaginationMeta = {
    totalRows: number;
    pages: number;
}

const InvoiceHistoryTable = ({
    invoices,
    pagination,
    meta,
    onPageChange,
    onPageSizeChange,
    onInvoiceSelect,
}: {
    invoices: InvoiceSummary[];
    pagination: PaginationState;
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onInvoiceSelect: (invoiceId: number) => void;
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75em' }}>
            <Table.ScrollArea borderWidth="1px" rounded="md" height="400px">
                <Table.Root size="sm" stickyHeader>
                    <Table.Header>
                        <Table.Row bg="bg.subtle">
                            <Table.ColumnHeader>FACTURA</Table.ColumnHeader>
                            <Table.ColumnHeader>FECHA</Table.ColumnHeader>
                            <Table.ColumnHeader>CLIENTE</Table.ColumnHeader>
                            <Table.ColumnHeader>CAJERO</Table.ColumnHeader>
                            <Table.ColumnHeader>TOTAL</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {invoices.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={5}>No hay facturas para mostrar</Table.Cell>
                            </Table.Row>
                        ) : (
                            invoices.map((item) => (
                                <Table.Row key={item.invoiceId}>
                                    <Table.Cell>
                                        <Text
                                            as="button"
                                            color="blue.600"
                                            fontWeight="medium"
                                            textDecoration="underline"
                                            cursor="pointer"
                                            onClick={() => onInvoiceSelect(item.invoiceId)}
                                        >
                                            {item.invoiceNumber}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>{item.createdAt}</Table.Cell>
                                    <Table.Cell>{item.customerFullName}</Table.Cell>
                                    <Table.Cell>{item.cashierFullName || '-'}</Table.Cell>
                                    <Table.Cell>{item.total}</Table.Cell>
                                </Table.Row>
                            ))
                        )}
                    </Table.Body>
                </Table.Root>
            </Table.ScrollArea>

            <HStack justify="space-between" wrap="wrap" gap="3">
                <HStack gap="2">
                    <Text fontSize="sm" whiteSpace="nowrap">Filas por página</Text>
                    <NativeSelect.Root size="sm" width="5rem">
                        <NativeSelect.Field
                            value={String(pagination.pageSize)}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Text fontSize="sm" color="fg.muted">
                        {meta.totalRows} resultado{meta.totalRows === 1 ? '' : 's'}
                    </Text>
                </HStack>

                <Pagination.Root
                    count={meta.totalRows}
                    pageSize={pagination.pageSize}
                    page={pagination.page}
                    onPageChange={(details) => onPageChange(details.page)}
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
        </div>
    );
};

const DEFAULT_PAGINATION: PaginationState = { page: 1, pageSize: 20 };
const MIN_SEARCH_CHARS = 3;

export const InvoiceHistorySection = () => {
    const [invoiceSummaries, setInvoiceSummaries] = useState<InvoiceSummary[]>([]);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    const [meta, setMeta] = useState<PaginationMeta>({ totalRows: 0, pages: 1 });
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
    const API_SALES_URL = `${API_URL}/sales`;

    useEffect(() => {
        getInvoiceSummaries();
    }, [search, pagination.page, pagination.pageSize]);

    const getInvoiceSummaries = async () => {
        const token = localStorage.getItem('jwtToken');
        const params = new URLSearchParams({
            page: String(pagination.page),
            pageSize: String(pagination.pageSize),
        });

        if (search) {
            params.set('search', search);
        }

        const { data } = await axios.get(`${API_SALES_URL}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!data.ok) return;

        setInvoiceSummaries(data.invoices ?? []);
        setMeta({
            totalRows: data.totalRows ?? 0,
            pages: data.pages ?? 1,
        });
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
                    placeholder="Buscar por número o cliente (mín. 3 caracteres)"
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            <div style={{ border: '1px solid green' }}>
                <InvoiceHistoryTable
                    invoices={invoiceSummaries}
                    pagination={pagination}
                    meta={meta}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onInvoiceSelect={setSelectedInvoiceId}
                />
            </div>

            <InvoiceDetailPanel
                invoiceId={selectedInvoiceId}
                onClose={() => setSelectedInvoiceId(null)}
            />
        </div>
    );
};
