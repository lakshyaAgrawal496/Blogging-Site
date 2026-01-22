import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "./Admin.css";

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Hook for animated counters
function useCountUp(end, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 50);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 50);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
}

function Admin({ reports, onNavigate }) {
  const [localReports, setLocalReports] = useState(reports);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [mapView, setMapView] = useState(false);

  // Sync local state when parent updates reports
  useEffect(() => {
    setLocalReports(reports);
  }, [reports]);

  const updateReport = (id, newStatus, newAction) => {
    setLocalReports((prevReports) =>
      prevReports.map((report) =>
        report.id === id
          ? { ...report, status: newStatus, action: newAction }
          : report
      )
    );
  };

  // Filter + Search
  const filteredReports = localReports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(search.toLowerCase()) ||
      report.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      filterCategory === "All" || report.category === filterCategory;

    const matchesStatus =
      filterStatus === "All" || report.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="admin-wrapper">
      {/* Satellite Map Background */}
      <MapContainer
        center={[28.6139, 77.209]} // Replace with your city coordinates
        zoom={12}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          filter: "brightness(0.6) contrast(1.1)",
          pointerEvents: "none", // background map is non-interactive
        }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />
      </MapContainer>

      {/* Admin Content Overlay */}
      <div className="admin-content">
        {/* Navbar */}
        <nav className="admin-navbar">
          <h2 className="admin-logo">🏛 Municipal Admin</h2>
          <button className="logout-btn" onClick={() => onNavigate("home")}>
            Logout
          </button>
        </nav>

        {/* Dashboard */}
        <h1 className="admin-title">⚙️ Admin Dashboard</h1>
        <p className="admin-subtitle">
          Manage and take action on issues reported by citizens
        </p>

        {/* Stats Section */}
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Reports</h3>
            <p>{useCountUp(localReports.length)}</p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p>{useCountUp(localReports.filter((r) => r.status === "Pending").length)}</p>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <p>{useCountUp(localReports.filter((r) => r.status === "In Progress").length)}</p>
          </div>
          <div className="stat-card">
            <h3>Resolved</h3>
            <p>{useCountUp(localReports.filter((r) => r.status === "Resolved").length)}</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
          <button className={!mapView ? "active" : ""} onClick={() => setMapView(false)}>
            📋 List View
          </button>
          <button className={mapView ? "active" : ""} onClick={() => setMapView(true)}>
            🗺️ Map View
          </button>
        </div>

        {/* Filters */}
        {!mapView && (
          <div className="filters">
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Potholes">Potholes</option>
              <option value="Street Lights">Street Lights</option>
              <option value="Garbage">Garbage</option>
              <option value="Sewage">Sewage</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              className="reset-btn"
              onClick={() => {
                setSearch("");
                setFilterCategory("All");
                setFilterStatus("All");
              }}
            >
              Reset
            </button>
          </div>
        )}

        {/* Reports Grid */}
        {!mapView ? (
          <div className="reports-grid">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <div className="title-with-icon">
                      <div className="report-category-icon">
                        {report.category === "Potholes" && <span>🚧</span>}
                        {report.category === "Street Lights" && <span>💡</span>}
                        {report.category === "Garbage" && <span>🗑️</span>}
                        {report.category === "Sewage" && <span>🚰</span>}
                      </div>
                      <h2 className="report-title">{report.title}</h2>
                    </div>
                    <span className={`status ${report.status.toLowerCase()}`}>
                      {report.status}
                    </span>
                  </div>

                  <p className="report-description">{report.description}</p>

                  <p className="report-meta">
                    <strong>Category:</strong> {report.category}
                    {report.action && <> | <strong>Action:</strong> {report.action}</>}
                  </p>

                  <div className="report-actions">
                    <select
                      value={report.status}
                      onChange={(e) =>
                        updateReport(report.id, e.target.value, report.action)
                      }
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Action Taken"
                      value={report.action}
                      onChange={(e) =>
                        updateReport(report.id, report.status, e.target.value)
                      }
                    />

                    <button 
                      className="save-btn"
                      onClick={() => {
                        // Call API to update report
                        fetch("http://localhost:3000/api/admin/update-report", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            reportId: report.id,
                            status: report.status,
                            action: report.action,
                          }),
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            alert("Report updated successfully!");
                          } else {
                            alert("Failed to update report");
                          }
                        })
                        .catch(err => console.error(err));
                      }}
                    >
                      💾 Save
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No matching reports found.</p>
            )}
          </div>
        ) : (
          // Map View
          <MapContainer
            center={[28.6139, 77.209]}
            zoom={11}
            style={{ height: "600px", width: "100%", borderRadius: "12px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            />
            {filteredReports.map(
              (report) =>
                report.location && (
                  <Marker key={report.id} position={report.location}>
                    <Popup>
                      <b>{report.title}</b>
                      <br />
                      {report.description}
                      <br />
                      <i>Status: {report.status}</i>
                    </Popup>
                  </Marker>
                )
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export default Admin;
