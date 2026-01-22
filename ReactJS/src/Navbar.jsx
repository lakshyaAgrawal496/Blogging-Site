import "./Navbar.css";
import Logo from './assets/logo.jpg';

export default function Navbar({ onNavigate }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 className="logo"><img src={Logo}/></h2>
      </div>
      <div className="navbar-right">
        <button onClick={() => onNavigate("register")}>Register</button>
        <button onClick={() => onNavigate("login")}>Login</button>
        <button onClick={() => onNavigate("faqs")}>FAQs</button>
        <button onClick={() => onNavigate("about")}>About Us</button>
      </div>
    </nav>
  );
}
