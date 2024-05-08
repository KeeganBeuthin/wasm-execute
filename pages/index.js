import { useState, useEffect } from "react";
import { decode } from "@webassemblyjs/wasm-parser";
import { lowerI64Imports } from "@wasmer/wasm-transformer";

const WasmPage = () => {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [language, setLanguage] = useState("typescript");

  const executeTypeScriptWasm = async (buffer) => {
    try {
      const module = decode(buffer);
      console.log("Decoded Wasm module:", module);

      const imports = {
        env: {
          console_log: (ptr, length) => {
            const memory = instance.instance.exports.memory.buffer;
            const encodedString = new Uint8Array(memory, ptr, length);
            const decodedString = new TextDecoder().decode(encodedString);
            console.log(
              `Log argument:`,
              decodedString,
              `Type:`,
              typeof decodedString
            );
            setLogs((prevLogs) => [...prevLogs, decodedString]);
          },
          abort: () => console.log("Abort called"),
        },
      };

      const instance = await WebAssembly.instantiate(buffer, imports);
      console.log("Instantiated Wasm instance:", instance);
      console.log(
        "Exported functions:",
        Object.keys(instance.instance.exports)
      );

      instance.instance.exports.run();
      setResult("Wasm function executed successfully");
      setError("");
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    }
  };

  const executePythonWasm = async (buffer) => {
    try {
      const imports = {
        env: {
          log: (ptr, length) => {
            if (!instance.exports.memory) {
              console.error(
                "Memory is not exported from the WebAssembly module"
              );
              return;
            }
            const buffer = new Uint8Array(
              instance.exports.memory.buffer,
              ptr,
              length
            );
            const message = new TextDecoder().decode(buffer);
            console.log(message);
          },
        },
      };

      const module = await WebAssembly.compile(buffer);
      const instance = await WebAssembly.instantiate(module, imports);
      const exportedFunctions = instance.exports;

      exportedFunctions.helloWorld();

      setResult("Python Wasm function executed successfully");
      setError("");
    } catch (err) {
      console.error("Error executing Python Wasm:", err);
      setError(err.message);
    }
  };

  const executeJavaWasm = async (buffer) => {
    try {
      const imports = {
        env: {
          print: (ptr, length) => {
            const memory = instance.exports.memory.buffer;
            const string = new Uint8Array(memory, ptr, length);
            const message = new TextDecoder().decode(string);
            console.log(`${message}`);
            setLogs((prevLogs) => [...prevLogs, `${message}`]);
          },
        },
      };

      const module = await WebAssembly.compile(buffer);
      const instance = await WebAssembly.instantiate(module, imports);
      instance.exports.helloWorld();

      setResult("Java Wasm function executed successfully");
      setError("");
    } catch (err) {
      console.error("Error executing Java Wasm:", err);
      setError(err.message);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      console.log("Wasm file buffer:", buffer);

      switch (language) {
        case "typescript":
          executeTypeScriptWasm(buffer);
          break;
        case "python":
          executePythonWasm(buffer);
          break;
        case "java":
          executeJavaWasm(buffer);
          break;
        default:
          console.error("Unsupported language");
          setError("Selected language is not supported for execution");
      }
    } catch (err) {
      console.error("Error loading file:", err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>WebAssembly Execution</h1>
      <div>
        <label>Select Language: </label>
        <select onChange={(e) => setLanguage(e.target.value)} value={language}>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
      </div>
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
