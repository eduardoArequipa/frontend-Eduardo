import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './pages/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import { ThemeProvider } from './context/ThemeContext';
import RolePermissionsPage from './pages/Roles/RolePermissionsPage';

// Componentes cargados diferidamente
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const HomePage = React.lazy(() => import('./pages/Home/HomePage')); // Nueva página de inicio
const DashboardPage = React.lazy(() => import('./pages/Dashboard/DashboardPage'));

const PersonasListPage = React.lazy(() => import('./pages/Personas/PersonasListPage'));
const PersonaFormPage = React.lazy(() => import('./pages/Personas/PersonaFormPage'));

const UsuariosListPage = React.lazy(() => import('./pages/Usuarios/UsuariosListPage'));
const UserRolesPage = React.lazy(() => import('./pages/Usuarios/UserRolesPage'));
const UsuarioFormPage = React.lazy(() => import('./pages/Usuarios/UsuariosFormPage'));

const RolesListPage = React.lazy(() => import('./pages/Roles/RolesListPage'));

const CategoriasListPage = React.lazy(() => import('./pages/Categorias/CategoriasListPage'));
const CategoriasFormPage = React.lazy(() => import('./pages/Categorias/CategoriasFormPage'));

const MarcasListPage = React.lazy(() => import('./pages/Marcas/MarcasListPage'));

const ProductosListPage = React.lazy(() => import('./pages/Productos/ProductosListPage'));
const MovimientosListPage = React.lazy(() => import('./pages/Movimientos/MovimientosListPage'));

const ProveedoresListPage = React.lazy(() => import('./pages/Proveedores/ProveedoresListPage'));
const ProveedorFormPage = React.lazy(() => import('./pages/Proveedores/ProveedorFormPage'));

const ComprasListPage = React.lazy(() => import('./pages/Compras/ComprasListPage'));
const ComprasFormPage = React.lazy(() => import('./pages/Compras/CompraFormPage'));
const ComprasViewPage = React.lazy(() => import('./pages/Compras/ComprasViewPage'));

const VentasListPage = React.lazy(() => import('./pages/Ventas/VentasListPage'));
const VentaFormPage = React.lazy(() => import('./pages/Ventas/VentaFormPage'));
const VentaDetailPage = React.lazy(() => import('./pages/Ventas/VentaDetailPage'));
const ReportesPage = React.lazy(() => import('./pages/Reportes/ReportesPage'));
const ConversionesCompraList = React.lazy(() => import('./pages/ConversionesCompra/ConversionesCompraList'));

