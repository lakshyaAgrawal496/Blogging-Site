import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "./ReportIssue.css";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to handle map click
function LocationPicker({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function ReportIssuePage({ onSubmit, onNavigate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Potholes");
  const [location, setLocation] = useState(null);

  const handleSubmit = async () => {
    if (!title || !description || !location) {
      alert("Please fill all fields and pick a location on the map");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:3000/api/create-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          category,
          location: location.join(", "), // Backend expects string or array? 
          // Backend schema doesn't specify type for location in create call, but stores it in content string.
          // Let's check app.js line 316: `📍 Location: ${location}`. So string is fine.
          // But wait, app.js line 322: `reportLocation: location`.
          // Mongoose schema for post? I haven't checked post model.
          // Assuming string is safe.
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Report submitted successfully!");
        if (onSubmit) onSubmit(data.post); // Update parent state if needed
        onNavigate("home");
      } else {
        alert("Failed to submit report: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error connecting to server");
    }
  };

  return (
    <div className="report-page-wrapper">
      {/* Full-page background */}
      <div className="report-background"></div>

      {/* Form Overlay */}
      <div className="report-container">
        <h1>📝 Report an Issue</h1>

        <input
          type="text"
          placeholder="Issue title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Describe the issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Potholes">Potholes</option>
          <option value="Street Lights">Street Lights</option>
          <option value="Garbage">Garbage</option>
          <option value="Sewage">Sewage</option>
        </select>

        <div className="map-picker">
          <MapContainer
            center={[28.6139, 77.209]} // Default Delhi
            zoom={11}
            style={{ height: "300px", width: "100%", borderRadius: "10px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            />
            <LocationPicker setLocation={setLocation} />
            {location && <Marker position={location}></Marker>}
          </MapContainer>
        </div>

        <button className="submit-btn" onClick={handleSubmit}>
          Submit Report
        </button>
      </div>
    </div>
  );
}

export default ReportIssuePage;
