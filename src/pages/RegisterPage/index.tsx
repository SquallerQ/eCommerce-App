import { Box, Typography } from "@mui/material";
import RegistrationForm from "./RegistrationForm";
import styles from "./styles.module.css";

export const RegisterPage = () => {
  return (
    <div className={styles.container}>
      <Typography sx={{ mt: 3, mb: 2, color: "#282828" }} variant="h4">
        Create Account
      </Typography>
      <Box>
        <RegistrationForm />
      </Box>
    </div>
  );
};
