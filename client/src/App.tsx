import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import CatalogPage from "./pages/CatalogPage";
import EquipamentoDetail from "./pages/EquipamentoDetail";
import AdminPage from "./pages/AdminPage";
import LoginDepartamento from "./pages/LoginDepartamento";
import CadastroDepartamento from "./pages/CadastroDepartamento";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import OfflineBanner from "./components/OfflineBanner";

function App() {
  return (
    <>
      <Switch>
        <Route path="/login-departamento" component={LoginDepartamento} />
        <Route path="/cadastro-departamento" component={CadastroDepartamento} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/" component={CatalogPage} />
        <Route path="/equipamento/:id" component={EquipamentoDetail} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster richColors position="top-right" />
      <OfflineBanner />
    </>
  );
}

export default App;
