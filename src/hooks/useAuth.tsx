import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login, getMe } from '../services/authService';
import { Token } from '../types/auth';
import { IUsuarioReadAudit } from '../types/usuario'; // Tu tipo de Usuario actualizado
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
    isAuthenticated: boolean;
    user: IUsuarioReadAudit | null;
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<IUsuarioReadAudit | null>(null);
    const [loading, setLoading] = useState(true); // Inicia en true para verificar el token al cargar
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Rutas que no requieren autenticación
    const publicAuthPaths = ['/login', '/forgot-password', '/reset-password'];

    // `logout` envuelto en `useCallback` para estabilidad
    const logout = useCallback(() => {
        setLoading(true); // Mostrar loading durante el logout para una mejor UX
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        setUser(null);
        setError(null);
        setLoading(false); // Desactivar loading después de limpiar
        navigate('/login', { replace: true });
    }, [navigate]);

    // `fetchUser` envuelto en `useCallback` para estabilidad
    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            // Si no hay token y no estamos en una ruta pública, redirigir a login
            if (!publicAuthPaths.includes(location.pathname)) {
                navigate('/login', { replace: true });
            }
            return; // Salir temprano si no hay token
        }

        // Si hay token, intentamos obtener el usuario
        setLoading(true); // Activar loading al inicio de la llamada
        try {
            const userData: IUsuarioReadAudit = await getMe();
            setUser(userData);
            setIsAuthenticated(true);
            setError(null); // Limpiar cualquier error previo
            // Si estamos en una ruta pública y obtenemos el usuario, redirigir a dashboard
            if (publicAuthPaths.includes(location.pathname)) {
                navigate('/dashboard', { replace: true });
            }
        } catch (err: any) {
            console.error("Token validation failed or user data fetch error:", err);
            localStorage.removeItem('accessToken');
            setIsAuthenticated(false);
            setUser(null);
            setError("Su sesión ha expirado o es inválida. Por favor, inicie sesión nuevamente."); // Mensaje de error para el usuario
            // Si el token falla y no estamos en una ruta pública, redirigir a login
            if (!publicAuthPaths.includes(location.pathname)) {
                navigate('/login', { replace: true });
            }
        } finally {
            setLoading(false); // Desactivar loading siempre al finalizar
        }
    }, [navigate, location.pathname, publicAuthPaths]);


    // Efecto principal para manejar la autenticación al cargar o cambiar la ubicación
    useEffect(() => {
        // En la primera carga, o si el token cambia, o si la ubicación cambia, verificamos la sesión.
        // Solo llamamos a fetchUser si no estamos cargando ya y hay un token, o si no hay token y no estamos autenticados.
        const currentToken = localStorage.getItem('accessToken');

        if (currentToken && !isAuthenticated) {
            // Si hay token pero no autenticado, intentar fetchUser
            fetchUser();
        } else if (!currentToken && isAuthenticated) {
            // Si no hay token pero estamos autenticados (estado inconsistente), hacer logout
            logout();
        } else if (!currentToken && !publicAuthPaths.includes(location.pathname)) {
            // Si no hay token, no estamos en ruta pública, y no autenticados, redirigir a login
            setLoading(false); // Ya que no hay fetch, se puede deshabilitar loading
            navigate('/login', { replace: true });
        } else {
            // Si ya estamos autenticados y tenemos token, o si estamos en una ruta pública sin token.
            setLoading(false); // Nada que cargar aquí
        }

        // Limpieza: Asegúrate de que no haya `null` en las dependencias y que todas las funciones de useCallback estén presentes.
    }, [isAuthenticated, location.pathname, navigate, logout, fetchUser, publicAuthPaths]);

    // Función de login (renombrada para evitar conflicto con la función local de React `login`)
    const loginUser = async (username: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const tokenData: Token = await login(username, password);
            localStorage.setItem('accessToken', tokenData.access_token);
            await fetchUser(); // Esto actualizará el estado `user` e `isAuthenticated`
            // La redirección a dashboard ya está manejada dentro de `fetchUser` si tiene éxito y estamos en una ruta pública
        } catch (err: any) {
            console.error("Login failed:", err);
            const errorMessage = err.response?.data?.detail || 'Error al iniciar sesión. Inténtelo de nuevo.';
            if (err.response?.status === 403) {
                setError(errorMessage); // Usuario bloqueado
            } else if (err.response?.status === 401) {
                setError(errorMessage); // Credenciales inválidas o usuario inactivo
            } else {
                setError('Error de conexión o de red. Inténtelo de nuevo.');
            }
            localStorage.removeItem('accessToken'); // Limpiar token en caso de fallo de login
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        isAuthenticated,
        user,
        loading,
        error,
        login: loginUser, // Exporta la función renombrada
        logout,
    };

    // Renderizado condicional para mostrar un mensaje de carga inicial
    // Solo muestra "Verificando sesión..." si estamos cargando Y NO estamos en una ruta pública
    if (loading && !publicAuthPaths.includes(location.pathname)) {
        return (
            <div className="flex justify-center items-center min-h-screen text-xl text-gray-700 bg-gray-50">
                Verificando sesión...
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