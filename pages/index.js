import { useState } from "react";

const WasmPage = () => {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);

  const executeWasm = async (buffer) => {
    try {
      // Compile the WebAssembly module from the buffer
      const module = await WebAssembly.compile(buffer);
      let instance; // Declare instance here but define it below
  
      // Define imports object here, ensuring it's defined after instance is initialized
      const imports = {
        env: {
          // Generalized log function used by different languages
          log: (ptr, length) => {
            const memoryBuffer = new Uint8Array(instance.exports.memory.buffer, ptr, length);
            const message = new TextDecoder().decode(memoryBuffer);
            console.log(message);
            setLogs((prevLogs) => [...prevLogs, message]);
          },
          console_log: (ptr, length) => imports.env.log(ptr, length), // Redirect to generic log for TypeScript
          print: (ptr, length) => imports.env.log(ptr, length),        // Redirect to generic log for Java
          abort: () => console.error("Aborted")                         // Common abort function
        },
      };
  
      // Instantiate the WASM module with the imports
      instance = await WebAssembly.instantiate(module, imports);
  
      // Dynamically call the main function or handle known exported functions
      const exportedFunction = instance.exports.main || instance.exports.helloWorld || instance.exports.run;
      if (exportedFunction) {
        exportedFunction(); // Execute the function based on its presence
        setResult("WASM function executed successfully");
      } else {
        throw new Error("No known function to execute found in the WASM module");
      }
      setError("");
    } catch (err) {
      console.error("Error executing WASM:", err);
      setError(err.message);
    }
  };
  

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      console.log("WASM file buffer:", buffer);
      executeWasm(buffer);
    } catch (err) {
      console.error("Error loading file:", err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>WebAssembly Execution</h1>
      <input type="file" accept=".wasm" onChange={handleFileChange} />
      {error && <p style={{ color: "red" }}>{error}</p>}
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
