import { useEffect, useState } from 'react';
import { SideBar } from './components/ui/sidebar';
import { Outlet, useNavigate } from 'react-router';
import { Box } from '@chakra-ui/react';



function App() {
  
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token){
      navigate('/login');
    }
  }, [])

  return (
    <>


    <div style={{
      // backgroundColor: '#060b14',
      // backgroundColor: 'white',
      height: '100vh',
      // border: '1px solid orange',
      padding: 0,
      width: '100%'
     
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        display:'flex', 
        // border: '1px solid pink',  

      }}>
        <SideBar />

       
        <Box height={'100vh'} flex={1} bg={'gray.100'} 
          // border={'1px solid brown'}
        //  overflow="hidden"
        >
          <Outlet />
        </Box>
  
      </div>
    </div>
    
     
    </>
  )
}

export default App
