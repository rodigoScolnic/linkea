import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { opportunitiesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const registers = ["Soprano", "Mezzosoprano", "Contralto", "Contratenor", "Tenor", "Barítono", "Bajo"];
const types = [
  ["AUDITION", "Audición"], ["JOB", "Búsqueda laboral"], ["CONCERT", "Concierto"],
  ["PRODUCTION", "Producción"], ["OTHER", "Otra convocatoria"]
];
const statusLabels = { SUBMITTED: "Recibida", REVIEWING: "En evaluación", SELECTED: "Seleccionada", REJECTED: "No seleccionada" };

function OpportunityHub() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isInstitution = user?.accountType === "INSTITUTION";
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState({ city: "", type: "", vocalRegister: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [applicationMessages, setApplicationMessages] = useState({});
  const [applyingId, setApplyingId] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "AUDITION", vocalRegisters: [], requirements: "", city: "", country: "", deadline: "" });

  const loadOpportunities = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await opportunitiesApi.list(token, filters);
      setOpportunities(data.opportunities || []);
    } catch (err) {
      setError(err.message || "No pudimos cargar las oportunidades.");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => { loadOpportunities(); }, [loadOpportunities]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleRegister(register) {
    setForm((current) => ({
      ...current,
      vocalRegisters: current.vocalRegisters.includes(register)
        ? current.vocalRegisters.filter((item) => item !== register)
        : [...current.vocalRegisters, register]
    }));
  }

  async function createOpportunity(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await opportunitiesApi.create(token, {
        ...form,
        deadline: form.deadline ? new Date(`${form.deadline}T23:59:59`).toISOString() : null
      });
      setForm({ title: "", description: "", type: "AUDITION", vocalRegisters: [], requirements: "", city: "", country: "", deadline: "" });
      setFormOpen(false);
      setNotice("La oportunidad se publicó correctamente.");
      await loadOpportunities();
    } catch (err) {
      setError(err.message || "No pudimos publicar la oportunidad.");
    } finally {
      setSaving(false);
    }
  }

  async function applyToOpportunity(opportunityId) {
    setApplyingId(opportunityId);
    setError("");
    setNotice("");
    try {
      await opportunitiesApi.apply(token, opportunityId, applicationMessages[opportunityId] || "");
      setApplicationMessages((current) => ({ ...current, [opportunityId]: "" }));
      setNotice("Tu postulación fue enviada.");
      await loadOpportunities();
    } catch (err) {
      setError(err.message || "No pudimos enviar tu postulación.");
    } finally {
      setApplyingId("");
    }
  }

  async function viewApplications(opportunity) {
    setSelectedOpportunity(opportunity);
    setApplicationsLoading(true);
    setApplications([]);
    try {
      const data = await opportunitiesApi.applications(token, opportunity.id);
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message || "No pudimos cargar las postulaciones.");
    } finally {
      setApplicationsLoading(false);
    }
  }

  async function updateApplication(applicationId, status) {
    if (!selectedOpportunity) return;
    setError("");
    try {
      await opportunitiesApi.updateApplication(token, selectedOpportunity.id, applicationId, status);
      await viewApplications(selectedOpportunity);
      setNotice("El estado de la postulación se actualizó.");
    } catch (err) {
      setError(err.message || "No pudimos actualizar la postulación.");
    }
  }

  async function closeOpportunity(opportunity) {
    const status = opportunity.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await opportunitiesApi.updateStatus(token, opportunity.id, status);
      setNotice(status === "CLOSED" ? "Convocatoria cerrada." : "Convocatoria reabierta.");
      await loadOpportunities();
    } catch (err) {
      setError(err.message || "No pudimos cambiar el estado.");
    }
  }

  return (
    <section className="opportunities-section" id="oportunidades">
      <div className="opportunities-heading">
        <div>
          <p className="discover-eyebrow">LINK​​EA · OPORTUNIDADES</p>
          <h2>{isInstitution ? "Tus convocatorias" : "Audiciones y oportunidades"}</h2>
          <p>{isInstitution ? "Publicá búsquedas y gestioná las postulaciones recibidas." : "Encontrá nuevas convocatorias y presentá tu candidatura."}</p>
        </div>
        {isInstitution && <button type="button" className="opportunity-primary-button" onClick={() => setFormOpen((open) => !open)}>{formOpen ? "Cerrar formulario" : "Publicar oportunidad"}</button>}
      </div>

      {notice && <p className="professional-notice" role="status">{notice}</p>}
      {error && <p className="discover-status discover-error" role="alert">{error}</p>}

      {isInstitution && formOpen && (
        <form className="opportunity-form" onSubmit={createOpportunity}>
          <h3>Nueva convocatoria</h3>
          <label>Título<input required minLength={4} maxLength={140} value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Ej. Audición para La Traviata" /></label>
          <div className="opportunity-form-row">
            <label>Tipo<select value={form.type} onChange={(event) => updateForm("type", event.target.value)}>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Fecha límite<input type="date" value={form.deadline} onChange={(event) => updateForm("deadline", event.target.value)} /></label>
          </div>
          <label>Descripción<textarea required minLength={20} maxLength={3000} rows={4} value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Contá de qué se trata la convocatoria..." /></label>
          <div className="opportunity-registers"><span>Registros vocales buscados</span><div>{registers.map((register) => <label key={register}><input type="checkbox" checked={form.vocalRegisters.includes(register)} onChange={() => toggleRegister(register)} />{register}</label>)}</div></div>
          <label>Requisitos (opcional)<textarea rows={3} maxLength={2000} value={form.requirements} onChange={(event) => updateForm("requirements", event.target.value)} placeholder="Experiencia, repertorio, disponibilidad..." /></label>
          <div className="opportunity-form-row">
            <label>Ciudad<input value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="Buenos Aires" /></label>
            <label>País<input value={form.country} onChange={(event) => updateForm("country", event.target.value)} placeholder="Argentina" /></label>
          </div>
          <button type="submit" className="opportunity-primary-button" disabled={saving}>{saving ? "Publicando..." : "Publicar convocatoria"}</button>
        </form>
      )}

      {!isInstitution && (
        <div className="opportunity-filters">
          <input aria-label="Filtrar por ciudad" placeholder="Ciudad" value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} />
          <select aria-label="Filtrar por tipo" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option value="">Todos los tipos</option>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select aria-label="Filtrar por registro vocal" value={filters.vocalRegister} onChange={(event) => setFilters((current) => ({ ...current, vocalRegister: event.target.value }))}><option value="">Todos los registros</option>{registers.map((register) => <option key={register}>{register}</option>)}</select>
          <button type="button" onClick={loadOpportunities}>Filtrar</button>
        </div>
      )}

      {loading ? <p className="professional-empty">Cargando oportunidades...</p> : opportunities.length === 0 ? (
        <div className="professional-empty"><strong>{isInstitution ? "Todavía no publicaste convocatorias" : "No encontramos oportunidades con esos filtros"}</strong><p>{isInstitution ? "Cuando publiques una oportunidad, aparecerá en este espacio." : "Probá cambiar los filtros o volvé a consultar más adelante."}</p></div>
      ) : (
        <div className="opportunities-grid">
          {opportunities.map((opportunity) => {
            const application = opportunity.applications?.[0];
            const institution = opportunity.institution?.institutionProfile;
            return (
              <article className="opportunity-card" key={opportunity.id}>
                <div className="opportunity-card-top"><span className="opportunity-type">{types.find(([value]) => value === opportunity.type)?.[1] || opportunity.type}</span><span className={`opportunity-status ${opportunity.status === "OPEN" ? "is-open" : "is-closed"}`}>{opportunity.status === "OPEN" ? "Abierta" : "Cerrada"}</span></div>
                <h3>{opportunity.title}</h3>
                <p className="opportunity-institution">{institution?.name || opportunity.institution?.username}</p>
                <p className="opportunity-description">{opportunity.description}</p>
                {opportunity.vocalRegisters?.length > 0 && <div className="opportunity-tags">{opportunity.vocalRegisters.map((register) => <span key={register}>{register}</span>)}</div>}
                <div className="opportunity-meta"><span>{[opportunity.city, opportunity.country].filter(Boolean).join(", ") || "Ubicación a coordinar"}</span><span>{opportunity.deadline ? `Hasta ${new Date(opportunity.deadline).toLocaleDateString("es-AR")}` : "Sin fecha límite"}</span></div>
                {isInstitution ? (
                  <div className="opportunity-card-actions"><button type="button" onClick={() => viewApplications(opportunity)}>Ver postulaciones ({opportunity._count?.applications || 0})</button><button type="button" className="opportunity-secondary-button" onClick={() => closeOpportunity(opportunity)}>{opportunity.status === "OPEN" ? "Cerrar" : "Reabrir"}</button></div>
                ) : application ? (
                  <p className="opportunity-applied">Ya te postulaste · {statusLabels[application.status] || "Recibida"}</p>
                ) : (
                  <div className="opportunity-apply"><textarea rows={2} maxLength={2000} placeholder="Mensaje para la institución (opcional)" value={applicationMessages[opportunity.id] || ""} onChange={(event) => setApplicationMessages((current) => ({ ...current, [opportunity.id]: event.target.value }))} /><button type="button" disabled={applyingId === opportunity.id} onClick={() => applyToOpportunity(opportunity.id)}>{applyingId === opportunity.id ? "Enviando..." : "Postularme"}</button></div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {isInstitution && selectedOpportunity && (
        <div className="opportunity-applications">
          <div className="opportunities-heading"><div><p className="discover-eyebrow">CANDIDATURAS</p><h3>{selectedOpportunity.title}</h3></div><button type="button" className="opportunity-secondary-button" onClick={() => setSelectedOpportunity(null)}>Cerrar</button></div>
          {applicationsLoading ? <p className="professional-empty">Cargando postulaciones...</p> : applications.length === 0 ? <p className="professional-empty">Todavía no hay postulaciones para esta convocatoria.</p> : applications.map((item) => (
            <article className="opportunity-application-card" key={item.id}>
              <button type="button" className="profile-card-link opportunity-applicant-profile" onClick={() => navigate(`/home/talento/${item.talent.id}`)}>
                <strong>{item.talent?.profile?.displayName || item.talent?.username}</strong><span>{item.talent?.profile?.vocalRegister || "Registro no informado"} · {item.talent?.profile?.city || "Ciudad no informada"}</span><p>{item.message || "Sin mensaje adicional."}</p><small>Estado: {statusLabels[item.status]}</small><span className="profile-card-link-hint">Ver perfil →</span>
              </button>
              <div className="opportunity-application-actions">
                {item.status !== "REVIEWING" && <button type="button" onClick={() => updateApplication(item.id, "REVIEWING")}>En evaluación</button>}
                {item.status !== "SELECTED" && <button type="button" onClick={() => updateApplication(item.id, "SELECTED")}>Seleccionar</button>}
                {item.status !== "REJECTED" && <button type="button" className="opportunity-secondary-button" onClick={() => updateApplication(item.id, "REJECTED")}>Rechazar</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default OpportunityHub;
