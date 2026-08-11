import {
    Box,
    CloseButton,
    Drawer,
    HStack,
    Portal,
    Separator,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState, type ReactNode } from "react";
import type { Invoice } from "./sale-cart";
import { API_URL } from "@/config";

type InvoiceDetailPanelProps = {
    invoiceId: number | null;
    onClose: () => void;
};

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <Box>
        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
            {label}
        </Text>
        <Text fontSize="sm" fontWeight="medium" mt="0.5">
            {value}
        </Text>
    </Box>
);

export const InvoiceDetailPanel = ({ invoiceId, onClose }: InvoiceDetailPanelProps) => {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const DETAIL_URL = `${API_URL}/sales/detail`;

    useEffect(() => {
        if (invoiceId == null) {
            setInvoice(null);
            setError(null);
            return;
        }

        const fetchInvoiceDetail = async () => {
            setLoading(true);
            setError(null);
            setInvoice(null);

            try {
                const token = localStorage.getItem("jwtToken");
                const { data } = await axios.get(`${DETAIL_URL}?invoiceId=${invoiceId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!data.ok) {
                    setError("No se pudo cargar el detalle de la factura");
                    return;
                }

                setInvoice(data.invoice);
            } catch {
                setError("Error al obtener el detalle de la factura");
            } finally {
                setLoading(false);
            }
        };

        fetchInvoiceDetail();
    }, [invoiceId]);

    return (
        <Drawer.Root
            open={invoiceId != null}
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
                            <Drawer.Title>
                                {invoice?.invoiceNumber ?? "Detalle de factura"}
                            </Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body
                            flex="1"
                            minH="0"
                            display="flex"
                            flexDirection="column"
                            overflowY="auto"
                            gap="4"
                            py="4"
                        >
                            {loading && (
                                <HStack justify="center" py="8">
                                    <Spinner size="sm" />
                                    <Text fontSize="sm">Cargando detalle...</Text>
                                </HStack>
                            )}

                            {error && !loading && (
                                <Text color="fg.error" fontSize="sm">{error}</Text>
                            )}

                            {invoice && !loading && (
                                <>
                                    <VStack align="stretch" gap="3" flexShrink={0}>
                                        <DetailRow label="Fecha" value={invoice.createdAt} />
                                        <DetailRow
                                            label="Negocio"
                                            value={`${invoice.business.name} · ${invoice.business.businessNumberType} ${invoice.business.businessNumber}`}
                                        />
                                        <DetailRow
                                            label="Cliente"
                                            value={`${invoice.customer.fullName} · Doc. ${invoice.customer.documentId}`}
                                        />
                                        <DetailRow
                                            label="Cajero"
                                            value={invoice.cashier?.fullName || '-'}
                                        />
                                        <DetailRow
                                            label="Método de pago"
                                            value={invoice.paymentMethod.name}
                                        />

                                        {invoice.paymentMethod.code === "CASH" && (
                                            <>
                                                <DetailRow
                                                    label="Recibido"
                                                    value={`$ ${invoice.amountReceived}`}
                                                />
                                                <DetailRow
                                                    label="Cambio"
                                                    value={`$ ${invoice.changeGiven}`}
                                                />
                                            </>
                                        )}

                                        {invoice.isCredit && (
                                            <DetailRow
                                                label="Saldo pendiente"
                                                value={`$ ${invoice.remain}`}
                                            />
                                        )}

                                        <DetailRow
                                            label="Total"
                                            value={
                                                <Text fontSize="lg" fontWeight="bold">
                                                    $ {invoice.total}
                                                </Text>
                                            }
                                        />
                                    </VStack>

                                    <Separator flexShrink={0} />

                                    <Box
                                        flex="1"
                                        minH="180px"
                                        display="flex"
                                        flexDirection="column"
                                        gap="2"
                                    >
                                        <Text
                                            fontSize="xs"
                                            color="fg.muted"
                                            textTransform="uppercase"
                                            letterSpacing="wide"
                                            flexShrink={0}
                                        >
                                            Productos
                                        </Text>

                                        <Box
                                            flex="1"
                                            minH="0"
                                            overflowY="auto"
                                            borderWidth="1px"
                                            rounded="md"
                                            p="2"
                                        >
                                            {invoice.details.length === 0 ? (
                                                <Text fontSize="sm" color="fg.muted">
                                                    Sin productos
                                                </Text>
                                            ) : (
                                                <VStack align="stretch" gap="2">
                                                    {invoice.details.map((item, index) => (
                                                        <HStack
                                                            key={`${item.productName}-${index}`}
                                                            justify="space-between"
                                                            align="start"
                                                            py="2"
                                                            borderBottomWidth={
                                                                index < invoice.details.length - 1
                                                                    ? "1px"
                                                                    : "0"
                                                            }
                                                        >
                                                            <Box>
                                                                <Text fontSize="sm" fontWeight="medium">
                                                                    {item.productName}
                                                                </Text>
                                                                <Text fontSize="xs" color="fg.muted">
                                                                    Cant: {item.quantity}
                                                                </Text>
                                                            </Box>
                                                            <Text fontSize="sm" fontWeight="semibold" whiteSpace="nowrap">
                                                                $ {item.subtotal}
                                                            </Text>
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            )}
                                        </Box>
                                    </Box>
                                </>
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
