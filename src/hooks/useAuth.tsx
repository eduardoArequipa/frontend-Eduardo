import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as loginService, getMe, getMeMenus } from '../services/authService';
import { Token } from '../types/auth';
import { IUsuarioReadAudit } from '../types/usuario';
import { IMenuInDB } from '../types/menu';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
    isAuthenticated: boolean;
    user: IUsuarioReadAudit | null;
    menus: IMenuInDB[]; // Renombrado de userMenus a menus
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<IUsuarioReadAudit | null>(null);
    const [menus, setMenus] = useState<IMenuInDB[]>([]); // Renombrado de userMenus a menus
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const publicAuthPaths = ['/login', '/forgot-password', '/reset-password'];

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        setUser(null);
        setMenus([]); // Renombrado de setUserMenus
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
                    getMeMenus()
                ]);
                setUser(userData);
                setMenus(menusData);
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
                getMeMenus()
            ]);
            
            setUser(userData);
            setMenus(menusData);
            setIsAuthenticated(true);

            // Lógica de redirección basada en el rol
            const userRoles = userData.persona?.roles || [];
            const isAdmin = userRoles.some(rol => rol.nombre_rol === 'Administrador');

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
        menus, // Renombrado de userMenus
        loading,
        error,
        login: loginUser,
        logout,
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