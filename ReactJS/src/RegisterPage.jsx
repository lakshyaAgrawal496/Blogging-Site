import { useState } from "react";
import './RegisterPage.css'
const adjectives = ["Cool", "Happy", "Smart", "Fast", "Brave"];
const animals = ["Tiger", "Lion", "Eagle", "Shark", "Panda"];

function generateAnonymousUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(100 + Math.random() * 900); // 3-digit number
  return `Anon_${adj}${animal}${number}`;
}


export default function RegisterPage({ onBackToLogin, onNavigate }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState(generateAnonymousUsername());
  const [email, setEmail] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendOtp = () => {
    if (!aadhar || aadhar.length !== 12 || !/^\d+$/.test(aadhar)) {
      setMessage("Enter a valid 12-digit Aadhar number");
      return;
    }

    // Simulate OTP (normally UIDAI sends SMS)
    const otpCode = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    setGeneratedOtp(otpCode);
    setIsOtpSent(true);
    setMessage(`OTP sent to your registered mobile (Demo OTP: ${otpCode})`);
  };

  const handleVerifyOtp = async () => {
    if (otp === generatedOtp.toString()) {
      // Proceed to register
      try {
        const response = await fetch("http://localhost:3000/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            name: fullName,
            age: 18, // Default age or add input
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setMessage("✅ OTP Verified! Registration successful");
          setTimeout(() => {
            onBackToLogin(); // Go to login
          }, 1500);
        } else {
          setMessage("❌ Registration failed: " + (data.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Registration error:", error);
        setMessage("❌ Error connecting to server");
      }
    } else {
      setMessage("❌ Invalid OTP, try again");
    }
  };

  return (
    <div className="card">
      <h1>User Registration</h1>

      <div>
        <label>Full Name</label>
        <input
          type="text"
          placeholder="Enter full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div>
        <label>Username</label>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label>Aadhar Number</label>
        <input
          type="text"
          placeholder="Enter 12-digit Aadhar"
          value={aadhar}
          onChange={(e) => setAadhar(e.target.value)}
        />
      </div>

      {!isOtpSent ? (
        <button onClick={handleSendOtp}>Send OTP</button>
      ) : (
        <>
          <div>
            <label>Enter OTP</label>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <button onClick={handleVerifyOtp}>Verify OTP</button>
        </>
      )}

      {message && <p className="message">{message}</p>}

      <p style={{ textAlign: "center", marginTop: "12px" }}>
        Already have an account?{" "}
        <span
          style={{ color: "#2563eb", cursor: "pointer" }}
          onClick={onBackToLogin}
        >
          Login here
        </span>
      </p>
       <button className="back-btn" onClick={() => onNavigate("home")}>
        ⬅ Back to Home
      </button>
    </div>
  );
}
