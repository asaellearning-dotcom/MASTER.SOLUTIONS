import { CustomerHeader } from "./components/customer-header"
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

export const CustomersPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('mis-clientes');
    }, []);

    return (
        <div style={{ border: '0px solid', height: '100%' }}>
            <CustomerHeader />
            <div style={{ border: '1px solid red', height: '40em', overflow: 'scroll' }}>
                <Outlet />
            </div>
        </div>
    );
};
