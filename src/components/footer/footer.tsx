import React from "react";
import { NavLink } from "react-router-dom";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <NavLink
            className="footer-link"
            to="https://rs.school/courses/javascript-preschool-ru"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img className="school-icon" src="/assets/rssLogo.svg" alt="RS School" />
          </NavLink>
          <div className="footer-links">
            <NavLink
              className="footer-link"
              to="https://github.com/vitali007tut"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img className="github-icon" src="/assets/github.svg" alt="GitHub Vitaliy" />
              <span>Vitaliy</span>
            </NavLink>
            <NavLink
              className="footer-link"
              to="https://github.com/kostyakuk"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img className="github-icon" src="/assets/github.svg" alt="GitHub Konstantin" />
              <span>Konstantin</span>
            </NavLink>
            <NavLink
              className="footer-link"
              to="https://github.com/SquallerQ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img className="github-icon" src="/assets/github.svg" alt="GitHub Eugeniy" />
              <span>Eugeniy</span>
            </NavLink>
          </div>
          <div className="footer-text">
            <p>Created in 2025</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
