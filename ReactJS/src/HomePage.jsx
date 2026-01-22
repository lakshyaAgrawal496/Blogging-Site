import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import AOS from "aos";
import "aos/dist/aos.css";
import "./HomePage1.css";
import img1 from './assets/img1.webp';
import img2 from './assets/img2.webp';
import img3 from './assets/img3.webp';
import img4 from './assets/img4.webp';
import img5 from './assets/img5.jpg';
import img6 from './assets/img6.jpg';




export default function HomePage({ onNavigate, reports }) {
  const [sortedReports, setSortedReports] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Sort reports by newest first
  useEffect(() => {
    const sorted = [...reports].sort((a, b) => b.id - a.id);
    setSortedReports(sorted);
  }, [reports]);

  return (
    <div className="home-container">
      <Navbar onNavigate={onNavigate} />

      {/* Hero Section */}
      <header className="hero" data-aos="fade-up" data-aos-duration="1200">
        <div className="hero-content">
          <h1>Welcome to the NagarMitra Portal</h1>
          <p>
            Report civic issues like potholes, garbage, sewage, and street lights directly to the
            Municipal Corporation. Track issues and see updates from all citizens!
          </p>
          <button onClick={() => onNavigate("report")}>Report an Issue</button>
        </div>
      </header>
      <section className="statistics" data-aos="fade-up">
      <h2>Report Statistics</h2>
    <div className="stats-grid">
     <div className="stat-card" data-aos="zoom-in">
      <h3>Total Reports</h3>
      <p>{reports.length}</p>
     </div>
     <div className="stat-card" data-aos="zoom-in" data-aos-delay="200">
      <h3>In Progress</h3>
      <p>{reports.filter(r => r.status === "In Progress").length}</p>
     </div>
     <div className="stat-card" data-aos="zoom-in" data-aos-delay="400">
      <h3>Solved</h3>
      <p>{reports.filter(r => r.status === "Resolved").length}</p>
      </div>
     </div>
      </section>

      {/* Live Feed / Blog Section */}
      <section className="feed" data-aos="fade-up">
        <h2>Recent Reports</h2>
        {sortedReports.length === 0 ? (
          <p>No reports yet. Be the first to contribute!</p>
        ) : (
          <div className="feed-grid">
            {sortedReports.map((report) => (
              <div className="report-card" key={report.id} data-aos="fade-up">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                <p>
                  <strong>Category:</strong> {report.category}
                </p>
                <p>
                  <strong>Status:</strong> {report.status}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {report.location ? `${report.location[0].toFixed(3)}, ${report.location[1].toFixed(3)}` : "Not specified"}
                </p>
                {report.action && (
                  <p>
                    <strong>Admin Notes:</strong> {report.action}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="about" data-aos="fade-right">
        <h2>About Us</h2>
        <p>
          The Municipal Corporation is committed to transparency and civic engagement. Through this
          portal, all citizens can report issues, track their status, and see updates from both
          users and administrators.
        </p>
      </section>

    {/* Services Section */}
<section className="services" data-aos="zoom-in">
  <h2>Our Services</h2>
  <div className="service-grid">
    <div className="service-card">
      <img src={img1} alt="Road Maintenance" />
      <p>🚧 Road Maintenance</p>
    </div>
    <div className="service-card">
      <img src={img2} alt="Waste Management" />
      <p>🗑️ Waste Management</p>
    </div>
    <div className="service-card">
      <img src={img3} alt="Water Supply" />
      <p>💧 Water Supply</p>
    </div>
    <div className="service-card">
      <img src={img4} alt="Parks & Recreation" />
      <p>🌳 Parks & Recreation</p>
    </div>
    <div className="service-card">
      <img src={img5} alt="Street Lighting" />
      <p>💡 Street Lighting</p>
    </div>
    <div className="service-card">
      <img src={img6} alt="Sewage Management" />
      <p>🚰 Sewage Management</p>
    </div>
  </div>
</section>


      {/* How It Works Section */}
      <section className="how-it-works" data-aos="fade-up">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step" data-aos="fade-up" data-aos-delay="200">
            <h3>1. Report</h3>
            <p>Select the issue type, add location & details.</p>
          </div>
          <div className="step" data-aos="fade-up" data-aos-delay="400">
            <h3>2. Review</h3>
            <p>Our team verifies and assigns the issue.</p>
          </div>
          <div className="step" data-aos="fade-up" data-aos-delay="600">
            <h3>3. Resolve</h3>
            <p>Actions are taken and updates are posted.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" data-aos="fade-up">
        <h2>Contact Us</h2>
        <p>📍 Municipal Corporation Office, Main Street, City Center</p>
        <p>📞 Helpline: 1800-123-456</p>
        <p>📧 Email: support@municipalcorp.gov</p>
      </section>

      {/* Footer */}
      <footer className="footer" data-aos="fade-up">
        <p>© 2025 Municipal Corporation | All Rights Reserved</p>
      </footer>
    </div>
  );
}
