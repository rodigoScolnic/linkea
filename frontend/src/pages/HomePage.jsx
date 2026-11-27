import { Navigate, Route, Routes, useNavigate } from "react-router";
import HeaderHome from "../components/HeaderHome";
import Hero from "../components/Hero";
import DiscoverPeople from "../components/DiscoverPeople";
import InstitutionFavorites from "../components/InstitutionFavorites";
import ProfessionalHub from "../components/ProfessionalHub";
import MessagesPage from "./MessagesPage";
import OpportunityHub from "../components/OpportunityHub";
import NotificationCenter from "../components/NotificationCenter";
import LikesHistory from "../components/LikesHistory";
import ReceivedLikes from "../components/ReceivedLikes";
import PremiumPlanPage from "./PremiumPlanPage";
import PublicProfilePage from "./PublicProfilePage";
import { useAuth } from "../context/AuthContext";
import "../styles/home.css";

function InstitutionProfile({ institution }) {
  return (
    <section className="institution-welcome institution-profile-page">
      <span className="institution-welcome-eyebrow">LINKEA · INSTITUCIONES</span>
      <h1>Tu espacio institucional</h1>
      <p>Administrá tu presencia en Linkea y conectá con artistas y profesionales.</p>
      <div className="institution-welcome-card">
        <span>Perfil institucional</span>
        <h2>{institution?.name || "Tu institución"}</h2>
        <p>{institution?.type || "Institución cultural"}</p>
      </div>
    </section>
  );
}

const HomePage = () => {
  const { user, isGuest } = useAuth();
  const isInstitution = !isGuest && user?.accountType === "INSTITUTION";

  return (
    <main className="home-page">
      <HeaderHome />
      <div className="home-tab-content">
        <Routes>
          <Route index element={<Navigate to="perfil" replace />} />
          <Route path="perfil" element={isInstitution
            ? <InstitutionProfile institution={user?.institutionProfile} />
            : <Hero user={user} />} />
          <Route path="descubrir" element={<DiscoverPeople />} />
          {!isGuest && <Route path="talento/:id" element={<PublicProfilePage />} />}
          {!isGuest && (isInstitution
            ? <Route path="favoritos" element={<InstitutionFavorites />} />
            : <><Route path="likes" element={<LikesHistory />} /><Route path="likes-recibidos" element={<ReceivedLikes />} /></>)}
          {!isGuest && <Route path="plan" element={<PremiumPlanPage />} />}
          {!isGuest && <Route path="contactos" element={<ProfessionalHub />} />}
          {!isGuest && <Route path="mensajes" element={<MessagesPage />} />}
          {!isGuest && <Route path="oportunidades" element={<OpportunityHub />} />}
          {!isGuest && <Route path="notificaciones" element={<NotificationCenter />} />}
          <Route path="*" element={<Navigate to="perfil" replace />} />
        </Routes>
      </div>
    </main>
  );
};

export default HomePage;
