import { useState } from 'react';
import UserManagement from './UserManagement';
import ApiTester from './ApiTester';
import PoblarBase from './PoblarBase';

export default function Sistemas() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="sistemas-container">
      <h3 className="mb-3">Panel de Sistemas</h3>
      
      {/* Sub-tabs */}
      <ul className="nav nav-tabs mb-4" id="sistemasUl">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuarios
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            🔌 API Tester
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'poblar' ? 'active' : ''}`}
            onClick={() => setActiveTab('poblar')}
          >
            📥 Poblar Base
          </button>
        </li>
      </ul>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'api' && <ApiTester />}
        {activeTab === 'poblar' && <PoblarBase />}
      </div>
    </div>
  );
}
