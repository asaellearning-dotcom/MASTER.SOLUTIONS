import { ProductTable } from "@/components/ui/product-table"
import { Box, Button, Heading, Icon, Input, Field, Text, Table, Menu, Portal, type FileUploadFileChangeDetails, Pagination, ButtonGroup, IconButton, NativeSelect, HStack, Spinner  } from "@chakra-ui/react"
import { FaBoxOpen, FaTruckRampBox } from "react-icons/fa6"



import { CloseButton, Dialog } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"



import {  FileUpload } from "@chakra-ui/react"
import { LuUpload } from "react-icons/lu"
import axios from "axios"
import { API_URL } from "@/config"
import { formatCOP, formatDateTime } from "@/utils/format"
import { ManualEntryPanel } from "./ManualEntryPanel"

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 100] as const;
const DEFAULT_PAGINATION = { page: 1, pageSize: 20 };
const MIN_SEARCH_CHARS = 3;

const UploadInput = ({emitFile}: {emitFile: (file: File) => void}) => {

    const handleUloadedFile = (details: FileUploadFileChangeDetails) =>{
        const file: File = details.acceptedFiles[0];
        emitFile(file);
    }

    return (
    <FileUpload.Root maxW="xl" alignItems="stretch" maxFiles={1} onFileChange={handleUloadedFile}>
        <FileUpload.HiddenInput />
            <FileUpload.Dropzone>
                <Icon size="md" color="fg.muted">
                    <LuUpload />
                </Icon>
                <FileUpload.DropzoneContent>
                    <Box>Arrastra y suelta el archivo aqui</Box>
                    <Box color="fg.muted">.xlsx up to 5MB</Box>
                </FileUpload.DropzoneContent>
             </FileUpload.Dropzone>
        <FileUpload.List clearable  />
    </FileUpload.Root>
    )
}

