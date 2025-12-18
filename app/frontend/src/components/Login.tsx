import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para controlar la carga
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true); // Activar el indicador de carga

    if (!userId) {
      setError('Por favor, introduce un ID de usuario.');
      setIsLoading(false); // Desactivar el indicador de carga
      return;
    }

    try {
      const response = await fetch(`/settings?user_id=${encodeURIComponent(userId)}`);
      if (response.ok) {
        // Usuario validado, navegar a la selección de activos
        navigate('/asset-selection');
      } else if (response.status === 404) {
        setError('Usuario no encontrado. Por favor, verifica tu ID.');
      } else {
        setError(`Error al validar usuario: ${response.status} ${response.statusText}`);
      }
    } catch (e: any) {
      setError(`Error de red: ${e.message}`);
    } finally {
      setIsLoading(false); // Desactivar el indicador de carga, independientemente del resultado
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Introduce tu ID de usuario"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        disabled={isLoading} // Deshabilitar el input mientras carga
      />
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'} {/* Mostrar un texto diferente mientras carga */}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Login;
