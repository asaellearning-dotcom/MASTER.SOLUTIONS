import { Navigate, Outlet } from "react-router";
import { hasRole } from "@/utils/auth";

type RequireRoleProps = {
    allowedRoles: string[];
    redirectTo?: string;
};

export const RequireRole = ({
    allowedRoles,
    redirectTo = '/ventas/registrar',
}: RequireRoleProps) => {
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!hasRole(...allowedRoles)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
};
