import {
    Box,
    Button,
    CloseButton,
    Dialog,
    Drawer,
    Field,
    HStack,
    Input,
    NativeSelect,
    Portal,
    Spinner,
    Tabs,
    Text,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import type { CreditInvoiceSummary } from "./AccountRecaivableSection";
import { API_URL } from "@/config";

type PaymentMethodInfo = {
    id: number;
    code: string;
    name: string;
    description: string;
};

type InvoicePayment = {
    id: number;
    paymentDate: string;
    amountPaid: number;
    paymentMethod: PaymentMethodInfo;
};

type AccountReceivablePanelProps = {
    invoice: CreditInvoiceSummary | null;
    paymentCount?: number;
    onClose: () => void;
    onPaymentSaved?: () => void;
};

const ABONO_PAYMENT_OPTIONS = [
    { code: "CASH", label: "Efectivo" },
    { code: "TRANSFER", label: "Transferencia (Nequi/Banco)" },
    { code: "CARD", label: "Tarjeta (Datáfono)" },
] as const;

const ERROR_MESSAGE =
    "Hubo problema en el registro del pago. Intentalo mas tarde o contacta al administrador";

const formatMoney = (value: number) =>
    `$ ${Number(value).toLocaleString("es-CO")}`;

const MessageDialog = ({
    open,
    title,
    message,
    onClose,
}: {
    open: boolean;
    title: string;
    message: string;
    onClose: () => void;
}) => (
    <Dialog.Root open={open} onOpenChange={(details) => { if (!details.open) onClose(); }}>
        <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>{title}</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Text>{message}</Text>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button onClick={onClose}>Aceptar</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                        <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog.Root>
);

const PaymentsTab = ({ invoiceId }: { invoiceId: number }) => {
    const [payments, setPayments] = useState<InvoicePayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const CREDIT_API_URL = `${API_URL}/sales/credit`;

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            setError(false);
            setPayments([]);

            try {
                const token = localStorage.getItem("jwtToken");
                const { data } = await axios.get(`${CREDIT_API_URL}/${invoiceId}/payments`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!data.ok) {
                    setError(true);
                    return;
                }

                setPayments(data.payments ?? []);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [invoiceId]);

    if (loading) {
        return (
            <HStack justify="center" py="8" gap="3">
                <Spinner size="sm" />
                <Text fontSize="sm">Cargando pagos...</Text>
            </HStack>
        );
    }

    if (error) {
        return (
            <Text fontSize="sm" color="fg.error">
                No se pudieron cargar los pagos de esta factura.
            </Text>
        );
    }

    return (
        <Box
            flex="1"
            minH="0"
            overflowY="auto"
            display="flex"
            flexDirection="column"
            gap="3"
            borderWidth="1px"
            rounded="md"
            p="3"
        >
            {payments.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">Sin abonos registrados</Text>
            ) : (
                payments.map((payment) => (
                    <Box
                        key={payment.id}
                        display="flex"
                        flexDirection="column"
                        gap="1"
                        borderBottomWidth="1px"
                        pb="3"
                        flexShrink={0}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap="3">
                            <Text fontSize="sm" fontWeight="medium">
                                {payment.paymentMethod.name}
                            </Text>
                            <Text fontSize="sm" fontWeight="semibold" whiteSpace="nowrap">
                                {formatMoney(payment.amountPaid)}
                            </Text>
                        </Box>
                        <Box>
                            <Text fontSize="sm" color="fg.muted">
                                {payment.paymentDate}
                            </Text>
                        </Box>
                    </Box>
                ))
            )}
        </Box>
    );
};

