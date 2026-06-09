import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import CatalogPage from "./pages/CatalogPage";
import EquipamentoDetail from "./pages/EquipamentoDetail";
import AdminPage from "./pages/AdminPage";

import NotFound from "./pages/NotFound";
import OfflineBanner from "./components/OfflineBanner";

function App() {
  return (
    <>
      <Switch>
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
