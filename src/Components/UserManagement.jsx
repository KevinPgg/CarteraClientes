import { useState, useEffect } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
    cardCode: '',
    cardName: '',
    tipo: 'C',
    email: [''],
    notificacion: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/users');
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      usuario: '',
      password: '',
      cardCode: '',
      cardName: '',
      tipo: 'C',
      email: [''],
      notificacion: false
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      usuario: user.usuario,
      password: '', // No mostrar contraseña
      cardCode: user.cardCode || '',
      cardName: user.cardName || '',
      tipo: user.tipo || 'C',
      email: Array.isArray(user.email) ? user.email : [user.email || ''],
      notificacion: user.notificacion || false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `/api/auth/users/${editingUser.id}` : '/api/auth/users';
      
      const body = { ...formData };
      if (!body.password) delete body.password; // No enviar si está vacío en edición

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la operación');
      }

      alert(editingUser ? 'Usuario actualizado' : 'Usuario creado');
      setShowModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar usuario');

      alert('Usuario eliminado');
      loadUsers();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...formData.email];
    newEmails[index] = value;
    setFormData({ ...formData, email: newEmails });
  };

  const addEmailField = () => {
    setFormData({ ...formData, email: [...formData.email, ''] });
  };

  const removeEmailField = (index) => {
    const newEmails = formData.email.filter((_, i) => i !== index);
    setFormData({ ...formData, email: newEmails });
  };

  return (
    <div className="user-management">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Gestión de Usuarios</h4>
        <button className="btn btn-primary btn-sm" onClick={handleCreate}>
          + Nuevo Usuario
        </button>
      </div>

      {loading && <div className="alert alert-info">Cargando...</div>}

      <div className="table-responsive" style={{boxShadow:"0px 0px 6px 2px rgb(199 189 135)"}}>
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Código</th>
              <th>Tipo</th>
              <th>Email</th>
              <th>Notif.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.usuario}</td>
                <td>{user.cardName}</td>
                <td>{user.cardCode}</td>
                <td>
                  <span className={`badge bg-${user.tipo === 'S' ? 'danger' : user.tipo === 'A' ? 'warning' : 'secondary'}`}>
                    {user.tipo === 'S' ? 'Sistema' : user.tipo === 'A' ? 'Admin' : 'Cliente'}
                  </span>
                </td>
                <td>{Array.isArray(user.email) ? user.email.join(', ') : user.email}</td>
                <td>{user.notificacion ? '✅' : '❌'}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(user)}>
                    Editar
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(user.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="user-modal-overlay">
          <div className="modal show d-block" style={{ backgroundColor: 'transparent' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h5>
                  {/* <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button> */}
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Usuario*</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.usuario}
                          onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Contraseña{editingUser ? '' : '*'}</label>
                        <input
                          type="password"
                          className="form-control"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required={!editingUser}
                          placeholder={editingUser ? 'Dejar vacío para no cambiar' : ''}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Código Cliente</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.cardCode}
                          onChange={(e) => setFormData({ ...formData, cardCode: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nombre Cliente</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.cardName}
                          onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tipo*</label>
                        <select
                          className="form-select"
                          value={formData.tipo}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                          required
                        >
                          <option value="C">Cliente</option>
                          <option value="A">Administrador</option>
                          <option value="S">Sistema</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">
                          <input
                            type="checkbox"
                            checked={formData.notificacion}
                            onChange={(e) => setFormData({ ...formData, notificacion: e.target.checked })}
                            className="form-check-input me-2"
                          />
                          Notificaciones habilitadas
                        </label>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Emails</label>
                      {formData.email.map((email, index) => (
                        <div key={index} className="input-group mb-2">
                          <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            placeholder="correo@ejemplo.com"
                          />
                          {formData.email.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => removeEmailField(index)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addEmailField}>
                        + Agregar Email
                      </button>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