const AbonarTab = ({
    invoiceId,
    remain,
    onCancel,
    onPaymentSaved,
}: {
    invoiceId: number;
    remain: number;
    onCancel: () => void;
    onPaymentSaved?: () => void;
}) => {
    const [amount, setAmount] = useState("");
    const [paymentMethodCode, setPaymentMethodCode] = useState("CASH");
    const [saving, setSaving] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const CREDIT_API_URL = `${API_URL}/sales/credit`;

    useEffect(() => {
        setAmount("");
        setPaymentMethodCode("CASH");
        setSaving(false);
        setSuccessOpen(false);
        setErrorOpen(false);
    }, [invoiceId, remain]);

    const handleSave = async () => {
        const amountPaid = Number(amount);

        if (!Number.isFinite(amountPaid) || amountPaid <= 0 || amountPaid > remain) {
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem("jwtToken");
            const { data } = await axios.post(
                `${CREDIT_API_URL}/${invoiceId}`,
                {
                    paymentMethod: paymentMethodCode,
                    amountPaid,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!data.ok) {
                setErrorOpen(true);
                return;
            }

            setAmount("");
            setPaymentMethodCode("CASH");
            setSuccessOpen(true);
            onPaymentSaved?.();
        } catch {
            setErrorOpen(true);
        } finally {
            setSaving(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessOpen(false);
        onCancel();
    };

    return (
        <>
            <VStack align="stretch" gap="5" pt="2" position="relative">
                {saving && (
                    <Box
                        position="absolute"
                        inset="0"
                        bg="whiteAlpha.800"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        gap="3"
                        zIndex="1"
                    >
                        <Spinner size="lg" />
                        <Text fontSize="sm">Registrando pago...</Text>
                    </Box>
                )}

                <Box>
                    <Text fontSize="sm" fontWeight="semibold" letterSpacing="wide">
                        SALDO PENDIENTE
                    </Text>
                    <Text color="red.600" fontSize="2xl" fontWeight="bold" mt="1">
                        {formatMoney(remain)}
                    </Text>
                </Box>

                <Field.Root>
                    <Field.Label>MONTO A ABONAR</Field.Label>
                    <Input
                        type="number"
                        placeholder="$ 0"
                        border="1px solid gray"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        autoComplete="off"
                        disabled={saving}
                    />
                </Field.Root>

                <Field.Root>
                    <Field.Label>MÉTODO DE PAGO</Field.Label>
                    <NativeSelect.Root size="md" disabled={saving}>
                        <NativeSelect.Field
                            value={paymentMethodCode}
                            onChange={(e) => setPaymentMethodCode(e.target.value)}
                        >
                            {ABONO_PAYMENT_OPTIONS.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.label}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Field.Root>

                <HStack justify="flex-end" gap="3" pt="2">
                    <Button variant="outline" onClick={onCancel} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        Guardar
                    </Button>
                </HStack>
            </VStack>

            <MessageDialog
                open={successOpen}
                title="Pago registrado"
                message="El pago se guardó correctamente."
                onClose={handleSuccessClose}
            />

            <MessageDialog
                open={errorOpen}
                title="Error"
                message={ERROR_MESSAGE}
                onClose={() => setErrorOpen(false)}
            />
        </>
    );
};

export const AccountReceivablePanel = ({
    invoice,
    paymentCount = 0,
    onClose,
    onPaymentSaved,
}: AccountReceivablePanelProps) => {
    const canAbonar = invoice != null && invoice.status !== "PAGADO" && invoice.remain > 0;

    return (
        <Drawer.Root
            open={invoice != null}
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
                                {invoice?.invoiceNumber ?? "Cartera"}
                            </Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body
                            flex="1"
                            minH="0"
                            display="flex"
                            flexDirection="column"
                            overflow="hidden"
                            py="4"
                        >
                            {invoice && (
                                <Tabs.Root
                                    key={invoice.invoiceId}
                                    defaultValue="pagos"
                                    display="flex"
                                    flexDirection="column"
                                    flex="1"
                                    minH="0"
                                    variant="line"
                                >
                                    <Tabs.List flexShrink={0} mb="4">
                                        <Tabs.Trigger value="pagos">
                                            PAGOS ({paymentCount})
                                        </Tabs.Trigger>
                                        {canAbonar && (
                                            <Tabs.Trigger value="abonar">Abonar</Tabs.Trigger>
                                        )}
                                    </Tabs.List>

                                    <Tabs.Content
                                        value="pagos"
                                        flex="1"
                                        minH="0"
                                        display="flex"
                                        flexDirection="column"
                                        overflow="hidden"
                                        p="0"
                                    >
                                        <PaymentsTab invoiceId={invoice.invoiceId} />
                                    </Tabs.Content>

                                    {canAbonar && (
                                        <Tabs.Content value="abonar" p="0">
                                            <AbonarTab
                                                invoiceId={invoice.invoiceId}
                                                remain={invoice.remain}
                                                onCancel={onClose}
                                                onPaymentSaved={onPaymentSaved}
                                            />
                                        </Tabs.Content>
                                    )}
                                </Tabs.Root>
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
