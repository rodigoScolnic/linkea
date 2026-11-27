import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

function PremiumPlanPage() {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const isTalent = user?.accountType === "TALENT";
  const isPremium = Boolean(subscription?.isPremium);
  const endDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("es-AR")
    : null;

  return (
    <section className="premium-management-section">
      <button type="button" className="premium-back-link" onClick={() => navigate("/home/perfil")}>← Volver a mi perfil</button>
      <p className="discover-eyebrow">TU CUENTA · PLAN</p>
      <h1>Administrar mi plan</h1>
      <p className="discover-subtitle">Gestioná tu acceso a las herramientas de Linkea.</p>
      <article className="premium-management-card">
        <div className="premium-management-top">
          <div><span className={isPremium ? "premium-plan-chip is-premium" : "premium-plan-chip"}>{isPremium ? "✦ Premium activo" : "Plan gratuito"}</span>
            <h2>{isPremium ? (isTalent ? "Talento Premium" : "Institución Premium") : "Linkea Free"}</h2>
          </div>
          {isPremium && <span className="premium-management-sparkle">✦</span>}
        </div>
        <p>{isPremium
          ? "Tenés habilitados los beneficios Premium de tu tipo de cuenta."
          : "Estás usando Linkea con las funciones y límites del plan gratuito."}</p>
        {endDate && <p className="premium-period-label">Período vigente hasta el {endDate}{subscription?.cancelAtPeriodEnd ? " · Cancelación al finalizar el período" : ""}</p>}
        {isTalent ? <div className="premium-benefits-grid">
          <span>♥ {isPremium ? "20" : "5"} Me gusta por día</span>
          <span>◎ {isPremium ? "10" : "2"} postulaciones simultáneas</span>
          <span>▧ {isPremium ? "10" : "2"} fotos de portfolio</span>
          <span>▶ {isPremium ? "5" : "1"} videos de portfolio</span>
          <span>✦ {isPremium ? "Likes recibidos habilitados" : "Likes recibidos con Premium"}</span>
          <span>✉ {isPremium ? "Podés iniciar chats institucionales" : "Iniciar chats institucionales con Premium"}</span>
        </div> : <div className="premium-benefits-grid">
          <span>Filtros avanzados de talentos</span><span>Listas de talentos</span><span>Herramientas de casting</span><span>Funciones para equipos</span>
        </div>}
        <div className="premium-management-actions">
          {isPremium
            ? <p className="premium-payment-note">La administración de pagos y cancelaciones estará disponible cuando integremos la pasarela de suscripción.</p>
            : <><button type="button" className="opportunity-primary-button" disabled>Próximamente: activar Premium</button><p className="premium-payment-note">La suscripción y los pagos todavía no están habilitados. Por ahora podés seguir usando el plan gratuito.</p></>}
        </div>
      </article>
    </section>
  );
}
export default PremiumPlanPage;
