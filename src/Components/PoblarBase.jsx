import { useState } from 'react';

const DELIMITERS = [
  { label: 'Punto y coma (;)', value: ';' },
  { label: 'Coma (,)', value: ',' },
  { label: 'Barra vertical (|)', value: '|' },
  { label: 'Tabulación (tab)', value: '\t' },
];

export default function PoblarBase() {
  const [file, setFile] = useState(null);
  const [delimiter, setDelimiter] = useState(';');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setResult(null);
    setError(null);
    if (selected && !selected.name.toLowerCase().endsWith('.csv')) {
      setError('Debe seleccionar un archivo .csv');
      setFile(null);
      return;
    }
    setFile(selected || null);
  };

  const readFileText = (fileToRead) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsText(fileToRead, 'utf-8');
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    if (!file) {
      setError('Selecciona un archivo .csv');
      return;
    }

    try {
      setLoading(true);
      const content = await readFileText(file);

      const response = await fetch('/api/tools/import-cartera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          delimiter,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poblar-base">
      <div className="poblar-header">
        <div>
          <h4>Poblar Base</h4>
          <p className="text-muted">Sube el CSV de cartera y elegimos el delimitador correcto.</p>
          <p className="text-muted"><strong>Tabla destino:</strong> cartera</p>
        </div>
      </div>

      <form className="poblar-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Archivo CSV</label>
          <input
            type="file"
            accept=".csv"
            className="form-control"
            onChange={handleFileChange}
          />
          {file && <small className="text-muted">Seleccionado: {file.name}</small>}
        </div>

        <div className="form-group">
          <label className="form-label">Delimitador</label>
          <div className="delimiter-options">
            {DELIMITERS.map((opt) => (
              <label key={opt.value} className={`chip ${delimiter === opt.value ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="delimiter"
                  value={opt.value}
                  checked={delimiter === opt.value}
                  onChange={() => setDelimiter(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Importando...' : 'Importar CSV'}
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-danger mt-3">
          {error}
        </div>
      )}

      {result && (
        <div className="result-card mt-3">
          <div className="result-header">
            <strong>Importación completada</strong>
            <span className="badge bg-success">OK</span>
          </div>
          <div className="result-body">
            <p><strong>Archivo:</strong> {result.fileName}</p>
            {result.table && <p><strong>Tabla:</strong> {result.table}</p>}
            <p><strong>Delimitador:</strong> {JSON.stringify(result.delimiter)}</p>
            <p><strong>Filas leídas:</strong> {result.read}</p>
            <p><strong>Filas insertadas:</strong> {result.inserted}</p>
            <p><strong>Filas eliminadas:</strong> {result.deleted}</p>
            <p><strong>Tiempo:</strong> {result.elapsed} ms</p>
            {result.sequenceReset === false && (
              <p className="text-warning">No se pudo resetear la secuencia. Los IDs continuarán.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
