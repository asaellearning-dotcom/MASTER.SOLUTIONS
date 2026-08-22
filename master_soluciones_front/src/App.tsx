import { useEffect } from 'react';
import { SideBar, MOBILE_TOPBAR_HEIGHT } from './components/ui/sidebar';
import { Outlet, useNavigate } from 'react-router';
import { Box, useBreakpointValue } from '@chakra-ui/react';



function App() {
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token){
      navigate('/login');
    }
  }, [])

  return (
    <Box height="100vh" width="100%" padding={0}>
      <Box
        width="100%"
        height="100%"
        display="flex"
      >
        <SideBar />

        <Box
          flex={1}
          bg="gray.100"
          height="100vh"
          overflow="auto"
          pt={isMobile ? MOBILE_TOPBAR_HEIGHT : undefined}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default App