const TemplateUploadForm = ({ isOpen, onClose, onSuccess }: {isOpen:boolean, onClose:()=> void, onSuccess?: () => void}) => {
    const [file, setFile] = useState<File|null>(null)
    const [disableButton, setDisableButton] = useState(true);
    const onFile = (file: File) => {
        if (!file) {
            setDisableButton(true);
            return;
        }
        console.log('File came succesfully: ', file);
        setFile(file);
        setDisableButton(false);
    };

    const closeForm = () => {
   
        setDisableButton(true);
        setFile(null);
        onClose();
    };

    const sendFile = async () => {

        try {
            if (!file) {
                console.error("No file selected");
                return;
            }

            const form = new FormData();

            form.append('archivo_excel', file);
            console.log('Form: ', Object.fromEntries(form));

            const url = `${API_URL}/products/bulk`;
            const token = localStorage.getItem('jwtToken');
            const respnse = await axios.post(url, form, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log(respnse)
            if(respnse.data.ok) {
                closeForm();
                onSuccess?.();
            };
        } catch (error) {
            console.log('Error', error)
        }
    };

    return (
    <Dialog.Root open={isOpen} onOpenChange={closeForm}>
        <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>Carga la plantilla de Excel</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <UploadInput emitFile={onFile}  />
                </Dialog.Body>
                <Dialog.Footer>
                    <Dialog.ActionTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                    </Dialog.ActionTrigger>
                    <Button disabled={disableButton} onClick={sendFile} >Cargar</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                    <CloseButton size="sm" />
                </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog.Root>
    )
}

const Demo = (props: {
    downloadTemplate: () => void
    onUploadSuccess?: () => void
    onManualOpen?: () => void
}) => {

    const { downloadTemplate, onUploadSuccess, onManualOpen } = props;
    const [isOPen, setIsOpen] = useState(false);

    return (<>

        <Menu.Root>
            <Menu.Trigger asChild>
            <Button 
                // variant="outline" 
                size="sm"
            >
                Registrar Entrada
            </Button>
            </Menu.Trigger>
            <Portal>
            <Menu.Positioner>
                <Menu.Content>
                <Menu.Item value="manual" onClick={() => { onManualOpen?.() }}>
                    Manual
                </Menu.Item>
                <Menu.Item value="export" onClick={() => {setIsOpen(true)}}>
                    Subir Excel
                </Menu.Item>
                <Menu.Item
                    value="delete"
                    onClick={downloadTemplate}
                //   color="fg.error"
                //   _hover={{ bg: "bg.error", color: "fg.error" }}
                >
                    Descargar plantilla
                </Menu.Item>
                </Menu.Content>
            </Menu.Positioner>
            </Portal>
        </Menu.Root>

        <TemplateUploadForm
            isOpen={isOPen}
            onClose={() => {
                console.log('CERRENADO')
                setIsOpen(false)
            }}
            onSuccess={onUploadSuccess}
        />

    </>)
}



export const ProductManage = () => {
    const entriesURL = `${API_URL}/entries`;
    const [entries, setEntries] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [meta, setMeta] = useState({ totalRows: 0, pages: 1 });
    const [loading, setLoading] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);

    const downloadTemplate = () => {
        const link = document.createElement("a");
        link.href = "/template_01.xlsx"; // Path in your public folder
        link.download = "Plantilla.xlsx";
        link.click();
    };

    useEffect(() => {
        getEntries();
    }, [search, pagination.page, pagination.pageSize]);

    const getEntries = async () => {
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

            const { data } = await axios.get(`${entriesURL}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!data.ok) return;

            setEntries(data.entries ?? []);
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

    const refreshEntries = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        if (pagination.page === 1) {
            getEntries();
        }
    };

    return <>
    
        <div style={{padding: '.8em'}}>
                    
           <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} >
                <Heading color={'black'} padding={'3.5'} fontFamily={'sans-serif'} fontWeight={'bold'}>

                    <Icon fontSize={'lg'} marginRight={'2.5'}>
                        <FaTruckRampBox />
                    </Icon>
                    <span>Últimas Entradas</span>
                </Heading>

                <Box>
                   <div style={{marginRight: '1em'}}>
                     <Demo 
                        downloadTemplate={downloadTemplate}
                        onManualOpen={() => setIsManualOpen(true)}
                        onUploadSuccess={refreshEntries}
                     />
                   </div>
                </Box>
           </Box>

            <Box marginTop={'1em'} display="flex" flexDirection="column" gap="0.75em">
                <Input
                    type="text"
                    border={'1px solid gray'}
                    placeholder="Buscar código o nombre (mín. 3 caracteres)"
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />

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
                        <Text fontSize="sm">Cargando entradas...</Text>
                    </Box>
                ) : (
                    <>
                        <Table.ScrollArea borderWidth="1px" rounded="md" height="400px">
                            <Table.Root size="sm" stickyHeader>
                                <Table.Header>
                                    <Table.Row bg="bg.subtle">
                                        <Table.ColumnHeader>FECHA</Table.ColumnHeader>
                                        <Table.ColumnHeader>PRODUCTO</Table.ColumnHeader>
                                        <Table.ColumnHeader>CÓDIGO</Table.ColumnHeader>
                                        <Table.ColumnHeader>CANTIDAD</Table.ColumnHeader>
                                        {/* <Table.ColumnHeader>UNIDADES POR EMPAQUE</Table.ColumnHeader> */}
                                        <Table.ColumnHeader>STOCK ANTERIOR</Table.ColumnHeader>
                                        <Table.ColumnHeader>STOCK RESULTANTE</Table.ColumnHeader>
                                        {/* <Table.ColumnHeader>COSTO POR EMPAQUE</Table.ColumnHeader> */}
                                        <Table.ColumnHeader>COSTO UNITARIO</Table.ColumnHeader>
                                        <Table.ColumnHeader>INVERSIÓN TOTAL</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>

                                <Table.Body>
                                    {entries.length === 0 ? (
                                        <Table.Row>
                                            <Table.Cell colSpan={8}>No hay entradas para mostrar</Table.Cell>
                                        </Table.Row>
                                    ) : (
                                        entries.map((entry: any) => (
                                            <Table.Row key={entry.id}>
                                                <Table.Cell>{formatDateTime(entry.createdAt)}</Table.Cell>
                                                <Table.Cell>{entry.productName}</Table.Cell>
                                                <Table.Cell>{entry.productCustomCode}</Table.Cell>
                                                <Table.Cell>{entry.quantity}</Table.Cell>
                                                {/* <Table.Cell>{entry.quantity + ' ' + entry.PackagingType}</Table.Cell> */}
                                                {/* <Table.Cell>{entry.unitsPerPackaging + ' u.'}</Table.Cell> */}
                                                <Table.Cell>{entry.stockBefore}</Table.Cell>
                                                <Table.Cell>{entry.stockAfter}</Table.Cell>
                                                {/* <Table.Cell>{formatCOP(entry.packagingCost)}</Table.Cell> */}
                                                <Table.Cell>{formatCOP(entry.unitCost)}</Table.Cell>
                                                <Table.Cell color={'red.500'} fontWeight={'bold'}>
                                                    {formatCOP(entry.totalCost)}
                                                </Table.Cell>
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
                                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
                    </>
                )}
            </Box>

            <ManualEntryPanel
                open={isManualOpen}
                onClose={() => setIsManualOpen(false)}
                onSuccess={refreshEntries}
            />
        </div>
    
    </>
}