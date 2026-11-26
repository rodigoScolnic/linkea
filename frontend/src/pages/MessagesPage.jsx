import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL, conversationsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router";
import genericUser from "../assets/images/genericUser.png";

function personFor(conversation, userId) {
  if (conversation.invitation) {
    return conversation.invitation.institutionId === userId
      ? conversation.invitation.talent
      : conversation.invitation.institution;
  }
  if (conversation.match) {
    return conversation.match.userAId === userId
      ? conversation.match.userB
      : conversation.match.userA;
  }
  return null;
}

function personName(person) {
  return person?.institutionProfile?.name || person?.profile?.displayName || person?.username || "Contacto";
}

function upsertMessage(current, message) {
  if (current.some((item) => item.id === message.id)) return current;
  return [...current, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function MessagesPage() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get("conversationId");
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("connecting");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const selectedIdRef = useRef("");

  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await conversationsApi.list(token);
      const items = data.conversations || [];
      setConversations(items);
      setSelectedId((current) => current || (items.some((item) => item.id === requestedConversationId) ? requestedConversationId : "") || items[0]?.id || "");
      setError("");
    } catch (err) {
      setError(err.message || "No pudimos cargar tus conversaciones.");
    } finally {
      setLoading(false);
    }
  }, [token, requestedConversationId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 10000
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnection("connected"));
    socket.on("disconnect", () => setConnection("disconnected"));
    socket.on("connect_error", () => setConnection("disconnected"));

    socket.on("message:new", (message) => {
      setConversations((current) => {
        const updated = current.map((conversation) => {
          if (conversation.id !== message.conversationId) return conversation;
          return {
            ...conversation,
            messages: [message],
            unreadCount: message.senderId === user?.id || conversation.id === selectedIdRef.current
              ? 0
              : (conversation.unreadCount || 0) + 1
          };
        });
        return updated.sort((a, b) => {
          const aDate = a.messages?.[0]?.createdAt || a.createdAt;
          const bDate = b.messages?.[0]?.createdAt || b.createdAt;
          return new Date(bDate) - new Date(aDate);
        });
      });

      if (message.conversationId === selectedIdRef.current) {
        setMessages((current) => upsertMessage(current, message));
        if (message.senderId !== user?.id) {
          conversationsApi.markRead(token, message.conversationId).catch(() => {});
        }
      }
      if (message.senderId !== user?.id) {
        window.dispatchEvent(new Event("linkea:notifications-changed"));
      }
    });

    socket.on("messages:read", ({ conversationId, readerId, readAt }) => {
      if (readerId !== user?.id && conversationId === selectedIdRef.current) {
        setMessages((current) => current.map((message) =>
          message.senderId === user?.id && !message.readAt ? { ...message, readAt } : message
        ));
      }
    });

    socket.on("notification:new", () => {
      loadConversations();
      window.dispatchEvent(new Event("linkea:notifications-changed"));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  const selectedConversation = conversations.find((item) => item.id === selectedId) || null;
  const selectedPerson = selectedConversation ? personFor(selectedConversation, user?.id) : null;

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId || !token) return;
    setMessagesLoading(true);
    setError("");
    try {
      const data = await conversationsApi.messages(token, conversationId, { limit: 50 });
      const readResult = await conversationsApi.markRead(token, conversationId);
      const readAt = readResult.readAt || new Date().toISOString();
      setMessages((data.messages || []).map((message) =>
        message.senderId !== user?.id && !message.readAt ? { ...message, readAt } : message
      ));
      setHasMore(Boolean(data.hasMore));
      setConversations((current) => current.map((item) =>
        item.id === conversationId ? { ...item, unreadCount: 0 } : item
      ));
      window.dispatchEvent(new Event("linkea:notifications-changed"));
    } catch (err) {
      setError(err.message || "No pudimos cargar los mensajes.");
    } finally {
      setMessagesLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    if (!selectedId) {
      setMessages([]);
      return;
    }
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("conversation:join", { conversationId: selectedId }, (result) => {
        if (!result?.ok) setError(result?.error || "No pudimos abrir el chat.");
      });
    }
    loadMessages(selectedId);
    return () => {
      socket?.emit("conversation:leave", { conversationId: selectedId });
    };
  }, [selectedId, loadMessages, connection]);

  useEffect(() => {
    if (!messagesLoading) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, messagesLoading]);

  async function loadOlderMessages() {
    if (!selectedId || !messages.length || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const firstMessage = messages[0];
    try {
      const data = await conversationsApi.messages(token, selectedId, {
        before: firstMessage.createdAt,
        limit: 50
      });
      setMessages((current) => [...(data.messages || []), ...current]);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(err.message || "No pudimos cargar mensajes anteriores.");
    } finally {
      setLoadingOlder(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedId || sending) return;
    setSending(true);
    setError("");
    const socket = socketRef.current;
    try {
      if (socket?.connected) {
        const result = await new Promise((resolve, reject) => {
          socket.timeout(10000).emit("message:send", { conversationId: selectedId, content }, (timeoutError, response) => {
            if (timeoutError) return reject(new Error("El servidor tardó demasiado en responder."));
            if (!response?.ok) return reject(new Error(response?.error || "No se pudo enviar el mensaje."));
            resolve(response);
          });
        });
        setMessages((current) => upsertMessage(current, result.message));
      } else {
        const result = await conversationsApi.sendMessage(token, selectedId, content);
        setMessages((current) => upsertMessage(current, result.message));
      }
      setDraft("");
      await loadConversations();
    } catch (err) {
      setError(err.message || "No pudimos enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <section className="messages-page"><p className="professional-empty">Cargando conversaciones...</p></section>;
  }

  return (
    <section className="messages-page">
      <div className="messages-heading">
        <div>
          <p className="discover-eyebrow">MENSAJERÍA PRIVADA</p>
        </div>
        <span className={`messages-connection is-${connection}`}>
          <i />{connection === "connected" ? "Conectado" : connection === "connecting" ? "Conectando..." : "Reconectando..."}
        </span>
      </div>

      {conversations.some((conversation) => conversation.match) && (
        <section className="messages-matches" aria-label="Tus matches">
          <div className="messages-matches-heading">
            <strong>Tus matches</strong>
            <span>{conversations.filter((conversation) => conversation.match).length}</span>
          </div>
          <div className="messages-matches-carousel">
            {conversations.filter((conversation) => conversation.match).map((conversation) => {
              const person = personFor(conversation, user?.id);
              return (
                <button
                  type="button"
                  key={conversation.id}
                  className={`messages-match-item ${selectedId === conversation.id ? "active" : ""}`}
                  onClick={() => setSelectedId(conversation.id)}
                  aria-label={`Abrir conversación con ${personName(person)}`}
                  title={personName(person)}
                >
                  <img src={person?.profile?.photoUrl || person?.institutionProfile?.logoUrl || genericUser} alt="" />
                  <span>{personName(person)}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {error && <p className="discover-status discover-error" role="alert">{error}</p>}

      <div className={`messages-layout ${selectedId ? "has-selection" : ""}`}>
        <aside className="messages-sidebar">
          <div className="messages-sidebar-title">
            <strong>Conversaciones</strong>
            <span>{conversations.length}</span>
          </div>
          {conversations.length === 0 ? (
            <div className="messages-empty-list">
              <strong>Todavía no tenés conversaciones</strong>
              <p>Cuando hagas match o aceptes una invitación profesional, vas a poder conversar desde acá.</p>
            </div>
          ) : conversations.map((conversation) => {
            const person = personFor(conversation, user?.id);
            const lastMessage = conversation.messages?.[0];
            return (
              <button
                type="button"
                key={conversation.id}
                className={`messages-conversation ${selectedId === conversation.id ? "active" : ""}`}
                onClick={() => setSelectedId(conversation.id)}
              >
                <img src={person?.profile?.photoUrl || person?.institutionProfile?.logoUrl || genericUser} alt="" />
                <span className="messages-conversation-copy">
                  <strong>{personName(person)}</strong>
                  <small>{lastMessage?.content || "Conversación iniciada"}</small>
                </span>
                <span className="messages-conversation-meta">
                  {lastMessage && <time>{new Date(lastMessage.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</time>}
                  {conversation.unreadCount > 0 && <b>{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</b>}
                </span>
              </button>
            );
          })}
        </aside>

        <section className="messages-chat">
          {!selectedConversation ? (
            <div className="messages-chat-placeholder">
              <span className="messages-placeholder-icon">✉</span>
              <strong>Tu espacio de conversación</strong>
              <p>Elegí un contacto para empezar a conversar.</p>
            </div>
          ) : (
            <>
              <header className="messages-chat-header">
                <button type="button" className="messages-back-button" onClick={() => setSelectedId("")}>←</button>
                <img src={selectedPerson?.profile?.photoUrl || selectedPerson?.institutionProfile?.logoUrl || genericUser} alt="" />
                <div><strong>{personName(selectedPerson)}</strong><small>{selectedConversation.invitation ? "Contacto profesional" : "Match"}</small></div>
              </header>
              <div className="messages-thread" aria-live="polite">
                {hasMore && (
                  <button type="button" className="messages-load-older" onClick={loadOlderMessages} disabled={loadingOlder}>
                    {loadingOlder ? "Cargando..." : "Cargar mensajes anteriores"}
                  </button>
                )}
                {messagesLoading ? <p className="messages-thread-empty">Cargando mensajes...</p> : messages.length === 0 ? (
                  <p className="messages-thread-empty">Todavía no hay mensajes. ¡Mandá el primero!</p>
                ) : messages.map((message) => (
                  <article key={message.id} className={`messages-bubble ${message.senderId === user?.id ? "mine" : ""}`}>
                    <p>{message.content}</p>
                    <small>
                      {new Date(message.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      {message.senderId === user?.id && message.readAt && <span> · Leído</span>}
                    </small>
                  </article>
                ))}
                <div ref={bottomRef} />
              </div>
              <form className="messages-composer" onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={2000}
                  placeholder="Escribí un mensaje..."
                  aria-label="Escribí un mensaje"
                />
                <button type="submit" disabled={!draft.trim() || sending}>{sending ? "Enviando..." : "Enviar"}</button>
              </form>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

export default MessagesPage;
