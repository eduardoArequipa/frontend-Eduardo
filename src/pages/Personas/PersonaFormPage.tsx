// src/pages/Personas/PersonaFormPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PersonaForm from '../../components/Common/PersonaForm'; // <-- ¡NUESTRO NUEVO COMPONENTE!

const PersonaFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const personaId = id ? parseInt(id, 10) : undefined;

  const handleSuccess = () => {
    alert(id ? 'Persona actualizada con éxito' : 'Persona creada con éxito');
    navigate('/personas');
  };

  const handleCancel = () => {
    navigate('/personas');
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md">
      <PersonaForm
        personaId={personaId}
        mode="full"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showTitle={true}
        showCancelButton={true}
      />
    </div>
  );
};

export default PersonaFormPage;