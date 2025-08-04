import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './pages/Auth/ProtectedRoute'; // Asegúrate de que esta ruta sea correcta
import Layout from './components/Layout/Layout'; // Tu Layout principal
import { ThemeProvider } from './context/ThemeContext';

// Componentes cargados diferidamente (Lazy-loaded components)
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/Dashboard/DashboardPage'));

const PersonasListPage = React.lazy(() => import('./pages/Personas/PersonasListPage'));
const PersonaFormPage = React.lazy(() => import('./pages/Personas/PersonaFormPage'));

const UsuariosListPage = React.lazy(() => import('./pages/Usuarios/UsuariosListPage'));
const UserRolesPage = React.lazy(() => import('./pages/Usuarios/UserRolesPage'));
const UsuarioFormPage = React.lazy(() => import('./pages/Usuarios/UsuariosFormPage'));

const RolesListPage = React.lazy(() => import('./pages/Roles/RolesListPage'));
const RolesFormPage = React.lazy(() => import('./pages/Roles/RolesFormPage'));

const CategoriasListPage = React.lazy(() => import('./pages/Categorias/CategoriasListPage'));
const CategoriasFormPage = React.lazy(() => import('./pages/Categorias/CategoriasFormPage'));

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

const ForgotPasswordRequestPage = React.lazy(() => import('./pages/Auth/ForgotPasswordRequestPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/Auth/ResetPasswordPage'));

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* --- RUTAS PÚBLICAS (ACCESIBLES SIN AUTENTICACIÓN) --- */}
                        <Route path="/login" element={<React.Suspense fallback={<div>Cargando Login...</div>}><LoginPage /></React.Suspense>} />
                        <Route path="/forgot-password" element={<React.Suspense fallback={<div>Cargando...</div>}><ForgotPasswordRequestPage /></React.Suspense>} />
                        <Route path="/reset-password" element={<React.Suspense fallback={<div>Cargando...</div>}><ResetPasswordPage /></React.Suspense>} />

                        {/* Ruta Raíz - Redirige a /dashboard (la lógica de AuthProvider redirigirá a /login si no hay token) */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* --- RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN Y POSIBLEMENTE ROLES) --- */}
                        {/* Todas las rutas anidadas aquí requieren al menos autenticación */}
                        <Route element={<ProtectedRoute />}>
                            {/* El Layout envolverá el contenido de las rutas protegidas */}
                            <Route element={<Layout />}>
                                {/* Dashboard - Accesible para cualquier usuario autenticado */}
                                <Route path="/dashboard" element={<React.Suspense fallback={<div>Cargando Dashboard...</div>}><DashboardPage /></React.Suspense>} />

                                {/* *** Rutas del Módulo Personas (Administrador, Empleado, o Cliente si aplica) *** */}
                                {/* Puedes decidir qué roles pueden ver las personas. Ej: Admin y Empleado */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Empleado']} />}>
                                    <Route path="/personas" element={<React.Suspense fallback={<div>Cargando Personas...</div>}><PersonasListPage /></React.Suspense>} />
                                    <Route path="/personas/new" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><PersonaFormPage /></React.Suspense>} />
                                    <Route path="/personas/edit/:id" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><PersonaFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Rutas del Módulo Usuarios (Solo Administrador) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
                                    <Route path="/usuarios" element={<React.Suspense fallback={<div>Cargando Usuarios...</div>}><UsuariosListPage /></React.Suspense>} />
                                    <Route path="/usuarios/new" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><UsuarioFormPage /></React.Suspense>} />
                                     <Route path="/usuarios/edit/:id" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><UsuarioFormPage /></React.Suspense>} />
                                    <Route path="/usuarios/roles/:id" element={<React.Suspense fallback={<div>Cargando Roles de Usuario...</div>}><UserRolesPage /></React.Suspense>} />

                                </Route>

                                {/* *** Rutas del Módulo Roles (Solo Administrador) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
                                    <Route path="/roles" element={<React.Suspense fallback={<div>Cargando Roles...</div>}><RolesListPage /></React.Suspense>} />
                                    <Route path="/roles/new" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><RolesFormPage /></React.Suspense>} />
                                    <Route path="/roles/edit/:id" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><RolesFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Rutas del Módulo Categorias (Solo Administrador) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
                                    <Route path="/categorias" element={<React.Suspense fallback={<div>Cargando Categorías...</div>}><CategoriasListPage /></React.Suspense>} />
                                    <Route path="/categorias/new" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><CategoriasFormPage /></React.Suspense>} />
                                    <Route path="/categorias/edit/:id" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><CategoriasFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Rutas del Módulo Productos (Administrador, Empleado si pueden ver/modificar) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Empleado']} />}>
                                    <Route path="/productos" element={<React.Suspense fallback={<div>Cargando Productos...</div>}><ProductosListPage /></React.Suspense>} />
                                    {/* Agrega rutas para new/edit de productos si existen */}
                                </Route>

                                {/* *** Rutas del Módulo Movimientos de Inventario (Administrador, Empleado) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Empleado']} />}>
                                    <Route path="/movimientos" element={<React.Suspense fallback={<div>Cargando Movimientos...</div>}><MovimientosListPage /></React.Suspense>} />
                                </Route>

                                {/* *** Rutas del Módulo Proveedores (Administrador, Empleado) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Empleado']} />}>
                                    <Route path="/proveedores" element={<React.Suspense fallback={<div>Cargando Proveedores...</div>}><ProveedoresListPage /></React.Suspense>} />
                                    <Route path="/proveedores/new" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><ProveedorFormPage /></React.Suspense>} />
                                    <Route path="/proveedores/edit/:id" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><ProveedorFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Rutas del Módulo Compras (Administrador, Empleado) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Empleado']} />}>
                                    <Route path="/compras" element={<React.Suspense fallback={<div>Cargando Compras...</div>}><ComprasListPage /></React.Suspense>} />
                                    <Route path="/compras/new" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><ComprasFormPage /></React.Suspense>} />
                                    <Route path="/compras/view/:id" element={<React.Suspense fallback={<div>Cargando Vista...</div>}><ComprasViewPage /></React.Suspense>} />
                                    <Route path="/compras/edit/:id" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><ComprasFormPage /></React.Suspense>} />
                                </Route>

                                {/* *** Rutas del Módulo Ventas (Administrador, Empleado, Cajero si aplican) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Empleado', 'Cajero']} />}>
                                    <Route path="/ventas" element={<React.Suspense fallback={<div>Cargando Ventas...</div>}><VentasListPage/></React.Suspense>} />
                                    <Route path="/ventas/new" element={<React.Suspense fallback={<div>Cargando Formulario...</div>}><VentaFormPage /></React.Suspense>} />
                                    <Route path="/ventas/:ventaId" element={<React.Suspense fallback={<div>Cargando Detalle...</div>}><VentaDetailPage /></React.Suspense>} />
                                </Route>

                                {/* *** Ruta del Módulo Reportes (Administrador, Empleado) *** */}
                                <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Empleado']} />}>
                                    <Route path="/reportes" element={<React.Suspense fallback={<div>Cargando Reportes...</div>}><ReportesPage /></React.Suspense>} />
                                </Route>

                                {/* Ruta de fallback para cualquier ruta no definida dentro del Layout (opcional) */}
                                {/* <Route path="*" element={<div>Página no encontrada</div>} /> */}

                            </Route>
                        </Route>

                        {/* Ruta de fallback para cualquier otra ruta fuera del ProtectedRoute (e.g., 404) */}
                        {/* <Route path="*" element={<div>404 - Página no encontrada</div>} /> */}

                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
};

export default App;
