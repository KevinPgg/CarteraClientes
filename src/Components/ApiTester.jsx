import { useState } from 'react';

export default function ApiTester() {
  const [request, setRequest] = useState({
    method: 'GET',
    url: '/api/',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: ''
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const commonEndpoints = [
    { label: 'GET /api/auth', value: '/api/auth' },
    { label: 'POST /api/auth/login', value: '/api/auth/login' },
    { label: 'GET /api/cartera/:cardCode', value: '/api/cartera/' },
    { label: 'GET /api/pedidos/:clienteorigen', value: '/api/pedidos/' },
    { label: 'GET /api/items', value: '/api/items' },
  ];

  const handleSendRequest = async () => {
    setLoading(true);
    setResponse(null);
    
    const startTime = Date.now();
    
    try {
      const headers = {};
      request.headers.forEach(h => {
        if (h.key && h.value) headers[h.key] = h.value;
      });

      const options = {
        method: request.method,
        headers
      };

      if (request.method !== 'GET' && request.body) {
        options.body = request.body;
      }

      const res = await fetch(request.url, options);
      const responseTime = Date.now() - startTime;
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: responseTime,
        headers: Object.fromEntries(res.headers.entries()),
        data
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setResponse({
        status: 0,
        statusText: 'Error',
        time: responseTime,
        error: error.message,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const addHeader = () => {
    setRequest({
      ...request,
      headers: [...request.headers, { key: '', value: '' }]
    });
  };

  const removeHeader = (index) => {
    const newHeaders = request.headers.filter((_, i) => i !== index);
    setRequest({ ...request, headers: newHeaders });
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...request.headers];
    newHeaders[index][field] = value;
    setRequest({ ...request, headers: newHeaders });
  };

  const loadPreset = (url) => {
    setRequest({ ...request, url });
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(request.body);
      setRequest({ ...request, body: JSON.stringify(parsed, null, 2) });
    } catch (e) {
      alert('JSON inválido');
    }
  };

  return (
    <div className="api-tester">
      <h4 className="mb-3">Probador de API</h4>
      
      {/* Presets rápidos */}
      <div className="mb-3">
        <label className="form-label fw-bold">Endpoints comunes:</label>
        <div className="d-flex flex-wrap gap-2">
          {commonEndpoints.map((endpoint, idx) => (
            <button
              key={idx}
              className="btn btn-sm btn-outline-secondary"
              onClick={() => loadPreset(endpoint.value)}
            >
              {endpoint.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request Config */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row mb-3 flex-column-baseline">
            <div className="col-md-2">
              <select
                className="form-select"
                value={request.method}
                onChange={(e) => setRequest({ ...request, method: e.target.value })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="/api/endpoint"
                value={request.url}
                onChange={(e) => setRequest({ ...request, url: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-primary w-100"
                onClick={handleSendRequest}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>

          {/* Headers */}
          <div className="row mb-3 flex-column-baseline">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-bold mb-0">Headers</label>
              <button className="btn btn-sm btn-outline-secondary" onClick={addHeader}>
                + Agregar Header
              </button>
            </div>
            {request.headers.map((header, idx) => (
              <div key={idx} className="row mb-2 flex-column-baseline">
                <div className="col-5">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Key"
                    value={header.key}
                    onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                  />
                </div>
                <div className="col-1">
                  <button
                    className="btn btn-sm btn-outline-danger w-100"
                    onClick={() => removeHeader(idx)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Body */}
          {request.method !== 'GET' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold mb-0">Body</label>
                <button className="btn btn-sm btn-outline-secondary" onClick={formatJson}>
                  Format JSON
                </button>
              </div>
              <textarea
                className="form-control font-monospace"
                rows="8"
                placeholder='{"key": "value"}'
                value={request.body}
                onChange={(e) => setRequest({ ...request, body: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-bold">Respuesta</span>
            <span className={`badge ${response.status >= 200 && response.status < 300 ? 'bg-success' : 'bg-danger'}`}>
              {response.status} {response.statusText} • {response.time}ms
            </span>
          </div>
          <div className="card-body">
            {response.error ? (
              <div className="alert alert-danger mb-0">
                <strong>Error:</strong> {response.error}
              </div>
            ) : (
              <>
                {/* Headers de respuesta */}
                <div className="mb-3">
                  <strong>Headers:</strong>
                  <pre className="bg-light p-2 mt-1 rounded font-monospace small">
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                </div>

                {/* Body de respuesta */}
                <div>
                  <strong>Body:</strong>
                  <pre className="bg-light p-3 mt-1 rounded font-monospace small" style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {typeof response.data === 'string'
                      ? response.data
                      : JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
