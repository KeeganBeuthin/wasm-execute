import { useState } from 'react';
import { decode } from '@webassemblyjs/wasm-parser';

const WasmPage = () => {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      console.log('Wasm file buffer:', buffer);

      const module = decode(buffer);
      console.log('Decoded Wasm module:', module);

      const imports = {
        env: {
          console_log: (ptr, length) => {
            const memory = instance.instance.exports.memory.buffer;
            const encodedString = new Uint8Array(memory, ptr, length);
            const decodedString = new TextDecoder().decode(encodedString);
            console.log(`Log argument:`, decodedString, `Type:`, typeof decodedString);
            setLogs((prevLogs) => [...prevLogs, decodedString]);
          },
          abort: () => console.log('Abort called'),
        },
      };

      const instance = await WebAssembly.instantiate(buffer, imports);
      console.log('Instantiated Wasm instance:', instance);
      console.log('Exported functions:', Object.keys(instance.instance.exports));

      // Execute your Wasm function here and update the result state
      instance.instance.exports.run();
      setResult('Wasm function executed successfully');
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setError('');
    }
  };

  return (
    <div>
      <h1>WebAssembly Execution</h1>
      <input type="file" accept=".wasm" onChange={handleFileChange} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && <p>Result: {result}</p>}
      {logs.length > 0 && (
        <div>
          <h2>Console Logs:</h2>
          <ul>
            {logs.map((log, index) => (
              <li key={index}>{log}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WasmPage;