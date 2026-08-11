import { useEffect, useState } from "react";
import {Box, Button, CloseButton, Dialog, Field, Input, Menu, Portal, Text, For, NativeSelect,} from "@chakra-ui/react";
import { Page, Text as TextPdf, View, Document, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { jsPDF } from 'jspdf';

import { SaleCartItem } from "./sale-cart-item";
import { useSaleCart } from "./use-sale-cart";
import axios from "axios";
import type { Customer } from "./sale-cart-context";
import autoTable from "jspdf-autotable";
import { formatCOP } from "@/utils/format";
import { API_URL } from "@/config";


// generatePDF(sale, action='preview') {
//     const {jsPDF} = window.jspdf;
//     const doc = new jsPDF('p','mm',[80, 200]);
//     const comp = App.data.config.company || {
//         name: 'Empresa',
//         nit: '',
//         phone: '',
//         address: '',
//         fiscal: '',
//         logo: ''
//     };
//     let currentY = 10;
//     if (comp.logo) {
//         try {
//             doc.addImage(comp.logo, 25, 2, 30, 20);
//             currentY = 26;
//         } catch (e) {
//             console.error("Logo err", e);
//             currentY = 10;
//         }
//     }
//     doc.setFontSize(12);
//     doc.setFont(undefined, 'bold');
//     doc.text(comp.name, 40, currentY, {
//         align: "center"
//     });
//     doc.setFontSize(8);
//     doc.setFont(undefined, 'normal');
//     currentY += 5;
//     if (comp.nit) {
//         doc.text(`NIT: ${comp.nit}`, 40, currentY, {
//             align: "center"
//         });
//         currentY += 4;
//     }
//     if (comp.address) {
//         doc.text(comp.address, 40, currentY, {
//             align: "center"
//         });
//         currentY += 4;
//     }
//     if (comp.phone) {
//         doc.text(`Tel: ${comp.phone}`, 40, currentY, {
//             align: "center"
//         });
//         currentY += 4;
//     }
//     currentY += 2;
//     doc.line(5, currentY, 75, currentY);
//     currentY += 4;
//     doc.setFontSize(9);
//     doc.text(`Factura: ${sale.invoice}\nFecha: ${App.Utils.date(sale.date)}\nCajero: ${sale.cashier}\nCliente: ${sale.client}`, 5, currentY);
//     currentY += 16;
//     doc.autoTable({
//         startY: currentY,
//         head: [['Cant', 'Item', 'Total']],
//         theme: 'plain',
//         body: sale.items.map(i => [`${i.qty}x`, i.name.substring(0, 18), `$${i.price * i.qty}`]),
//         styles: {
//             fontSize: 8,
//             cellPadding: 1
//         },
//         margin: {
//             left: 5,
//             right: 5
//         }
//     });
//     let finalY = doc.lastAutoTable.finalY + 5;
//     doc.setFontSize(10);
//     doc.text("SUBTOTAL: " + App.Utils.money(sale.total), 75, finalY, {
//         align: "right"
//     });
//     finalY += 5;
//     doc.setFontSize(12);
//     doc.setFont(undefined, 'bold');
//     doc.text("TOTAL: " + App.Utils.money(sale.total), 75, finalY, {
//         align: "right"
//     });
//     finalY += 6;
//     doc.setFontSize(8);
//     doc.setFont(undefined, 'normal');
//     doc.text(`Método de Pago: ${sale.method || 'Efectivo'}`, 5, finalY);
//     if (sale.method === 'Efectivo') {
//         finalY += 4;
//         doc.text(`Recibido: ${App.Utils.money(sale.received || sale.total)}`, 5, finalY);
//         doc.text(`Cambio: ${App.Utils.money(sale.change || 0)}`, 75, finalY, {
//             align: "right"
//         });
//     } else if (sale.method === 'Crédito') {
//         finalY += 4;
//         doc.text(`Saldo Pendiente: ${App.Utils.money(sale.balance || sale.total)}`, 5, finalY);
//     }
//     if (action === 'preview') {
//         const pdfDataUri = doc.output('datauristring');
//         document.getElementById('pdf-preview-frame').src = pdfDataUri;
//         document.getElementById('preview-modal').classList.add('active');
//     } else {
//         doc.save(`${sale.invoice}.pdf`);
//     }
// }



// Invoice response : 

export type PaymentMethodObj = {
    id: number;
    code: string;
    name: string;
    description: string;
}

export type InvoiceItem  = {
    quantity: number;
    subtotal: number;
    productName: string;
};

export type CustomerBasicInfo = {
    fullName: string;
    documentId: number;
    id: number;
}

export type BusinessBasicInfo = {
    name: string;
    businessNumber: number;
    businessNumberType: string;
};

export type Invoice = {
    createdAt: string;
    invoiceNumber: string;
    total: number;
    business: BusinessBasicInfo;
    customer: CustomerBasicInfo;
    details: InvoiceItem[];
    paymentMethod: PaymentMethodObj;
    amountReceived: number;
    changeGiven: number;
    isCredit: boolean;
    remain: number;
    cashier?: {
        id: number;
        fullName: string;
    } | null;
};


// Create styles
const styles = StyleSheet.create({
  page: {
    // flexDirection: 'row',
    // backgroundColor: '#E4E4E4'
  },
  section: {
    margin: 0,
    padding: 0,
    flexGrow: 1
  }
});

// Create Document Component
const InvoicePDFView = ({invoice, onClose}: {invoice: Invoice, onClose(): void}) => {

    const [pdfURI, setPdfURI] = useState('');

    useEffect(() => {
        
        if(!invoice) return;
        console.log('---------> Init');
 
        let currentY = 10;
        const doc = new jsPDF('p','mm',[80, 200]);
        
        doc.setFontSize(12);
        doc.setFont('', 'bold');
        doc.text(invoice.business.name, 40, currentY, {
            align: "center"
        });

        doc.setFontSize(8);
        doc.setFont('', 'normal');
        currentY += 5;

        doc.text(`NIT: ${invoice.business.businessNumber}`, 40, currentY, {
            align: "center"
        });
        currentY += 4;


        currentY += 2;
        doc.line(5, currentY, 75, currentY);
        currentY += 4;
        doc.setFontSize(9);
        doc.text(`Factura: ${invoice.invoiceNumber}\nFecha: ${invoice.createdAt}\nCajero: ${invoice.cashier?.fullName || '-'}\nCliente: ${invoice.customer.fullName}`, 5, currentY);
        
        currentY += 16;
        autoTable(doc, {
            startY: currentY,
            head: [['Cant', 'Item', 'Total']],
            theme: 'plain',
            body: invoice.details.map(i => [`${i.quantity}x`, i.productName.substring(0, 18), formatCOP(i.subtotal)]),
            styles: {
                fontSize: 8,
                cellPadding: 1
            },
            margin: {
                left: 5,
                right: 5
            }
        });
        let finalY = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(10);
  
        finalY += 5;
        doc.setFontSize(12);
        doc.setFont('', 'bold');
        doc.text("TOTAL: " + formatCOP(invoice.total), 75, finalY, {
            align: "right"
        });

        finalY += 6;
        doc.setFontSize(8);
        doc.setFont('', 'normal');
        doc.text(`Método de Pago: ${invoice.paymentMethod.name}`, 5, finalY);

        if (invoice.paymentMethod.code === 'CASH') {
            finalY += 4;
            doc.text(`Recibido: ${formatCOP(invoice.amountReceived)}`, 5, finalY);
            doc.text(`Cambio: ${formatCOP(invoice.changeGiven)}`, 75, finalY, {
                align: "right"
            });
        } else if (invoice.paymentMethod.code === 'CREDIT') {
            finalY += 4;
            doc.text(`Saldo Pendiente: ${formatCOP(invoice.remain)}`, 5, finalY);
        }

        const pdfDataUri = doc.output('datauristring');
        console.log('--------> URI ', pdfDataUri);
        setPdfURI(pdfDataUri);
    }, [invoice]);






    return (


        <Dialog.Root 
            open={!!invoice} 
            onOpenChange={() => {
             
                onClose();
            }}

            
        >
            <Portal >
                <Dialog.Backdrop />
                <Dialog.Positioner  >
                    <Dialog.Content >
                        <Dialog.Header>
                            <Dialog.Title display={'flex'} justifyContent={'center'} textAlign={'center'} width={'100%'}>Factura</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body style={{width: '100%', border: '1px solid red'}} >

                            <iframe style={{width: '100%',  height: '500px',}} src={pdfURI}></iframe>
                            
                        </Dialog.Body>

                        {/* <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline" bg={'red.500'} color={'white'}>Cancelar</Button>
                            </Dialog.ActionTrigger>
                            <Button onClick={handleSavePayment} >
                                Facturar
                            </Button>
                        </Dialog.Footer> */}
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>

        
    );
};





const CustomerRegisterForm = ({ isOpen, onClose }: {isOpen:boolean, onClose:()=> void}) => {
    const APIURL = `${API_URL}/customers`;
    const saleState = useSaleCart();

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [documentId, setDocumentId] = useState('');

    const clearForm = () => {
        setFullName('');
        setPhoneNumber('');
        setAddress('');
        setEmail('');
        setDocumentId('');
    };

    const handleSaveCustomer = async () => {

        if(!fullName || !documentId || !phoneNumber) {
            alert('Campos requeridos deben ser llenados');
            return;
        };

        let body = {
            fullName,
            phoneNumber,
            documentId,
            email,
            address,
        };
        
        try {
            const token = localStorage.getItem('jwtToken');
            const {data} = await axios.post(APIURL, body, {headers: {Authorization: `Bearer ${token}`}});

            console.log('Response ==> ', data);
            saleState.addCustomer({...body, id:data.customerId });
            clearForm();
            onClose();
            alert('Cliente Guardado Exitosamente');

            
        } catch (error) {
            alert('Error al guardar el Cliente');
            console.log(error)
        }
    };


    return (
        <Dialog.Root 
            open={isOpen} 
            onOpenChange={() => {
                clearForm();
                onClose();
            }}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>Registro Nuevo Cliente</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body >

                        {/* <Stack  maxW="sm" border={'1px solid red'} width={'100%'}> */}
                            <Field.Root orientation="vertical">
                                <Field.Label>Documento o NIT</Field.Label>
                                <Input placeholder="11111" type="number" value={documentId} onChange={(e) => {setDocumentId(e.currentTarget.value)}} />
                            </Field.Root>

                            <Field.Root orientation="vertical">
                                <Field.Label>Nombre Completo</Field.Label>
                                <Input placeholder="John Doe"  value={fullName} onChange={(e) => {setFullName(e.currentTarget.value)}} />
                            </Field.Root>

                            <Field.Root orientation="vertical">
                                <Field.Label>Teléfono</Field.Label>
                                <Input placeholder="11111" type="number" value={phoneNumber} onChange={(e) => {setPhoneNumber(e.currentTarget.value)}} />
                            </Field.Root>

                            <Field.Root orientation="vertical">
                                <Field.Label>Dirección</Field.Label>
                                <Input placeholder="Barrio, Sector" value={address} onChange={(e) => {setAddress(e.currentTarget.value)}} />
                            </Field.Root>

                            <Field.Root orientation="vertical">
                                <Field.Label>Correo</Field.Label>
                                <Input placeholder="cliente@example.com" value={email} onChange={(e) => {setEmail(e.currentTarget.value)}} />
                            </Field.Root>

                            {/* <Field.Root orientation="vertical">
                                <Field.Label>Hide email</Field.Label>
                                <Switch.Root>
                                    <Switch.HiddenInput />
                                    <Switch.Control />
                                </Switch.Root>
                            </Field.Root> */}
                        {/* </Stack> */}
                        
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.ActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </Dialog.ActionTrigger>
                        <Button onClick={handleSaveCustomer} >
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


const CustomerSearchModal = ({ isOpen, onClose }: {isOpen:boolean, onClose:()=> void}) => {

    const CustomersURL = `${API_URL}/customers`;
    
    const saleState = useSaleCart();
    const [customers, setCustomers] = useState<Customer[]>([])


    const fetchCustomerAsTyping = async (e: any) => {
        const value = e.currentTarget.value
        if(!value || value.length < 3) {
            
            setCustomers([]);
            return;
        };

        try {
                        
            const token = localStorage.getItem('jwtToken');
            const {data} = await axios.get(
                `${CustomersURL}?search=${value}`, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log('Data ==> ', data.customers);
            setCustomers(data.customers);           
        } catch (error) {
            
        }
    };

    const addCustomerToCart = (customer: Customer) => {
        saleState.addCustomer(customer);
        setCustomers([]);
        onClose();
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={() => {onClose()}}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>Consultar Cliente</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>

                        <Field.Root orientation="vertical">
                            <Field.Label> </Field.Label>
                            <Input placeholder="Buscar Por Nombre, Número De Identificación o NIT"  onChange={fetchCustomerAsTyping} />
                        </Field.Root>

                        <Box display={'flex'} flexDirection={'column'} gap={'.5em'} borderWidth={  customers.length ?  '1px' : 0} marginTop={'.5em'} maxHeight={'300px'} overflowY={'scroll'}>

                            {customers.map(customer => {
                                return (
                                    <Box display={'flex'} justifyContent={'space-between'} borderBottomWidth={'1px'} alignItems={'center'}  padding={'.5em'} >
                                        <Text color={'black'} fontWeight={'bold'}>
                                            {customer.fullName} - {customer.documentId}
                                        </Text>
                                        <Button 
                                            size={'sm'} 
                                            bg={'green.500'}
                                            onClick={() => {addCustomerToCart(customer)}}
                                        >
                                            Escoger
                                        </Button>
                                    </Box>
                                )
                            })}
                        </Box>
                        
                    </Dialog.Body>
                    <Dialog.Footer>
                        {/* <Dialog.ActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </Dialog.ActionTrigger>
                        <Button >Cargar</Button> */}
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


const PaymentForm = ({ isOpen, onClose, emitInvoice}: {
    isOpen:boolean, 
    onClose:()=> void,
    emitInvoice: (invoice: Invoice) => void

}) => {
    const paymentMethods = new Map([
        ['CASH',        {id: 1}],
        ['TRANSFER',    {id: 2}],
        ['CARD',        {id: 3}],
        ['CREDIT',      {id: 4}]
    ]);

    const APIURL = `${API_URL}/sales`;
    const saleState = useSaleCart();

    const [changeValue, setChangeValue] = useState(0)
    const [amountReceived, setAmountReceived] = useState(0);
    const [paymentMethodCode, setPaymentMethodCode] = useState('CASH');



    useEffect(() => {
        let value = amountReceived - saleState.total;
        if(isNaN(value) || value < 0) {
            value = 0;
        }

        setChangeValue(value);
    }, [amountReceived]);

    const clearForm = () => {
        setAmountReceived(0);
        setPaymentMethodCode('CASH');
    };

    const handleSavePayment = async () => {
        try {

            const body: any = {
                sentAs: 'SALE',
                customerId: saleState.customer?.id,
                paymentMethod: paymentMethods.get(paymentMethodCode)?.id,
                items: saleState.items.map(item => {
                    return { productId: item.id, productCode: item.code, quantity: item.quantity};
                }),
            };

            if (paymentMethods.get('CASH')?.id === body.paymentMethod) {
                body.changeGiven= changeValue;
                body.amountReceived = amountReceived;
            }

            console.log('Aguardar: ', body);

            const token = localStorage.getItem('jwtToken');
            const {data} = await axios.post(APIURL, body, {headers: {Authorization: `Bearer ${token}`}});

            console.log('Response ==> ', data);
           
            clearForm();
            onClose();
            emitInvoice(data.invoice);
            saleState.resetSaleCart();
        } catch (error) {
            alert('Error al guardar el Cliente');
            console.log(error)
        }
    };


    return (
        <Dialog.Root 
            open={isOpen} 
            onOpenChange={() => {
                clearForm();
                onClose();
            }}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title display={'flex'} justifyContent={'center'} textAlign={'center'} width={'100%'}>Procesar Pago</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body >

                        <div>
                            <Text textStyle="3xl" textAlign={'center'}>{formatCOP(saleState.total)}</Text>
                        </div>
                        <div>
                            <Field.Root orientation="vertical">
                                <Field.Label>Método De Pago</Field.Label>
                                
                                    <NativeSelect.Root key={'md'} size={'md'} >
                                        <NativeSelect.Field value={paymentMethodCode} onChange={(e) => { setPaymentMethodCode(e.target.value)  }}>
                                            <option value="CASH">Efectivo</option>
                                            <option value="TRANSFER">Transferencia (Nequi/Banco)</option>
                                            <option value="CARD">Tarjeta (Datáfono)</option>
                                            <option value="CREDIT">Crédito (Abono en cuenta)</option>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                          
                            </Field.Root>

                            { (paymentMethodCode === 'CASH') && (<div>


                                <Field.Root orientation="vertical" marginTop={'10px'}>
                                    <Field.Label>Monto Recibido</Field.Label>
                                    <Input placeholder="$ 0" type="number" autoComplete={'off'} value={amountReceived} onChange={(e) => {setAmountReceived(parseInt(e.currentTarget.value))}} />
                                </Field.Root>

                                <Box 
                                    marginTop={'20px'} 
                                    border={'0px solid  gray'} 
                                    borderRadius={'.5em'} 
                                    padding={'.5em'} 
                                    bg={'bg.muted'} 
                                    display={'flex'} 
                                    justifyContent={'space-between'}
                                    alignItems={'center'}
                                >
                                    <Text fontWeight={'600'} textStyle="lg">Cambio a devolver:</Text> 
                                    <Text fontWeight={'600'} textStyle="lg">{formatCOP(changeValue)}</Text>
                                </Box>

                            </div>)}
                        </div>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.ActionTrigger asChild>
                            <Button variant="outline" bg={'red.500'} color={'white'}>Cancelar</Button>
                        </Dialog.ActionTrigger>
                        <Button onClick={handleSavePayment} >
                            Facturar
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





const CustomerButton = () => {
    const [isCustomerFormOPen, setIsCustomerFormOpen] = useState(false);
    const [isCustomerSearchModalOpen, setIsCustomerSearchModalOpen] = useState(false);

    return (<>

        <Menu.Root>
            <Menu.Trigger asChild>
            <Button 
                // variant="outline" 
                // size="sm"
                // bg={'green.400'}
            >
                Cliente
            </Button>
            </Menu.Trigger>
            <Portal>
            <Menu.Positioner>
                <Menu.Content>
                    <Menu.Item value="customerSearch" onClick={() => {setIsCustomerSearchModalOpen(true)}}>
                        Buscar
                    </Menu.Item>
                    <Menu.Item value="customerForm"  onClick={() => {setIsCustomerFormOpen(true)}}>
                        Registar
                    </Menu.Item>
                </Menu.Content>
            </Menu.Positioner>
            </Portal>
        </Menu.Root>


        <CustomerSearchModal isOpen={isCustomerSearchModalOpen} onClose={() => setIsCustomerSearchModalOpen(false)} />
        <CustomerRegisterForm isOpen={isCustomerFormOPen} onClose={() => setIsCustomerFormOpen(false)}  />

        {/* <TemplateUploadForm
            isOpen={isOPen}
            onClose={() => {
                console.log('CERRENADO')
                setIsOpen(false)
            }}
        /> */}

    </>)
}



export const SaleCart = () => {
    const saleState = useSaleCart();
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);

    const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);

    const saveSale = () => {
        const { items, total, customer } = saleState;
        console.log({items, total, customer});



        if(!items.length || !total || !customer) {

            if(!total) {
                alert('Agrega al menos un producto');
            } else {
                alert('Agrega cliente')
            }
            return;
        };


        setIsPaymentFormOpen(true);
    };


    return (
        <div style={{
                borderRadius: '.5em',
                boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
                width: '50%',
                padding: '.3em',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white'
        }}>
            <div style={{
                border: '0px solid blue',
                padding: '.1em',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '.3em'
            }}>
                <Button 
                    bg={'green.400'}
                    onClick={saveSale}
                >
                    Procesar Pago
                </Button>
                <CustomerButton />
            </div>


            <div style={{
                border: '0px solid green',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            
            }}>
                <div style={{
                    width: '100%',
                    height: '80%',
                    border: '0px solid blue',
                    overflowY: 'scroll',
                    
                    fontSize: '14px',
                    
                }}>

                    {
                        saleState.items.map((item) => {
                            return <SaleCartItem item={item} />
                        })
                    }
                    
                </div>

                <div style={{ border: '0px solid yellow', flex:1 }}>

                    <div style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#111111',
                        borderBottom: '1px dashed #cccccc',
                        padding: '.5em'
                    }}>
                        <p style={{display: 'flex', gap: '.8em'}}>
                            <span style={{ color: '#4a5568', fontSize: '12px' }}>👤</span> 
                            <span style={{fontWeight: '600', }}>Cliente: {saleState.customer?.fullName} </span>
                            <span style={{ color: '#a1a1aa'}}>|</span>
                            <span style={{ fontWeight: '400', color: '#52525b' }}>ID: {saleState.customer?.documentId}</span>
                        </p>

                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <p style={{display: 'flex', alignItems: 'center', fontSize: '22px', fontWeight: 'bold', color: '#111111'}}>Total:</p>
                        <p style={{flex: 1, display: 'flex', justifyContent: 'end',  fontSize: '22px', fontWeight: 'bold', color: '#111111'}}>
                            {formatCOP(saleState.total)}
                        </p>

                    </div>
                </div>
            </div>

            <PaymentForm isOpen={isPaymentFormOpen} onClose={() => setIsPaymentFormOpen(false)} emitInvoice={setInvoiceData}  />
            <InvoicePDFView invoice={invoiceData!} onClose={() => {setInvoiceData(null)}} />
        </div>
    )

}; 




