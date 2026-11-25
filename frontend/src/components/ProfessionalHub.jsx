import { useCallback, useEffect, useState } from "react";
import { conversationsApi, invitationsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

function ProfessionalHub() {
  const { token, user } = useAuth();
  const isInstitution = user?.accountType === "INSTITUTION";
  const [invitations, setInvitations] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [respondingId, setRespondingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadHub = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [invitationData, conversationData] = await Promise.all([
        invitationsApi.list(token),
        conversationsApi.list(token)
      ]);
      setInvitations(invitationData.invitations || []);
      setConversations(conversationData.conversations || []);
    } catch (err) {
      setError(err.message || "No pudimos cargar tus contactos profesionales.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadHub(); }, [loadHub]);

  async function openConversation(conversation) {
    setSelectedConversation(conversation);
    setMessagesLoading(true);
    setError("");
    try {
      const response = await conversationsApi.messages(token, conversation.id);
      setMessages(response.messages || []);
    } catch (err) {
      setError(err.message || "No pudimos cargar los mensajes.");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function refreshMessages() {
    if (!selectedConversation) return;
    setMessagesLoading(true);
    try {
      const response = await conversationsApi.messages(token, selectedConversation.id);
      setMessages(response.messages || []);
    } catch (err) {
      setError(err.message || "No pudimos actualizar los mensajes.");
    } finally {
      setMessagesLoading(false);
    }
  }

  async function respondToInvitation(invitationId, status) {
    setRespondingId(invitationId);
    setError("");
    setNotice("");
    try {
      await invitationsApi.respond(token, invitationId, status);
      setNotice(status === "ACCEPTED" ? "Invitación aceptada. Ya podés conversar con la institución." : "Invitación rechazada.");
      await loadHub();
    } catch (err) {
      setError(err.message || "No pudimos responder la invitación.");
    } finally {
      setRespondingId("");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = messageText.trim();
    if (!content || !selectedConversation || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await conversationsApi.sendMessage(token, selectedConversation.id, content);
      setMessages((current) => [...current, response.message]);
      setMessageText("");
      await loadHub();
    } catch (err) {
      setError(err.message || "No pudimos enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  function getConversationPerson(conversation) {
    if (conversation.invitation) {
      return isInstitution ? conversation.invitation.talent : conversation.invitation.institution;
    }
    if (conversation.match) {
      return conversation.match.userAId === user?.id ? conversation.match.userB : conversation.match.userA;
    }
    return null;
  }

  function getPersonName(person) {
    return person?.institutionProfile?.name || person?.profile?.displayName || person?.username || "Contacto";
  }

  return (
    <section className="professional-hub" id="contactos">
      <div className="professional-hub-heading">
        <div>
          <p className="discover-eyebrow">RED PROFESIONAL</p>
          <h2>Invitaciones y mensajes</h2>
          <p>Gestioná propuestas y conversaciones profesionales desde un mismo lugar.</p>
        </div>
        <button type="button" className="professional-refresh-button" onClick={loadHub} disabled={loading}>Actualizar</button>
      </div>

      {notice && <p className="professional-notice" role="status">{notice}</p>}
      {error && <p className="discover-status discover-error" role="alert">{error}</p>}

      <div className="professional-hub-grid">
        <section className="professional-panel">
          <div className="professional-panel-heading">
            <div>
              <h3>{isInstitution ? "Invitaciones enviadas" : "Invitaciones recibidas"}</h3>
              <span>{invitations.length} {invitations.length === 1 ? "propuesta" : "propuestas"}</span>
            </div>
          </div>
          {loading ? <p className="professional-empty">Cargando invitaciones...</p> : invitations.length === 0 ? (
            <div className="professional-empty">
              <strong>{isInstitution ? "Todavía no enviaste invitaciones" : "Todavía no tenés invitaciones"}</strong>
              <p>{isInstitution ? "Cuando invites a un talento, vas a poder seguir su respuesta desde acá." : "Cuando una institución quiera contactarte, su propuesta va a aparecer acá."}</p>
            </div>
          ) : (
            <div className="professional-invitation-list">
              {invitations.map((invitation) => {
                const person = isInstitution ? invitation.talent : invitation.institution;
                const name = getPersonName(person);
                return (
                  <article className="professional-invitation-card" key={invitation.id}>
                    <img src={person?.profile?.photoUrl || person?.institutionProfile?.logoUrl || genericUser} alt="" />
                    <div className="professional-invitation-content">
                      <div className="professional-invitation-topline">
                        <strong>{name}</strong>
                        <span className={`professional-status status-${invitation.status.toLowerCase()}`}>{invitation.status === "PENDING" ? "Pendiente" : invitation.status === "ACCEPTED" ? "Aceptada" : "Rechazada"}</span>
                      </div>
                      <h4>{invitation.title}</h4>
                      <p>{invitation.message}</p>
                      <small>{new Date(invitation.createdAt).toLocaleDateString("es-AR")}</small>
                      {!isInstitution && invitation.status === "PENDING" && (
                        <div className="professional-invitation-actions">
                          <button type="button" onClick={() => respondToInvitation(invitation.id, "ACCEPTED")} disabled={respondingId === invitation.id}>{respondingId === invitation.id ? "Procesando..." : "Aceptar"}</button>
                          <button type="button" onClick={() => respondToInvitation(invitation.id, "REJECTED")} disabled={respondingId === invitation.id}>Rechazar</button>
                        </div>
                      )}
                      {invitation.status === "ACCEPTED" && invitation.conversation && (
                        <button type="button" className="professional-open-chat" onClick={() => {
                          const conversation = conversations.find((item) => item.id === invitation.conversation.id);
                          if (conversation) openConversation(conversation);
                        }}>Abrir conversación</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="professional-panel professional-chat-panel">
          <div className="professional-panel-heading">
            <div><h3>Conversaciones</h3><span>{conversations.length} {conversations.length === 1 ? "chat" : "chats"}</span></div>
          </div>
          {conversations.length === 0 ? (
            <div className="professional-empty">
              <strong>Tus conversaciones aparecerán acá</strong>
              <p>Cuando un talento acepte una invitación, se habilitará el chat privado.</p>
            </div>
          ) : (
            <div className="professional-conversation-layout">
              <div className="professional-conversation-list">
                {conversations.map((conversation) => {
                  const person = getConversationPerson(conversation);
                  const lastMessage = conversation.messages?.[0];
                  return (
                    <button type="button" key={conversation.id} className={`professional-conversation-item ${selectedConversation?.id === conversation.id ? "active" : ""}`} onClick={() => openConversation(conversation)}>
                      <img src={person?.profile?.photoUrl || person?.institutionProfile?.logoUrl || genericUser} alt="" />
                      <span><strong>{getPersonName(person)}</strong><small>{lastMessage?.content || "Conversación iniciada"}</small></span>
                    </button>
                  );
                })}
              </div>
              <div className="professional-chat">
                {!selectedConversation ? (
                  <div className="professional-chat-placeholder">Elegí una conversación para ver los mensajes.</div>
                ) : (
                  <>
                    <div className="professional-chat-heading">
                      <strong>{getPersonName(getConversationPerson(selectedConversation))}</strong>
                      <button type="button" onClick={refreshMessages} disabled={messagesLoading}>↻</button>
                    </div>
                    <div className="professional-message-list">
                      {messagesLoading ? <p className="professional-chat-placeholder">Cargando mensajes...</p> : messages.length === 0 ? <p className="professional-chat-placeholder">Todavía no hay mensajes. ¡Podés iniciar la conversación!</p> : messages.map((message) => (
                        <div key={message.id} className={`professional-message ${message.senderId === user?.id ? "mine" : ""}`}>
                          <p>{message.content}</p>
                          <small>{new Date(message.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</small>
                        </div>
                      ))}
                    </div>
                    <form className="professional-message-form" onSubmit={sendMessage}>
                      <input value={messageText} onChange={(event) => setMessageText(event.target.value)} maxLength={2000} placeholder="Escribí un mensaje..." aria-label="Escribí un mensaje" />
                      <button type="submit" disabled={!messageText.trim() || sending}>{sending ? "..." : "Enviar"}</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default ProfessionalHub;
