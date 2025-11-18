// src/pages/Auth/ResetPasswordPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { resetPassword } from '../../services/authService';

 const ResetPasswordPage: React.FC = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
    const [recoveryCode, setRecoveryCode] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        if (newPassword !== confirmNewPassword) {
            setError("Las contraseñas no coinciden.");
            setLoading(false);
            return;
        }

        try {
            const response = await resetPassword({
                username_or_email: usernameOrEmail,
                recovery_code: recoveryCode,
                new_password: newPassword,
            });
            setMessage(response.message || "Contraseña restablecida con éxito.");
            setUsernameOrEmail('');
            setRecoveryCode('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err: any) {
            console.error("Error al restablecer contraseña:", err);
            // Mensaje de error detallado del backend si está disponible, o uno genérico
            setError(err.response?.data?.detail || "Ha ocurrido un error al restablecer la contraseña. Verifica el código o solicita uno nuevo.");
            setMessage(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Restablecer Contraseña</h2>

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
                    <div>
                        <label htmlFor="recoveryCode" className="block text-sm font-medium text-gray-700 mb-1">
                            Código de Recuperación
                        </label>
                        <Input
                            id="recoveryCode"
                            type="text"
                            placeholder="Ingresa el código que recibiste"
                            value={recoveryCode}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecoveryCode(e.target.value)}
                            required
                            className="w-full"
                            disabled={loading}
                        />
                    </div>
                    <div>
                   
              <Input id="password" label="Nueva Contraseña" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Ingrese su nueva contraseña" autoComplete="new-password" />
              <Input id="confirm_password" label="Confirmar Contraseña" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required placeholder="Confirme su nueva contraseña" autoComplete="new-password" />
                    </div>


                    <Button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
                        disabled={loading || !usernameOrEmail.trim() || !recoveryCode.trim() || !newPassword.trim() || newPassword !== confirmNewPassword}
                    >
                        {loading ? <LoadingSpinner /> : "Restablecer Contraseña"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        ¿No recibiste el código?{' '}
                        <Link to="/forgot-password" className="text-blue-600 hover:underline">
                            Solicita uno nuevo
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

export default ResetPasswordPage;