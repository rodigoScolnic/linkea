import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { invitationsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

function ProfessionalHub() {
  const { token, user, subscription } = useAuth();
  const navigate = useNavigate();
  const isInstitution = user?.accountType === "INSTITUTION";
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadInvitations = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const data = await invitationsApi.list(token);
      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err.message || "No pudimos cargar tus invitaciones profesionales.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadInvitations(); }, [loadInvitations]);

  async function respondToInvitation(invitationId, status) {
    setRespondingId(invitationId);
    setError("");
    setNotice("");
    try {
      await invitationsApi.respond(token, invitationId, status);
      setNotice(status === "ACCEPTED"
        ? "Invitación aceptada. Ya podés conversar desde la pestaña Mensajes."
        : "Invitación rechazada.");
      await loadInvitations();
    } catch (err) {
      setError(err.message || "No pudimos responder la invitación.");
    } finally {
      setRespondingId("");
    }
  }

  function getPerson(invitation) {
    return isInstitution ? invitation.talent : invitation.institution;
  }

  function getPersonName(person) {
    return person?.institutionProfile?.name || person?.profile?.displayName || person?.username || "Contacto";
  }

  return (
    <section className="professional-hub" id="contactos">
      <div className="professional-hub-heading">
        <div>
          <p className="discover-eyebrow">RED PROFESIONAL</p>
          <h2>{isInstitution ? "Invitaciones enviadas" : "Invitaciones profesionales"}</h2>
          <p>{isInstitution
            ? "Seguí el estado de las propuestas que enviaste a talentos."
            : "Revisá las propuestas que recibís de instituciones y compañías."}</p>
        </div>
        <button type="button" className="professional-refresh-button" onClick={loadInvitations} disabled={loading}>Actualizar</button>
      </div>

      {!isInstitution && !subscription?.isPremium && <div className="professional-premium-invite"><div><strong>¿Querés contactar instituciones por tu cuenta?</strong><p>Con Linkea Premium podés iniciar conversaciones con compañías e instituciones, sin esperar una invitación.</p></div><button type="button" onClick={() => navigate("/home/plan")}>Conocer Premium</button></div>}
      {notice && <p className="professional-notice" role="status">{notice}</p>}
      {error && <p className="discover-status discover-error" role="alert">{error}</p>}

      {loading ? <p className="professional-empty">Cargando invitaciones...</p> : invitations.length === 0 ? (
        <div className="professional-empty">
          <strong>{isInstitution ? "Todavía no enviaste invitaciones" : "Todavía no tenés invitaciones"}</strong>
          <p>{isInstitution
            ? "Cuando invites a un talento, vas a poder seguir su respuesta desde acá."
            : "Cuando una institución quiera contactarte, su propuesta va a aparecer acá."}</p>
        </div>
      ) : (
        <div className="professional-invitation-list">
          {invitations.map((invitation) => {
            const person = getPerson(invitation);
            return (
              <article className="professional-invitation-card" key={invitation.id}>
                <button type="button" className="profile-card-link professional-profile-link" onClick={() => person?.id && navigate(`/home/talento/${person.id}`)}>
                  <img src={person?.profile?.photoUrl || person?.institutionProfile?.logoUrl || genericUser} alt="" />
                  <div className="professional-invitation-content">
                    <div className="professional-invitation-topline">
                      <strong>{getPersonName(person)}</strong>
                      <span className={`professional-status status-${invitation.status.toLowerCase()}`}>
                        {invitation.status === "PENDING" ? "Pendiente" : invitation.status === "ACCEPTED" ? "Aceptada" : "Rechazada"}
                      </span>
                    </div>
                    <h4>{invitation.title}</h4>
                    <p>{invitation.message}</p>
                    <small>{new Date(invitation.createdAt).toLocaleDateString("es-AR")}</small>
                    {invitation.status === "ACCEPTED" && <p className="professional-invitation-accepted">Conversación habilitada en Mensajes.</p>}
                    <span className="profile-card-link-hint">Ver perfil →</span>
                  </div>
                </button>
                {invitation.status === "ACCEPTED" && invitation.conversation?.id && (
                  <button type="button" className="professional-open-chat-button" onClick={() => navigate(`/home/mensajes?conversationId=${invitation.conversation.id}`)}>
                    Abrir conversación
                  </button>
                )}
                {!isInstitution && invitation.status === "PENDING" && (
                  <div className="professional-invitation-actions">
                    <button type="button" onClick={() => respondToInvitation(invitation.id, "ACCEPTED")} disabled={respondingId === invitation.id}>
                      {respondingId === invitation.id ? "Procesando..." : "Aceptar"}
                    </button>
                    <button type="button" onClick={() => respondToInvitation(invitation.id, "REJECTED")} disabled={respondingId === invitation.id}>Rechazar</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProfessionalHub;
