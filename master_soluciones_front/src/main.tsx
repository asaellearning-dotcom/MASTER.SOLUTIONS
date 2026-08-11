import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { Provider } from '@/components/ui/provider'


import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { InventoryPage } from './pages/inventory/index.tsx';
import { ProductList } from './pages/inventory/product-list.tsx';
import { ProductManage } from './pages/inventory/product-manage.tsx';
import { LoginPage } from './pages/login/index.tsx';
import { SalePage } from './pages/sale/index.tsx';
import { SaleFormPanel } from './pages/sale/sale-form.tsx';
import { InvoiceHistorySection } from './pages/sale/InvoiceHistorySection.tsx';
import { AccountReceivableSection } from './pages/sale/AccountRecaivableSection.tsx';
import { CustomersPage } from './pages/customers/index.tsx';
import { CustomerList } from './pages/customers/customer-list.tsx';
import { ConfigPage } from './pages/configuracion/index.tsx';
import { BusinessProfileSection } from './pages/configuracion/business-profile.tsx';
import { UsersSection } from './pages/configuracion/users-section.tsx';
import { RequireRole } from './components/RequireRole.tsx';
import { ROLES } from './utils/auth.ts';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN]} />,
        children: [
          {
            path: "/inventario",
            element: <InventoryPage />,
            children: [
              {
                path: "stock-actual",
                element: <ProductList />,
              },
              {
                path: "entradas-y-excel",
                element: <ProductManage /> ,
              },
            ]
          },
          {
            path: '/clientes',
            element: <CustomersPage />,
            children: [
              {
                path: "mis-clientes",
                element: <CustomerList />,
              },
            ]
          },
          {
            path: '/configuracion',
            element: <ConfigPage />,
            children: [
              {
                path: "perfil-empresa",
                element: <BusinessProfileSection />,
              },
              {
                path: "usuarios",
                element: <UsersSection />,
              },
            ]
          },
        ],
      },

      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN, ROLES.CASHIER]} />,
        children: [
          {
            path: '/ventas',
            element: <SalePage />,
            children: [
              {
                path: "registrar",
                element: <SaleFormPanel />,
              },
              {
                path: "historial-facturas",
                element: <InvoiceHistorySection /> ,
              },
              {
                path: "cartera",
                element: <AccountReceivableSection /> ,
              },
            ]
          },
        ],
      },
    ]
  },
  {
    path: 'login',
    element: <LoginPage />
  }




]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <RouterProvider router={router} />,
    </Provider>
  </StrictMode>,
)
