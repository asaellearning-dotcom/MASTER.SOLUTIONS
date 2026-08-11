import { Table, Text, Pagination, ButtonGroup, IconButton, NativeSelect, HStack } from "@chakra-ui/react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import { formatCOP } from "@/utils/format"

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 100] as const;

export type ProductRow = {
    id: number;
    customCode: string;
    name: string;
    // saleUnit: string;
    stock: number;
    price: number | string;
};

type PaginationState = {
    page: number;
    pageSize: number;
};

type PaginationMeta = {
    totalRows: number;
    pages: number;
};

export const ProductTable = ({
    products,
    pagination,
    meta,
    onPageChange,
    onPageSizeChange,
}: {
    products: ProductRow[];
    pagination: PaginationState;
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75em' }}>
            <Table.ScrollArea borderWidth="1px" rounded="md" height="400px">
                <Table.Root size="sm" stickyHeader>
                    <Table.Header>
                        <Table.Row bg="bg.subtle">
                            <Table.ColumnHeader>CÓDIGO</Table.ColumnHeader>
                            <Table.ColumnHeader>NOMBRE</Table.ColumnHeader>
                            {/* <Table.ColumnHeader>UNIDAD DE VENTA</Table.ColumnHeader> */}
                            <Table.ColumnHeader>STOCK</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="end">PRECIO</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {products.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={4}>
                                    <Text>No hay productos para mostrar</Text>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            products.map((item) => (
                                <Table.Row key={item.id}>
                                    <Table.Cell>{item.customCode}</Table.Cell>
                                    <Table.Cell>{item.name}</Table.Cell>
                                    {/* <Table.Cell>{item.saleUnit}</Table.Cell> */}
                                    <Table.Cell>{item.stock}</Table.Cell>
                                    <Table.Cell textAlign="end">{formatCOP(item.price)}</Table.Cell>
                                </Table.Row>
                            ))
                        )}
                    </Table.Body>
                </Table.Root>
            </Table.ScrollArea>

            <HStack justify="space-between" wrap="wrap" gap="3">
                <HStack gap="2">
                    <Text fontSize="sm" whiteSpace="nowrap">Filas por página</Text>
                    <NativeSelect.Root size="sm" width="5.5rem">
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
