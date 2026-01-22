import "./AboutUs.css";

const AboutUs = () => {
  const developers = [
    {
      name: "Eugeniy Potapchuk",
      role: "Frontend dev",
      description: `Eugeniy is an enthusiastic developer with strong motivation.
        Implemented the catalog page, authorization and basket!`,
      photo: "/assets/evgeniy.jpg",
      github: "https://github.com/squallerq",
    },
    {
      name: "Vitali Rydkin",
      role: "Frontend dev",
      description: `If we talk about the most experienced developer in our team, it is Vitali.
         He configured routing and created registration in the application.`,
      photo: "/assets/vitaly.png",
      github: "https://github.com/vitali007tut",
    },
    {
      name: "Kanstantsin Kukushkin",
      role: "Team Lead / Frontend dev",
      description: `Configured repository setup and development environment configuration.
      Created profile page and about us`,
      photo: "/assets/kukushkin.jpg",
      github: "https://github.com/kostyakuk",
    },
  ];

  return (
    <div className="about-container">
      <h1 className="about-page-title">Our team:</h1>

      <div className="about-developer-grid">
        {developers.map((dev, index) => (
          <div key={dev.name || index} className="about-developer-card">
            <div className="about-avatar-container">
              <img src={dev.photo} alt={dev.name} className="about-avatar" />
            </div>
            <div className="about-card-content">
              <h3 className="about-developer-name">{dev.name}</h3>
              <div className="about-icon-container">
                <a
                  href={dev.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-github-button"
                  aria-label={`${dev.name} GitHub`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="about-github-icon"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.49v-1.7c-2.78.61-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75.99.8-.25 1.66-.38 2.52-.38.86 0 1.72.13 2.52.38 1.91-1.26 2.75-.99 2.75-.99.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.56 4.94.36.31.68.93.68 1.87v2.77c0 .27.16.58.67.49A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"
                      fill="#4a90e2"
                    />
                  </svg>
                </a>
              </div>
              <p className="about-role-text">{dev.role}</p>
              <p className="about-developer-description">{dev.description}</p>
              <a href={dev.github} target="_blank" rel="noopener noreferrer" className="about-github-link">
                View GitHub Profile
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="about-project-container">
        <p className="about-project-description">
          Our school exam project began a month ago with a three-person team. Today, we're proud to introduce a
          cutting-edge book purchasing and global delivery platform.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
