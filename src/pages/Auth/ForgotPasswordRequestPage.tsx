import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/Common/Input'; 
import Button from '../../components/Common/Button'; 
import LoadingSpinner from '../../components/Common/LoadingSpinner'; 
import { requestPasswordReset } from '../../services/authService';

 const ForgotPasswordRequestPage: React.FC = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await requestPasswordReset({ username_or_email: usernameOrEmail });
            setMessage(response.message || "Si el usuario existe, se ha enviado un código de recuperación.");
            setUsernameOrEmail(''); // Limpiar el campo después de la solicitud
        } catch (err: any) {
            console.error("Error al solicitar recuperación:", err);
            setError(err.response?.data?.detail || "Ha ocurrido un error. Inténtalo de nuevo más tarde.");
            setMessage(null); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Recuperar Contraseña</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4" role="alert">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de Usuario o Correo Electrónico
                        </label>
                        <Input
                            id="usernameOrEmail"
                            type="text"
                            placeholder="Tu nombre de usuario o email"
                            value={usernameOrEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsernameOrEmail(e.target.value)}
                            required
                            className="w-full"
                            disabled={loading}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
                        disabled={loading || !usernameOrEmail.trim()}
                    >
                        {loading ? <LoadingSpinner /> : "Enviar Código de Recuperación"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        ¿Ya tienes un código de recuperación?{' '}
                        <Link to="/reset-password" className="text-blue-600 hover:underline">
                            Restablecer contraseña aquí
                        </Link>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        <Link to="/login" className="text-blue-600 hover:underline">
                            Volver al inicio de sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordRequestPage;