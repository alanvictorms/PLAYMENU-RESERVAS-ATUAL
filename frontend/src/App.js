import "@/App.css";
import "@/booking.css";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { isReservedSlug } from "./constants/reservedSlugs";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useTestIds } from "./hooks/useTestIds";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RestaurantLayout } from "./components/RestaurantLayout";
import { AdminLayout } from "./components/AdminLayout";
import Landing from "./pages/Landing";
import { ForgotPage, LoginPage, RegisterPage, VerifyPage } from "./pages/AuthPages";
import PublicMenu from "./pages/PublicMenu";
import WizardPage from "./pages/WizardPage";
import BioBuilderPage from "./pages/BioBuilderPage";
import MenuImportPage from "./pages/MenuImportPage";
import PublicBioPage from "./pages/PublicBioPage";
import QrKitPage from "./pages/QrKitPage";
import ReservationsPage from "./pages/ReservationsPage";
import { ReservationStatusPage, WaitlistStatusPage } from "./pages/BookingPublicPages";
import QrTemplatesPage from "./pages/QrTemplatesPage";
import SuperSettingsPage from "./pages/SuperSettingsPage";
import SuperRestaurantDetailPage from "./pages/SuperRestaurantDetailPage";
import { CategoriesPage, EstablishmentsPage, GalleryPage, MetricsPage, PaymentPage, ProductFormPage, ProductsPage, ProfilePage, RestaurantDashboard, ReviewsPage, SettingsPage, SubscriptionPage, VideoRequestPage } from "./pages/RestaurantPages";
import { AgentDashboardPage, AgentRestaurantsPage, CommissionRulesPage, CommissionsPage, MapPage, MaterialsPage, PlansPage, PlatformSettingsPage, RepresentativesPage, SuperAgentsPage, SuperDashboardPage, SuperMaterialsPage, SuperRestaurantsPage, SuperWithdrawalsPage, VideoRequestDetailPage, VideoRequestsAdminPage, WithdrawPage } from "./pages/ManagementPages";

const Logout = () => { const { logout } = useAuth(); logout(); return <Navigate to="/login" replace />; };
// Links curtos: playmenu.app/<restaurante> e playmenu.app/<restaurante>/<pagina-bio>.
// Como são rotas coringa, qualquer caminho interno desconhecido cairia aqui — a lista
// de segmentos reservados devolve essas URLs para a home em vez de buscar um cardápio.
const ShortLink = ({ children }) => { const { restaurantSlug } = useParams(); return isReservedSlug(restaurantSlug) ? <Navigate to="/" replace /> : children; };
const TestIdBridge = () => { useTestIds(); return null; };
const secure = (roles, node) => <ProtectedRoute roles={roles}>{node}</ProtectedRoute>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TestIdBridge />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/superadmin/login" element={<LoginPage />} />
          <Route path="/reserva/:token" element={<ReservationStatusPage />} />
          <Route path="/fila/:token" element={<WaitlistStatusPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<ForgotPage />} />
          <Route path="/validar-email" element={<VerifyPage />} />
          <Route path="/cardapio" element={<PublicMenu />} />
          <Route path="/cardapio/preview" element={<PublicMenu preview />} />
          <Route path="/bio/:restaurantSlug/:pageSlug" element={<PublicBioPage />} />
          <Route path="/admin/configuracao-inicial" element={secure(["restaurant"], <WizardPage />)} />
          <Route element={secure(["restaurant"], <RestaurantLayout />)}>
            <Route path="/admin" element={<RestaurantDashboard />} />
            <Route path="/admin/categorias" element={<CategoriesPage />} />
            <Route path="/admin/produtos" element={<ProductsPage />} />
            <Route path="/admin/produto" element={<ProductFormPage />} />
            <Route path="/admin/reservas" element={<ReservationsPage />} />
            <Route path="/admin/importar-cardapio" element={<MenuImportPage />} />
            <Route path="/admin/qr-code" element={<QrKitPage />} />
            <Route path="/admin/estabelecimentos" element={<EstablishmentsPage />} />
            <Route path="/admin/configuracoes" element={<SettingsPage />} />
            <Route path="/admin/perfil" element={<ProfilePage />} />
            <Route path="/admin/avaliacoes" element={<ReviewsPage />} />
            <Route path="/admin/assinatura" element={<SubscriptionPage />} />
            <Route path="/admin/pagamento" element={<PaymentPage />} />
            <Route path="/admin/metricas" element={<MetricsPage />} />
            <Route path="/admin/videos" element={<VideoRequestPage />} />
            <Route path="/admin/galeria" element={<GalleryPage />} />
            <Route path="/admin/link-in-bio" element={<BioBuilderPage />} />
          </Route>
          <Route element={secure(["gerente"], <AdminLayout />)}>
            <Route path="/gerente" element={<AgentDashboardPage />} />
            <Route path="/gerente/representantes" element={<RepresentativesPage />} />
            <Route path="/gerente/restaurantes" element={<AgentRestaurantsPage />} />
            <Route path="/gerente/mapa" element={<MapPage />} />
            <Route path="/gerente/materiais" element={<MaterialsPage />} />
            <Route path="/gerente/comissoes" element={<CommissionsPage />} />
            <Route path="/gerente/saque" element={<WithdrawPage />} />
          </Route>
          <Route element={secure(["representante"], <AdminLayout />)}>
            <Route path="/representante" element={<AgentDashboardPage />} />
            <Route path="/representante/restaurantes" element={<AgentRestaurantsPage />} />
            <Route path="/representante/mapa" element={<MapPage />} />
            <Route path="/representante/materiais" element={<MaterialsPage />} />
            <Route path="/representante/comissoes" element={<CommissionsPage />} />
            <Route path="/representante/saque" element={<WithdrawPage />} />
          </Route>
          <Route element={secure(["superadmin"], <AdminLayout />)}>
            <Route path="/superadmin" element={<SuperDashboardPage />} />
            <Route path="/superadmin/restaurantes" element={<SuperRestaurantsPage />} />
            <Route path="/superadmin/restaurante" element={<SuperRestaurantDetailPage />} />
            <Route path="/superadmin/agentes" element={<SuperAgentsPage />} />
            <Route path="/superadmin/solicitacoes" element={<VideoRequestsAdminPage />} />
            <Route path="/superadmin/solicitacao" element={<VideoRequestDetailPage />} />
            <Route path="/superadmin/planos" element={<PlansPage />} />
            <Route path="/superadmin/valores" element={<PlatformSettingsPage />} />
            <Route path="/superadmin/materiais" element={<SuperMaterialsPage />} />
            <Route path="/superadmin/modelos-qr" element={<QrTemplatesPage />} />
            <Route path="/superadmin/regras-comissao" element={<CommissionRulesPage />} />
            <Route path="/superadmin/saques" element={<SuperWithdrawalsPage />} />
            <Route path="/superadmin/configuracoes" element={<SuperSettingsPage />} />
          </Route>
          <Route path="/sair" element={<Logout />} />
          <Route path="/:restaurantSlug" element={<ShortLink><PublicMenu /></ShortLink>} />
          <Route path="/:restaurantSlug/:pageSlug" element={<ShortLink><PublicBioPage /></ShortLink>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
