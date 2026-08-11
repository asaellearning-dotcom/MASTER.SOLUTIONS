import { SaleHEader } from "./components/sale-header"
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

export const SalePage = () => {
    const navigate = useNavigate();

    useEffect(() =>{
        navigate('registrar');
    }, []);

    return <>
    
        <div style={{border: '0px solid blue',height: '100%', display: 'flex', flexDirection: 'column', }}>
            <SaleHEader />
            <div style={{border: '1px solid red', height: '40em', overflow: 'hidden', flex:1}}>
                <Outlet />
            </div>
        </div>
    
    
    
    </>
}