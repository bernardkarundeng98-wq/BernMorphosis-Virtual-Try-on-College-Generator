import React, { useState } from "react";

export default function App() {
  const [image, setImage] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  const handleReset = () => {
    setImage(null);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center" }}>
      {/* Navbar */}
      <header
        style={{
          background: "#222",
          color: "white",
          padding: "1rem",
          marginBottom: "2rem",
        }}
      >
        <h1>👕 Virtual Try-On Generator</h1>
      </header>

      {/* Upload Area */}
      <section>
        <h2>Upload Foto Baju Kamu</h2>
        <input type="file" accept="image/*" onChange={handleUpload} />
      </section>

      {/* Preview Area */}
      {image && (
        <section style={{ marginTop: "2rem" }}>
          <h3>Preview:</h3>
          <img
            src={image}
            alt="Uploaded"
            style={{ maxWidth: "300px", border: "2px solid #ccc" }}
          />
          <br />
          <button
            onClick={handleReset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "red",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Reset Gambar
          </button>
        </section>
      )}
    </div>
  );
}
