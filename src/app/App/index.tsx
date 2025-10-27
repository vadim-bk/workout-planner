import { AuthProvider } from "@/contexts/AuthContext";
import { AppRouter } from "../AppRouter";

export const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};
