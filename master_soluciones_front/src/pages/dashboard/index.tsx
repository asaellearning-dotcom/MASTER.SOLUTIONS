import { DashboardHeader } from "./components/dashboard-header";
import { Outlet } from "react-router";

export const DashboardPage = () => {
    return (
        <div style={{ border: '0px solid', height: '100%' }}>
            <DashboardHeader />
            <div style={{ border: '1px solid red', height: '40em', overflow: 'scroll' }}>
                <Outlet />
            </div>
        </div>
    );
};
