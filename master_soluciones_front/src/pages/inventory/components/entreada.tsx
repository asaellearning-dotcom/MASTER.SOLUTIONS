import { Box, Button, Field, Input } from "@chakra-ui/react"

export const aaa = () => {
    return (<>
    <Box borderColor={'gray.700'} padding={'4.5'} bg={'#0f172abf'} borderRadius={'md'}>
                <div style={{marginBottom: '.8em'}}>
                    
                    <Field.Root required>

                        <Field.Label color={'#94a3b8'}>Buscar Producto Existente</Field.Label>
                        <Input 
                            placeholder="Código o Nombre..."  
                            color="white"
                            borderColor={'gray.700'}
                            backgroundColor={'blackAlpha.500'}
                        />
                        
                    </Field.Root>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between'}}>

                    <Field.Root required marginRight={'0.5'}>

                        <Field.Label color={'#94a3b8'}>Cantidad a Ingresar</Field.Label>
                        <Input 
                            placeholder="Código o Nombre..."  
                            color="white"
                            borderColor={'gray.700'}
                            backgroundColor={'blackAlpha.500'}
                            
                        />
                        
                    </Field.Root>
                   

                    <Field.Root required marginLeft={'0.5'}>

                        <Field.Label color={'#94a3b8'}>Nuevo Costo Unitario ($)</Field.Label>
                        <Input 
                            placeholder="Código o Nombre..."  
                            color="white"
                            borderColor={'gray.700'}
                            backgroundColor={'blackAlpha.500'}
                        />
                        
                    </Field.Root>
                </div>

                <div style={{ marginTop: '.8em'}} >
                    <Button width={'100%'} bg={'blue.500'}>
                        + Sumar al Inventario
                    </Button>
                </div>

            </Box>
    
    </>)
}