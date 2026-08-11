import { Header } from "./components/inventory-header"
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

export const InventoryPage = () => {
    const navigate = useNavigate();

    useEffect(() =>{
        navigate('stock-actual');
    }, []);

    return <>
    
        <div style={{border: '0px solid ',height: '100%' }}>
            <Header />
            <div style={{border: '1px solid red', height: '40em', overflow: 'scroll'}}>
                <Outlet />
            </div>
        </div>
    
    
    
    </>
}