const ForgotPasswordRequestPage = React.lazy(() => import('./pages/Auth/ForgotPasswordRequestPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/Auth/ResetPasswordPage'));

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* --- RUTAS PÚBLICAS --- */}
                        <Route path="/login" element={<React.Suspense fallback={<div>Cargando...</div>}><LoginPage /></React.Suspense>} />
                        <Route path="/forgot-password" element={<React.Suspense fallback={<div>Cargando...</div>}><ForgotPasswordRequestPage /></React.Suspense>} />
                        <Route path="/reset-password" element={<React.Suspense fallback={<div>Cargando...</div>}><ResetPasswordPage /></React.Suspense>} />

                        {/* --- RUTA RAÍZ --- */}
                        {/* Redirige a /home por defecto. La lógica de login se encarga de enviar a los admins a /dashboard */}
                        <Route path="/" element={<Navigate to="/home" replace />} />

                        {/* --- RUTAS PROTEGIDAS --- */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<Layout />}>
                                {/* Página de bienvenida general */}
                                <Route path="/home" element={<React.Suspense fallback={<div>Cargando...</div>}><HomePage /></React.Suspense>} />

                                {/* Dashboard (Solo para usuarios con permiso al menú /dashboard) */}
                                <Route element={<ProtectedRoute requiredMenu="/dashboard" />}>
                                    <Route path="/dashboard" element={<React.Suspense fallback={<div>Cargando...</div>}><DashboardPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Personas *** */}
                                <Route element={<ProtectedRoute requiredMenu="/personas" />}>
                                    <Route path="/personas" element={<React.Suspense fallback={<div>Cargando...</div>}><PersonasListPage /></React.Suspense>} />
                                    <Route path="/personas/new" element={<React.Suspense fallback={<div>Cargando...</div>}><PersonaFormPage /></React.Suspense>} />
                                    <Route path="/personas/edit/:id" element={<React.Suspense fallback={<div>Cargando...</div>}><PersonaFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Usuarios *** */}
                                <Route element={<ProtectedRoute requiredMenu="/usuarios" />}>
                                    <Route path="/usuarios" element={<React.Suspense fallback={<div>Cargando...</div>}><UsuariosListPage /></React.Suspense>} />
                                    <Route path="/usuarios/new" element={<React.Suspense fallback={<div>Cargando...</div>}><UsuarioFormPage /></React.Suspense>} />
                                    <Route path="/usuarios/edit/:id" element={<React.Suspense fallback={<div>Cargando...</div>}><UsuarioFormPage /></React.Suspense>} />
                                    <Route path="/usuarios/roles/:id" element={<React.Suspense fallback={<div>Cargando...</div>}><UserRolesPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Roles *** */}
                                <Route element={<ProtectedRoute requiredMenu="/roles" />}>
                                    <Route path="/roles" element={<React.Suspense fallback={<div>Cargando...</div>}><RolesListPage /></React.Suspense>} />
                                    <Route path="/roles/permissions/:id" element={<React.Suspense fallback={<div>Cargando...</div>}><RolePermissionsPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Categorias *** */}
                                <Route element={<ProtectedRoute requiredMenu="/categorias" />}>
                                    <Route path="/categorias" element={<React.Suspense fallback={<div>Cargando...</div>}><CategoriasListPage /></React.Suspense>} />
                                    <Route path="/categorias/new" element={<React.Suspense fallback={<div>Cargando...</div>}><CategoriasFormPage /></React.Suspense>} />
                                    <Route path="/categorias/edit/:id" element={<React.Suspense fallback={<div>Cargando...</div>}><CategoriasFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Marcas *** */}
                                <Route element={<ProtectedRoute requiredMenu="/marcas" />}>
                                    <Route path="/marcas" element={<React.Suspense fallback={<div>Cargando...</div>}><MarcasListPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Productos *** */}
                                <Route element={<ProtectedRoute requiredMenu="/productos" />}>
                                    <Route path="/productos" element={<React.Suspense fallback={<div>Cargando...</div>}><ProductosListPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Movimientos *** */}
                                <Route element={<ProtectedRoute requiredMenu="/movimientos" />}>
                                    <Route path="/movimientos" element={<React.Suspense fallback={<div>Cargando...</div>}><MovimientosListPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Proveedores *** */}
                                <Route element={<ProtectedRoute requiredMenu="/proveedores" />}>
                                    <Route path="/proveedores" element={<React.Suspense fallback={<div>Cargando...</div>}><ProveedoresListPage /></React.Suspense>} />
                                    <Route path="/proveedores/new" element={<React.Suspense fallback={<div>Cargando...</div>}><ProveedorFormPage /></React.Suspense>} />
                                    <Route path="/proveedores/edit/:id" element={<React.Suspense fallback={<div>Cargando...</div>}><ProveedorFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Compras *** */}
                                <Route element={<ProtectedRoute requiredMenu="/compras" />}>
                                    <Route path="/compras" element={<React.Suspense fallback={<div>Cargando...</div>}><ComprasListPage /></React.Suspense>} />
                                    <Route path="/compras/new" element={<React.Suspense fallback={<div>Cargando...</div>}><ComprasFormPage /></React.Suspense>} />
                                    <Route path="/compras/view/:id" element={<React.Suspense fallback={<div>Cargando...</div>}><ComprasViewPage /></React.Suspense>} />
                                    <Route path="/compras/edit/:id" element={<React.Suspense fallback={<div>Cargando...</div>}><ComprasFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Ventas *** */}
                                <Route element={<ProtectedRoute requiredMenu="/ventas" />}>
                                    <Route path="/ventas" element={<React.Suspense fallback={<div>Cargando...</div>}><VentasListPage /></React.Suspense>} />
                                    <Route path="/ventas/new" element={<React.Suspense fallback={<div>Cargando...</div>}><VentaFormPage /></React.Suspense>} />
                                    <Route path="/ventas/:ventaId" element={<React.Suspense fallback={<div>Cargando...</div>}><VentaDetailPage /></React.Suspense>} />
                                </Route>

                                {/* *** Módulo Reportes *** */}
                                <Route element={<ProtectedRoute requiredMenu="/reportes" />}>
                                    <Route path="/reportes" element={<React.Suspense fallback={<div>Cargando...</div>}><ReportesPage /></React.Suspense>} />
                                </Route>
                                {/* *** Módulo Conversiones de Compra *** */}
                                <Route element={<ProtectedRoute requiredMenu="/conversiones-compra" />}>
                                    <Route path="/conversiones-compra" element={<React.Suspense fallback={<div>Cargando...</div>}><ConversionesCompraList /></React.Suspense>} />
                                </Route>
                            
                    
                            </Route>
                        </Route>

                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
};

export default App;