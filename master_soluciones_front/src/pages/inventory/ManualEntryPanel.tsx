import {
    Button,
    CloseButton,
    Drawer,
    Field,
    Input,
    Portal,
    Text,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { API_URL } from "@/config";

type ManualEntryPanelProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export const ManualEntryPanel = ({ open, onClose, onSuccess }: ManualEntryPanelProps) => {
    const [customCode, setCustomCode] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const clearForm = () => {
        setCustomCode('');
        setQuantity('');
        setUnitCost('');
        setError('');
    };

    const handleClose = () => {
        clearForm();
        onClose();
    };

    const handleSave = async () => {
        if (!customCode.trim()) {
            setError('Código de producto es requerido');
            return;
        }

        const parsedQuantity = Number(quantity || 0);
        const parsedUnitCost = Number(unitCost || 0);

        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            setError('Cantidad inválida');
            return;
        }

        if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) {
            setError('Costo unitario inválido');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('jwtToken');
            const { data } = await axios.post(
                `${API_URL}/entries`,
                {
                    customCode: customCode.trim(),
                    quantity: parsedQuantity,
                    unitCost: parsedUnitCost,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!data.ok) {
                setError(data.message || 'No se pudo registrar la entrada');
                return;
            }

            clearForm();
            onClose();
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error registrando la entrada');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer.Root
            open={open}
            placement="end"
            onOpenChange={(details) => {
                if (!details.open) handleClose();
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
                            <Drawer.Title>Entrada manual</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body flex="1" minH="0" overflowY="auto" py="4">
                            <VStack align="stretch" gap="4">
                                <Field.Root>
                                    <Field.Label>Código</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        placeholder="Código del producto"
                                        value={customCode}
                                        onChange={(e) => {
                                            setCustomCode(e.target.value);
                                            setError('');
                                        }}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Cantidad</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        type="number"
                                        placeholder="Cantidad a ingresar"
                                        value={quantity}
                                        onChange={(e) => {
                                            setQuantity(e.target.value);
                                            setError('');
                                        }}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Costo unitario</Field.Label>
                                    <Input
                                        border="1px solid gray"
                                        type="number"
                                        placeholder="Costo unitario"
                                        value={unitCost}
                                        onChange={(e) => {
                                            setUnitCost(e.target.value);
                                            setError('');
                                        }}
                                    />
                                </Field.Root>

                                {error && (
                                    <Text fontSize="sm" color="red.500" fontWeight="medium">
                                        {error}
                                    </Text>
                                )}

                                <Button
                                    backgroundColor="blue.500"
                                    color="white"
                                    onClick={handleSave}
                                    loading={saving}
                                    disabled={saving}
                                >
                                    Guardar entrada
                                </Button>
                            </VStack>
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
