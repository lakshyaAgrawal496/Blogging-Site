import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import "./LoginPage.css";

export default function LoginPage({ onNavigate }) {
  const [userUsername, setUserUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState("");

  const userCardRef = useRef(null);
  const adminCardRef = useRef(null);
  const bubblesRef = useRef([]);


  useEffect(() => {
    // Animate login cards on mount
    gsap.from([userCardRef.current, adminCardRef.current], {
      duration: 1,
      y: 50,
      opacity: 0,
      stagger: 0.3,
      ease: "power3.out",
    });


  bubblesRef.current.forEach((bubble, i) => {
      gsap.to(bubble, {
        y: -100 - Math.random() * 200,
        x: "+=" + (Math.random() * 100 - 50),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        duration: 5 + Math.random() * 3,
        delay: i * 0.3,
      });
    });
  }, []);

  const handleUserLogin = async () => {
    if (!userUsername || !userPassword) {
      setMessage("Please fill all fields (User)");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userUsername,
          password: userPassword,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage("Welcome User!");
        // Store token if needed, but cookie is set by backend
        onNavigate("report");
      } else {
        setMessage(data.error || "Invalid User credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  const handleAdminLogin = () => {
    if (!adminUsername || !adminPassword) {
      setMessage("Please fill all fields (Admin)");
      return;
    }
    // Keep admin hardcoded for now or add admin check in backend
    if (adminUsername === "admin" && adminPassword === "admin123") {
      setMessage("Welcome Admin!");
      onNavigate("admin");
    } else {
      setMessage("Invalid Admin credentials");
    }
  };

  return (
    <div className="login-container">
      {/* User Login Block */}
      <div
        ref={userCardRef}
        className="card6"
        onMouseEnter={() =>
          gsap.to(userCardRef.current, { scale: 1.05, duration: 0.3 })
        }
        onMouseLeave={() =>
          gsap.to(userCardRef.current, { scale: 1, duration: 0.3 })
        }
      >
        <h1>User Login</h1>

        <div>
          <label>Username</label>
          <input
            placeholder="Enter username"
            value={userUsername}
            onChange={(e) => setUserUsername(e.target.value)}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
          />
        </div>

        <button onClick={handleUserLogin}>Login as User</button>
      </div>

      {/* Admin Login Block */}
      <div
        ref={adminCardRef}
        className="card6"
        onMouseEnter={() =>
          gsap.to(adminCardRef.current, { scale: 1.05, duration: 0.3 })
        }
        onMouseLeave={() =>
          gsap.to(adminCardRef.current, { scale: 1, duration: 0.3 })
        }
      >
        <h1>Admin Login</h1>

        <div>
          <label>Username</label>
          <input
            placeholder="Enter username"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
        </div>

        <button onClick={handleAdminLogin}>Login as Admin</button>
      </div>

      {/* Message */}
      {message && <p className="message">{message}</p>}

      {/* Back to Home button */}
      <button className="back-btn" onClick={() => onNavigate("home")}>
        ⬅ Back to Home
      </button>
    </div>
  );
}
