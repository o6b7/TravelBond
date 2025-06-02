import React from "react";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Brand Name */}
        <p className="footer-logo">TravelBond</p>

        {/* Navigation Links */}
        <div className="footer-nav">
          <a href="/dashboard">About</a>
          <a href="/dashboard">Privacy Policy</a>
          <a href="/dashboard">Terms of Service</a>
          <a href="/dashboard">Contact</a>
        </div>

        {/* Contact Details */}
        <div className="footer-contact">
          <p>
            <strong>Email:</strong> 
            <a href="mailto:qusaii.abdullah@gmail.com" style={{ color: 'white', textDecoration: 'none' }}>
              qusaii.abdullah@gmail.com
            </a>
          </p>
          <p><strong>Phone:</strong> +0 000 000 000</p>
          <p><strong>Address:</strong> 123 Travel Street, Adventure City, TX 78901</p>
        </div>

        {/* Copyright Information */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} TravelBond. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
