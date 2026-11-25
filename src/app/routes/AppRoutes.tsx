import { Route, Routes } from "react-router-dom";
import { PanelLayout } from "@/app/layout/PanelLayout";
import { AdminHomePage } from "@/modules/admin/pages/AdminHomePage";
import { AdminLeadsPage } from "@/modules/admin/pages/AdminLeadsPage";
import { BrokersPage } from "@/modules/admin/pages/BrokersPage";
import { DevelopmentFormPage } from "@/modules/admin/pages/DevelopmentFormPage";
import { DevelopmentsPage } from "@/modules/admin/pages/DevelopmentsPage";
import { UsersPage } from "@/modules/admin/pages/UsersPage";
import { ChangePasswordPage } from "@/modules/auth/pages/ChangePasswordPage";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { SignupPage } from "@/modules/auth/pages/SignupPage";
import { BrokerHomePage } from "@/modules/broker-area/pages/BrokerHomePage";
import { MessageTemplatesPage } from "@/modules/broker-area/pages/MessageTemplatesPage";
import { MyLeadsPage } from "@/modules/broker-area/pages/MyLeadsPage";
import { ProfilePage } from "@/modules/broker-area/pages/ProfilePage";
import { HomePage } from "@/modules/landing/pages/HomePage";
import { LeadDetailPage } from "@/modules/leads/pages/LeadDetailPage";
import { ShowroomPage } from "@/modules/showroom/pages/ShowroomPage";
import { EmptyState } from "@/shared/ui/ui";
import { ProtectedRoute, RequirePermission } from "./guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/cadastro" element={<SignupPage />} />
      {/* Link exclusivo do corretor (RN-02.1). */}
      <Route path="/e/:slug/:code" element={<ShowroomPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/trocar-senha" element={<ChangePasswordPage />} />
        <Route element={<RequirePermission permission="area.corretor" />}>
          <Route path="/painel" element={<PanelLayout area="corretor" />}>
            <Route index element={<BrokerHomePage />} />
            <Route path="clientes" element={<MyLeadsPage />} />
            <Route path="clientes/:id" element={<LeadDetailPage mode="corretor" />} />
            <Route path="mensagens" element={<MessageTemplatesPage />} />
            <Route path="perfil" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route element={<RequirePermission permission="admin" />}>
          <Route path="/admin" element={<PanelLayout area="admin" />}>
            <Route index element={<AdminHomePage />} />
            <Route path="empreendimentos" element={<DevelopmentsPage />} />
            <Route path="empreendimentos/novo" element={<DevelopmentFormPage />} />
            <Route path="empreendimentos/:id" element={<DevelopmentFormPage />} />
            <Route path="profissionais" element={<BrokersPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="clientes" element={<AdminLeadsPage />} />
            <Route path="clientes/:id" element={<LeadDetailPage mode="admin" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<main className="mx-auto max-w-md px-4 py-24"><EmptyState title="Página não encontrada" /></main>} />
    </Routes>
  );
}
