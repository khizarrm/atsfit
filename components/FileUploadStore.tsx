// FileUploadToVariable.tsx
import React, { useRef } from "react";

const FileUploadToVariable: React.FC = () => {
  // This ref will hold the file text
  const fileTextRef = useRef<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      // Optionally handle error
      return;
    }

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (typeof event.target?.result === "string") {
        fileTextRef.current = event.target.result;
        // fileTextRef.current now contains the file's text
        // You can use fileTextRef.current here or elsewhere
        console.log("File text:", fileTextRef.current);
      }
    };
    reader.readAsText(file);
  };

  return (
    <input type="file" accept=".txt" onChange={handleFileChange} />
  );
};

export default FileUploadToVariable;
