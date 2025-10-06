import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as loginService, getMe, getMeMenusWithRoles } from '../services/authService';
import { Token } from '../types/auth';
import { IUsuarioReadAudit } from '../types/usuario';
import { IMenuWithRoles } from '../types/menu';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
    isAuthenticated: boolean;
    user: IUsuarioReadAudit | null;
    menus: IMenuWithRoles[]; // Todos los menús con información de roles
    activeRole: string | null; // Rol actualmente activo
    availableRoles: string[]; // Roles disponibles del usuario
    filteredMenus: IMenuWithRoles[]; // Menús filtrados por rol activo
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    switchRole: (roleName: string) => void; // Cambiar rol activo
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<IUsuarioReadAudit | null>(null);
    const [menus, setMenus] = useState<IMenuWithRoles[]>([]);
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [filteredMenus, setFilteredMenus] = useState<IMenuWithRoles[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const publicAuthPaths = ['/login', '/forgot-password', '/reset-password'];

    // Función para filtrar menús basado en el rol activo
    const filterMenusByRole = useCallback((allMenus: IMenuWithRoles[], roleName: string | null) => {


        if (!roleName) {
            return allMenus;
        }

        // Filtrar menús que el rol activo puede acceder
        const filtered = allMenus.filter(menu => {
            // Si el menú no tiene restricciones de rol, está disponible para todos
            if (!menu.rol_menu || menu.rol_menu.length === 0) {
                return true;
            }

            // Verificar si el rol activo tiene acceso a este menú
            const hasAccess = menu.rol_menu.some(rolMenu => rolMenu.rol.nombre_rol === roleName);
            return hasAccess;
        });

        return filtered;
    }, []);

    // Función para cambiar rol activo
    const switchRole = useCallback((roleName: string) => {


        if (!availableRoles.includes(roleName)) {
            console.error(`❌ [DEBUG] Rol "${roleName}" no está disponible para este usuario`);
            setError(`Rol "${roleName}" no está disponible para este usuario`);
            return;
        }

        setActiveRole(roleName);

        const filtered = filterMenusByRole(menus, roleName);
        setFilteredMenus(filtered);

        // Guardar preferencia en localStorage
        localStorage.setItem('activeRole', roleName);

        // Limpiar error si existe
        setError(null);

    }, [availableRoles, menus, filterMenusByRole]);

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('activeRole');
        setIsAuthenticated(false);
        setUser(null);
        setMenus([]);
        setActiveRole(null);
        setAvailableRoles([]);
        setFilteredMenus([]);
        setError(null);
        navigate('/login', { replace: true });
    }, [navigate]);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setLoading(false);
                if (!publicAuthPaths.includes(location.pathname)) {
                    navigate('/login', { replace: true });
                }
                return;
            }

            // Optimización: Solo verificar si el usuario o los menús no están cargados
            if (isAuthenticated && user && menus.length > 0) {
                setLoading(false);
                return;
            }

            try {
                const [userData, menusData] = await Promise.all([
                    getMe(),
                    getMeMenusWithRoles()
                ]);

                // Extraer roles disponibles
                const userRoles = userData.persona?.roles?.map(rol => rol.nombre_rol) || [];
                setUser(userData);
                setMenus(menusData);
                setAvailableRoles(userRoles);

                // Determinar rol activo inicial
                const savedActiveRole = localStorage.getItem('activeRole');
                const initialRole =
                    savedActiveRole && userRoles.includes(savedActiveRole)
                        ? savedActiveRole
                        : userRoles.length > 0
                            ? userRoles[0]
                            : null;

                if (initialRole) {
                    setActiveRole(initialRole);
                    const filtered = filterMenusByRole(menusData, initialRole);
                    setFilteredMenus(filtered);
                } else {
                    setFilteredMenus(menusData);
                }

                setIsAuthenticated(true);
            } catch (err) {
                logout();
                setError("Su sesión ha expirado. Por favor, inicie sesión de nuevo.");
            } finally {
                setLoading(false);
            }
        };

        verifyAuth();
    }, [location.pathname, navigate, logout, isAuthenticated, user, menus.length]);

    const loginUser = async (username: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const tokenData: Token = await loginService(username, password);
            localStorage.setItem('accessToken', tokenData.access_token);
            
            const [userData, menusData] = await Promise.all([
                getMe(),
                getMeMenusWithRoles()
            ]);

            // Extraer roles disponibles
            const userRoles = userData.persona?.roles?.map(rol => rol.nombre_rol) || [];
            setUser(userData);
            setMenus(menusData);
            setAvailableRoles(userRoles);

            // Establecer rol activo inicial (priorizar Administrador si existe)
            const initialRole = userRoles.includes('Administrador')
                ? 'Administrador'
                : userRoles.length > 0
                    ? userRoles[0]
                    : null;

            if (initialRole) {
                setActiveRole(initialRole);
                const filtered = filterMenusByRole(menusData, initialRole);
                setFilteredMenus(filtered);
                localStorage.setItem('activeRole', initialRole);
            } else {
                setFilteredMenus(menusData);
            }

            setIsAuthenticated(true);

            // Lógica de redirección basada en el rol
            const isAdmin = userRoles.some(rol => rol === 'Administrador');

            if (isAdmin) {
                navigate('/dashboard', { replace: true });
            } else {
                navigate('/home', { replace: true });
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Error al iniciar sesión.';
            setError(errorMessage);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const value = {
        isAuthenticated,
        user,
        menus, // Todos los menús del usuario
        activeRole,
        availableRoles,
        filteredMenus, // Menús filtrados por rol activo
        loading,
        error,
        login: loginUser,
        logout,
        switchRole,
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-xl text-gray-700 bg-gray-50">
                Cargando...
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};