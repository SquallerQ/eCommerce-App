import { Box } from "@mui/material";
import RegistrationForm from "./RegistrationForm";
import styles from "./styles.module.css";

export const RegisterPage = () => {
  return (
    <div className={styles.container}>
      <Box className={styles.wrapper}>
        <RegistrationForm />
      </Box>
    </div>
  );
};
