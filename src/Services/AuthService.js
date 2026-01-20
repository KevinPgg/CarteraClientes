/**
 * Autentica un usuario contra la API backend
 * @param {string} usuario - Usuario a validar
 * @param {string} contrasena - Contraseña a validar
 * @returns {Promise<{id, cardCode, cardName, tipo, usuario, email, notificacion} | null>} Usuario o null
 */
export async function loginUser(usuario, contrasena) {
  if (!usuario || !contrasena) return null;


  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usuario, contrasena }),
    });

    if (!response.ok) {
      console.warn(`Login failed with status ${response.status}`);
      return null;
    }

    const user = await response.json();
    console.log('✅ Backend response:', user);
    
    // El backend retorna: id, cardCode, cardName, tipo, usuario, email, notificacion
    if (user && user.cardCode) {
      console.log('✅ envio correcto')
      return {
        id: user.id,
        cardCode: user.cardCode,
        cardName: user.cardName,
        tipo: user.tipo,
        usuario: user.usuario,
        email: user.email || [],
        notificacion: user.notificacion,
      };
    }

    return null;
  } catch (error) {
    console.error("Error en loginUser:", error);
    return null;
  }
}