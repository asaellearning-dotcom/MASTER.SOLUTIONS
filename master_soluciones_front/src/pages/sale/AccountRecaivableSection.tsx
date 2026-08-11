import { Table, Pagination, ButtonGroup, IconButton, Input, NativeSelect, HStack, Text, Spinner, Box } from "@chakra-ui/react"
import axios from "axios";
import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import { AccountReceivablePanel } from "./AccountReceivablePanel";
import { API_URL } from "@/config";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;
const MIN_SEARCH_CHARS = 3;
const DEFAULT_PAGINATION = { page: 1, pageSize: 10 };

export type CreditInvoiceStatus = "PAGADO" | "DEUDA";

export type CreditInvoiceSummary = {
    invoiceId: number;
    invoiceNumber: string;
    customerFullName: string;
    status: CreditInvoiceStatus;
    total: number;
    remain: number;
    amountPaid: number;
    lastPaymentAt: string | null;
    paymentCount: number;
};

type PaginationState = {
    page: number;
    pageSize: number;
};

type PaginationMeta = {
    totalRows: number;
    pages: number;
};

const formatMoney = (value: number) =>
    `$ ${Number(value).toLocaleString("es-CO")}`;

const AccountReceivableTable = ({
    invoices,
    pagination,
    meta,
    onPageChange,
    onPageSizeChange,
    onInvoiceSelect,
}: {
    invoices: CreditInvoiceSummary[];
    pagination: PaginationState;
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onInvoiceSelect: (invoice: CreditInvoiceSummary) => void;
}) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75em" }}>
            <Table.ScrollArea borderWidth="1px" rounded="md" height="400px">
                <Table.Root size="sm" stickyHeader>
                    <Table.Header>
                        <Table.Row bg="bg.subtle">
                            <Table.ColumnHeader>FACTURA</Table.ColumnHeader>
                            <Table.ColumnHeader>CLIENTE</Table.ColumnHeader>
                            <Table.ColumnHeader>ESTADO</Table.ColumnHeader>
                            <Table.ColumnHeader>VALOR A PAGAR</Table.ColumnHeader>
                            <Table.ColumnHeader>SALDO PENDIENTE</Table.ColumnHeader>
                            <Table.ColumnHeader>MONTO PAGADO</Table.ColumnHeader>
                            <Table.ColumnHeader>ULTIMO PAGO</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {invoices.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={7}>No hay facturas de crédito para mostrar</Table.Cell>
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
                                            onClick={() => onInvoiceSelect(item)}
                                        >
                                            {item.invoiceNumber}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>{item.customerFullName}</Table.Cell>
                                    <Table.Cell>
                                        <Text
                                            color={item.status === "DEUDA" ? "red.600" : "green.600"}
                                            fontWeight="medium"
                                        >
                                            {item.status}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>{formatMoney(item.total)}</Table.Cell>
                                    <Table.Cell>{formatMoney(item.remain)}</Table.Cell>
                                    <Table.Cell>{formatMoney(item.amountPaid)}</Table.Cell>
                                    <Table.Cell>{item.lastPaymentAt ?? "—"}</Table.Cell>
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
                        {meta.totalRows} resultado{meta.totalRows === 1 ? "" : "s"}
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

export const AccountReceivableSection = () => {
    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    const [rows, setRows] = useState<CreditInvoiceSummary[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ totalRows: 0, pages: 1 });
    const [selectedInvoice, setSelectedInvoice] = useState<CreditInvoiceSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const CREDIT_API_URL = `${API_URL}/sales/credit`;

    useEffect(() => {
        getCreditInvoices();
    }, [search, pagination.page, pagination.pageSize]);

    const getCreditInvoices = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem("jwtToken");
            const params = new URLSearchParams({
                page: String(pagination.page),
                pageSize: String(pagination.pageSize),
            });

            if (search) {
                params.set("search", search);
            }

            const { data } = await axios.get(`${CREDIT_API_URL}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!data.ok) return;

            setRows(data.invoices ?? []);
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
        const nextSearch = trimmed.length >= MIN_SEARCH_CHARS ? trimmed : "";

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
        <div style={{ border: "1px solid blue", height: "100%", display: "flex", flexDirection: "column", padding: ".5em", gap: ".5em" }}>
            <div>
                <Input
                    type="text"
                    border={"1px solid gray"}
                    placeholder="Buscar por número o cliente (mín. 3 caracteres)"
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            <div style={{ border: "1px solid green" }}>
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
                        <Text fontSize="sm">Cargando facturas de crédito...</Text>
                    </Box>
                ) : (
                    <AccountReceivableTable
                        invoices={rows}
                        pagination={pagination}
                        meta={meta}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onInvoiceSelect={setSelectedInvoice}
                    />
                )}
            </div>

            <AccountReceivablePanel
                invoice={selectedInvoice}
                paymentCount={selectedInvoice?.paymentCount ?? 0}
                onClose={() => setSelectedInvoice(null)}
                onPaymentSaved={getCreditInvoices}
            />
        </div>
    );
};
