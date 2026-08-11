import { ConfigHeader } from "./components/config-header"
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

export const ConfigPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('perfil-empresa');
    }, []);

    return (
        <div style={{ border: '0px solid', height: '100%' }}>
            <ConfigHeader />
            <div style={{ border: '1px solid red', height: '40em', overflow: 'scroll' }}>
                <Outlet />
            </div>
        </div>
    );
};
