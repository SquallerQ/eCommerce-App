import React, { useState } from "react";
import styles from "./styles.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { IconButton, Drawer, Box, Badge } from "@mui/material";
import { useCookieManager } from "../../hooks/useCookieManager";
import MenuIcon from "@mui/icons-material/Menu";

const Header = () => {
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const { totalLineItemQuantity } = useCart();
  const { removeCookie } = useCookieManager();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    removeCookie("access_token");
    removeCookie("refresh_token");
    removeCookie("scope");
    removeCookie("token_type");
    localStorage.removeItem("anonymousCartId");
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const handleProfileClick = () => {
    if (mobileOpen) closeMobileMenu();
    navigate("/profile");
  };

  const handleCartClick = () => {
    if (mobileOpen) closeMobileMenu();
    navigate("/cart");
  };

  const renderNavLinks = (isMobile = false) => (
    <>
      <div className={styles.navButtons}>
        <NavLink
          to="/main"
          end
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.linkDisabled : ""}`}
          onClick={isMobile ? closeMobileMenu : undefined}
        >
          <Button
            variant="contained"
            fullWidth
            sx={{
              mb: isMobile ? 1 : 0,
              backgroundColor: "#4a06a9",
              textTransform: "none",
              transition: "background-color 0.3s ease",
              "&:hover": {
                backgroundColor: "#280057",
              },
            }}
          >
            Home
          </Button>
        </NavLink>
        <NavLink
          to="/catalog"
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.linkDisabled : ""}`}
          onClick={isMobile ? closeMobileMenu : undefined}
        >
          <Button
            variant="contained"
            fullWidth
            sx={{
              mb: isMobile ? 1 : 0,
              backgroundColor: "#4a06a9",
              textTransform: "none",
              transition: "background-color 0.3s ease",
              "&:hover": {
                backgroundColor: "#280057",
              },
            }}
          >
            Catalog
          </Button>
        </NavLink>
        <NavLink
          to="/about-us"
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.linkDisabled : ""}`}
          onClick={isMobile ? closeMobileMenu : undefined}
        >
          <Button
            variant="contained"
            fullWidth
            sx={{
              mb: isMobile ? 1 : 0,
              backgroundColor: "#4a06a9",
              textTransform: "none",
              transition: "background-color 0.3s ease",
              "&:hover": {
                backgroundColor: "#280057",
              },
            }}
          >
            About Us
          </Button>
        </NavLink>
      </div>
      <div className={`${styles.navIcons} ${isMobile ? styles.navIconsMobile : ""}`}>
        {!isLoggedIn ? (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.linkDisabled : ""}`}
              end
              onClick={isMobile ? closeMobileMenu : undefined}
            >
              <Button
                variant="contained"
                fullWidth
                sx={{
                  mb: isMobile ? 1 : 0,
                  backgroundColor: "#4a06a9",
                  textTransform: "none",
                  transition: "background-color 0.3s ease",
                  "&:hover": {
                    backgroundColor: "#280057",
                  },
                }}
              >
                Login
              </Button>
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.linkDisabled : ""}`}
              onClick={isMobile ? closeMobileMenu : undefined}
            >
              <Button
                variant="contained"
                fullWidth
                sx={{
                  mb: isMobile ? 1 : 0,
                  backgroundColor: "#4a06a9",
                  textTransform: "none",
                  transition: "background-color 0.3s ease",
                  "&:hover": {
                    backgroundColor: "#280057",
                  },
                }}
              >
                Register
              </Button>
            </NavLink>
          </>
        ) : (
          <>
            <IconButton
              aria-label="profile"
              color="primary"
              sx={{
                p: 0.5,
                color: "#020202",
                "&:hover": {
                  backgroundColor: "rgba(74, 6, 169, 0.1)",
                },
              }}
              onClick={isMobile ? handleProfileClick : handleProfileClick}
            >
              <PersonOutlineIcon sx={{ fontSize: 26 }} />
            </IconButton>
            <IconButton
              aria-label="logout"
              color="primary"
              sx={{
                p: 0.5,
                color: "#020202",
                "&:hover": {
                  backgroundColor: "rgba(74, 6, 169, 0.1)",
                },
              }}
              onClick={isMobile ? handleLogout : handleLogout}
            >
              <LogoutIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </>
        )}
        <IconButton
          aria-label="cart"
          color="primary"
          sx={{
            p: 0.5,
            color: "#020202",
            "&:hover": {
              backgroundColor: "rgba(74, 6, 169, 0.1)",
            },
          }}
          onClick={isMobile ? handleCartClick : handleCartClick}
        >
          <Badge badgeContent={totalLineItemQuantity} color="secondary" sx={{ fontSize: "8px" }}>
            <ShoppingCartIcon sx={{ fontSize: 24 }} />
          </Badge>
        </IconButton>
      </div>
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <NavLink to="/main" className={styles.logoLink}>
          <div className={styles.logoContainer}>
            <img src="/assets/logo.png" alt="Book Garden Logo" className={styles.logo} />
            <span className={styles.logoText}>Book Garden</span>
          </div>
        </NavLink>

        <div className={styles.desktopNav}>{renderNavLinks()}</div>

        <IconButton
          sx={{
            display: { xs: "flex", md: "none" },
            color: "inherit",
            p: 0.5,
          }}
          aria-label="menu"
          edge="end"
          onClick={handleDrawerToggle}
        >
          <MenuIcon sx={{ fontSize: 32 }} />
        </IconButton>

        <Drawer anchor="right" open={mobileOpen} onClose={handleDrawerToggle}>
          <Box className={styles.mobileMenuContainer}>{renderNavLinks(true)}</Box>
        </Drawer>
      </div>
    </header>
  );
};

export default Header;
