// src/Services/AuthService.js

/**
 * Autentica un usuario contra usuarios.json
 * @param {string} usuario - Usuario a validar
 * @param {string} contrasena - Contraseña a validar
 * @returns {Promise<{cardCode: string, cardName: string, tipo: string} | null>} Usuario o null
 */
export async function loginUser(usuario, contrasena) {
  if (!usuario || !contrasena) return null;

  try {
    const response = await fetch("/data/usuarios.json");
    const usuarios = await response.json();

    const user = usuarios.find(
      (u) => u.Usuario === usuario && u.Contrasena === contrasena
    );

    if (user) {
      return {
        cardCode: user.CardCode,
        cardName: user.CardName || user.Usuario,
        tipo: user.Tipo,
      };
    }

    return null;
  } catch (error) {
    console.error("Error en loginUser:", error);
    return null;
  }
}