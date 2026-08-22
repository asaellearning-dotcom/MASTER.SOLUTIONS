import { Heading, Box } from "@chakra-ui/react";

export const DashboardHeader = () => {
    return (
        <Box
            style={{ border: '', width: '100%', padding: '.8em' }}
            borderBottom={'1px solid'}
            borderBottomColor={'gray.200'}
            bgColor={'white'}
        >
            <div>
                <Heading color={'gray.700'} padding={'2.5'} size={'2xl'} fontWeight={'bolder'}>
                    Dashboard
                </Heading>
            </div>
        </Box>
    );
};
