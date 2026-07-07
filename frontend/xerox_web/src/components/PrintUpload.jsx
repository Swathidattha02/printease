import React, { useState, useContext } from 'react';
import { OrderContext } from '../context/OrderContext';

export default function PrintUpload() {
  const { setOrderPreview } = useContext(OrderContext);
  const [file, setFile] = useState(null);
  const [printType, setPrintType] = useState('BW');
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a PDF file');
    const form = new FormData();
    form.append('file', file);
    form.append('printType', printType);
    form.append('copies', copies);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/prints/upload`, { method: 'POST', body: form });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) return alert(data.error || 'Upload failed');
      setOrderPreview(data);
    } catch (err) {
      setLoading(false);
      alert('Upload error');
    }
  };

  return (
    <div style={{maxWidth:600, margin:'0 auto'}}>
      <h3>Upload PDF for Price Preview</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
        </div>
        <div>
          <label>Print Type: </label>
          <select value={printType} onChange={e => setPrintType(e.target.value)}>
            <option value="BW">B&amp;W (₹2/page)</option>
            <option value="Color">Color (₹4/page)</option>
          </select>
        </div>
        <div>
          <label>Copies: </label>
          <input type="number" min="1" value={copies} onChange={e => setCopies(e.target.value)} />
        </div>
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Calculating...' : 'Get Price'}</button>
        </div>
      </form>
    </div>
  );
}
