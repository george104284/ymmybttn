import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

export function Import() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const selectFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{
        name: "CSV",
        extensions: ["csv"]
      }]
    });

    if (selected && typeof selected === "string") {
      setSelectedFile(selected);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    try {
      // TODO: Implement actual import logic
      console.log("Importing file:", selectedFile);
      
      // Simulate import
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert("Import completed successfully!");
      setSelectedFile(null);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please check the file format.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Import Prices</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Import CSV Price File</h2>
            <p className="text-gray-600 mb-6">
              Upload a CSV file containing distributor prices. The file should include
              columns for item code, description, case price, pack size, and unit of measure.
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {selectedFile ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Selected file:</p>
                <p className="font-medium mb-4">{selectedFile}</p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <button
                  onClick={selectFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Select CSV File
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  or drag and drop a file here
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setSelectedFile(null)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={!selectedFile || importing}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              disabled={!selectedFile || importing}
            >
              {importing ? "Importing..." : "Import Prices"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">CSV Format Guidelines:</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>First row should contain column headers</li>
          <li>Required columns: Item Code, Description, Case Price</li>
          <li>Optional columns: Pack Size, Unit of Measure, Brand</li>
          <li>Prices should be numeric values without currency symbols</li>
          <li>File should be UTF-8 encoded</li>
        </ul>
      </div>
    </div>
  );
}