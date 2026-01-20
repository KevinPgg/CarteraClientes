/**
 * User Model - Corresponds to 'users' table
 * This model matches the actual database structure
 */
export class User {
  constructor(data = {}) {
    this.id = data.id;
    // Prisma devuelve camelCase, pero guardamos snake_case para coincidir con BD
    this.card_code = data.cardCode || data.card_code; // VARCHAR(25)
    this.card_name = data.cardName || data.card_name; // VARCHAR(150)
    this.tipo = data.tipo; // VARCHAR(1)
    this.notificacion = data.notificacion; // BOOLEAN
    this.email_ = data.email || data.email_ || []; // ARRAY
    this.password_ = data.password || data.password_; // TEXT (encrypted by DB trigger)
    this.usuario = data.usuario; // TEXT (username, unique)
  }

  /**
   * Safe object for sending to frontend (without password)
   */
  toSafeObject() {
    const { password_, ...safe } = this;
    return safe;
  }

  /**
   * For login response
   */
  toLoginResponse() {
    return {
      id: this.id,
      cardCode: this.card_code,
      cardName: this.card_name,
      tipo: this.tipo,
      usuario: this.usuario,
      email: this.email_ || [],
      notificacion: this.notificacion
    };
  }
}
