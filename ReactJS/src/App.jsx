import React, { useState } from "react";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Admin from "./Admin";
import ReportIssue from "./ReportIssue";

// (you can create simple placeholder components for FAQs and About Us)

const FAQsPage = () => <h2 style={{ textAlign: "center", marginTop: "40px" }}>FAQs Page</h2>;
const AboutPage = () => <h2 style={{ textAlign: "center", marginTop: "40px" }}>About Us Page</h2>;

const App = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [reports, setReports] = useState([]); // store all reports here

   const handleSubmitReport = (newReport) => {
    setReports([...reports, newReport]);
  };
  // Function to switch pages
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/feed");
        const data = await response.json();
        
        if (data.posts) {
          // Filter only reports and map to expected format
          const formattedReports = data.posts
            .filter(post => post.isReport)
            .map(post => {
              let location = null;
              if (post.reportLocation) {
                // Try to parse location string back to array
                const parts = post.reportLocation.split(",").map(Number);
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  location = parts;
                }
              }
              
              return {
                id: post._id,
                title: post.reportTitle || "Untitled",
                description: post.content.split("\n\n")[1] || post.content, // Extract description from content
                category: post.reportCategory || "General",
                status: post.reportStatus || "Pending",
                location: location,
                action: "", // Admin action not yet in API
              };
            });
          setReports(formattedReports);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };
    
    fetchReports();
  }, []);

  const handleAddReport = (newReport) => {
    // Optimistic update or refetch
    setReports((prev) => [newReport, ...prev]);
  };


  return (
    <div>
      {currentPage === "home" && <HomePage onNavigate={handleNavigate} reports={reports}/>}
      {currentPage === "login" && <LoginPage onNavigate={handleNavigate}/>}
      {currentPage === "register" && <RegisterPage onNavigate={handleNavigate}/>}
      {currentPage === "faqs" && <FAQsPage />}
      {currentPage === "about" && <AboutPage />}
      {currentPage === "admin" && (<Admin reports={reports} onNavigate={handleNavigate} />)}
      {currentPage === "report" &&( <ReportIssue onSubmit={handleSubmitReport} onNavigate={handleNavigate} />)}
    </div>
  );
};

export default App;
