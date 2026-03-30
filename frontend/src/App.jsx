import { useState, useRef, useEffect } from "react"

const MODELS = ["FAR1523", "FAR1518", "FCV628", "FA170", "FM8900S"]

const URGENCY_CONFIG = {
  CRITICA: { color: "bg-red-100 text-red-800 border-red-300", dot: "bg-red-500", label: "Crítica" },
  ALTA:    { color: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-500", label: "Alta" },
  MEDIA:   { color: "bg-yellow-100 text-yellow-800 border-yellow-300", dot: "bg-yellow-500", label: "Media" },
  BAJA:    { color: "bg-green-100 text-green-800 border-green-300", dot: "bg-green-500", label: "Baja" },
}

const ACTION_LABELS = {
  REPARAR:              { icon: "🔧", label: "Reparar" },
  CAMBIAR_COMPONENTE:   { icon: "🔩", label: "Cambiar componente" },
  REQUIERE_EVALUACION:  { icon: "🔍", label: "Requiere evaluación" },
}

// ── Badge de urgencia ─────────────────────────────────────────────────────────
function UrgencyBadge({ urgencia }) {
  const cfg = URGENCY_CONFIG[urgencia] || { color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: urgencia }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Resultado diagnóstico ──────────────────────────────────────────────────────
function DiagnosisResult({ result }) {
  const action = ACTION_LABELS[result.accion] || { icon: "⚙️", label: result.accion }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header resultado */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 sm:px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Diagnóstico</p>
            <h2 className="font-bold text-white text-lg">{result.equipo}</h2>
            {result.codigo_falla && (
              <p className="text-slate-300 text-sm mt-0.5">Código: {result.codigo_falla}</p>
            )}
          </div>
          <UrgencyBadge urgencia={result.urgencia} />
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Causa + Acción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-blue-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Causa probable</p>
            <p className="text-slate-800 text-sm leading-relaxed">{result.causa_probable}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Acción requerida</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{action.icon}</span>
              <p className="text-slate-800 font-semibold text-sm">{action.label}</p>
            </div>
          </div>
        </div>

        {/* Componente afectado */}
        {result.componente_afectado && (
          <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <span className="text-xl shrink-0 mt-0.5">⚡</span>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Componente afectado</p>
              <p className="text-slate-800 text-sm font-medium">{result.componente_afectado}</p>
            </div>
          </div>
        )}

        {/* Pasos técnicos */}
        {result.pasos_tecnico?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>📋</span> Pasos para el técnico
            </p>
            <ol className="space-y-2">
              {result.pasos_tecnico.map((paso, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">{paso}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Herramientas */}
        {result.herramientas_necesarias?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <span>🧰</span> Herramientas necesarias
            </p>
            <div className="flex flex-wrap gap-2">
              {result.herramientas_necesarias.map((h, i) => (
                <span key={i} className="inline-flex items-center bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Advertencias */}
        {result.advertencias?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
              <span>⚠️</span> Advertencias de seguridad
            </p>
            <ul className="space-y-1.5">
              {result.advertencias.map((a, i) => (
                <li key={i} className="text-xs text-amber-800 flex gap-2 items-start">
                  <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-100">
          {result.fuente_manual && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>📄</span> {result.fuente_manual}
            </p>
          )}
          {result.confianza && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full self-start sm:self-auto ${
              result.confianza === "ALTA"
                ? "bg-green-100 text-green-700 border border-green-200"
                : result.confianza === "MEDIA"
                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}>
              Confianza {result.confianza}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Pestaña Diagnóstico ────────────────────────────────────────────────────────
function DiagnosticTab() {
  const [form, setForm]         = useState({ model: "", fault_code: "", description: "" })
  const [image, setImage]       = useState(null)
  const [preview, setPreview]   = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), [])

  // ── Cámara ─────────────────────────────────────────────────────────────────
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      setCameraOpen(true)
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 100)
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos del navegador.")
    }
  }

  const capturePhoto = () => {
    const video  = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d").drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], "camara.jpg", { type: "image/jpeg" })
      setImage(file)
      setPreview(URL.createObjectURL(blob))
      closeCamera()
    }, "image/jpeg", 0.9)
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) { setImage(f); setPreview(URL.createObjectURL(f)) }
  }

  const clearImage = () => {
    setImage(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.model || !form.description) return
    setLoading(true); setError(null); setResult(null)

    const fd = new FormData()
    fd.append("model",       form.model)
    fd.append("fault_code",  form.fault_code)
    fd.append("description", form.description)
    if (image) fd.append("image", image)

    try {
      const r = await fetch("/api/diagnose", { method: "POST", body: fd })
      if (r.status === 404) {
        const d = await r.json()
        setError(d.detail || `Modelo ${form.model} no indexado. Ejecuta: make docker-index`)
        return
      }
      if (!r.ok) {
        const d = await r.json()
        setError(d.detail || "Error en el servidor")
        return
      }
      setResult((await r.json()).diagnosis)
    } catch {
      setError("Error conectando con la API. Verifica que el backend esté corriendo.")
    } finally {
      setLoading(false)
    }
  }

  const handleExample = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const r = await fetch("/api/diagnose/example")
      setResult((await r.json()).diagnosis)
    } catch {
      setError("Error conectando con la API.")
    } finally {
      setLoading(false)
    }
  }

  const isValid = form.model && form.description.trim()

  return (
    <div className="space-y-4">
      {/* Intro + Ejemplo */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-slate-500 text-sm">Ingresa equipo y falla para obtener diagnóstico antes de ir a terreno</p>
        <button onClick={handleExample} disabled={loading}
          className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 disabled:text-slate-400 transition-colors">
          Ver ejemplo
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Modelo */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Modelo del equipo <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            value={form.model}
            onChange={e => setForm({ ...form, model: e.target.value })}>
            <option value="">Seleccionar modelo...</option>
            {MODELS.map(m => <option key={m}>{m}</option>)}
          </select>
          {form.model && (
            <p className="text-xs text-slate-400 mt-1">
              {form.model === "FAR1523" || form.model === "FAR1518" ? "Radar marino" :
               form.model === "FCV628" ? "Ecosonda de pesca" :
               form.model === "FA170"  ? "Transpondedor AIS" :
               form.model === "FM8900S" ? "Radio GMDSS" : ""}
            </p>
          )}
        </div>

        {/* Código de falla */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Código de falla
            <span className="text-slate-400 font-normal ml-1">(opcional)</span>
          </label>
          <input
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Ej: E-07, ALM-01..."
            value={form.fault_code}
            onChange={e => setForm({ ...form, fault_code: e.target.value })} />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Descripción del problema <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            rows={3}
            placeholder="Describe lo que observas: síntomas, cuándo ocurre, condiciones..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
          <p className="text-xs text-slate-400 mt-1">{form.description.length} caracteres</p>
        </div>

        {/* Foto */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Foto del equipo
            <span className="text-slate-400 font-normal ml-1">(opcional — mejora el diagnóstico)</span>
          </label>

          {!preview ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors">
                <span>📎</span> Adjuntar imagen
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
              <button onClick={openCamera}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors">
                <span>📷</span> Usar cámara
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img src={preview} alt="preview"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg border border-slate-300 object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">Imagen adjunta</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{image?.name || "imagen capturada"}</p>
              </div>
              <button onClick={clearImage}
                className="shrink-0 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded-lg transition-colors">
                Quitar
              </button>
            </div>
          )}
        </div>

        {/* Botón submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm disabled:shadow-none">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analizando con IA...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🔍</span> Obtener diagnóstico
            </span>
          )}
        </button>
      </div>

      {/* Modal cámara */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-4 p-4">
          <p className="text-white text-sm font-medium">Apunta al equipo y captura la imagen</p>
          <video ref={videoRef} autoPlay playsInline
            className="rounded-2xl w-full max-w-sm border-2 border-white shadow-2xl" />
          <div className="flex gap-3">
            <button onClick={capturePhoto}
              className="px-8 py-3.5 bg-white text-slate-800 font-bold rounded-2xl hover:bg-slate-100 shadow-lg text-sm">
              📸 Capturar
            </button>
            <button onClick={closeCamera}
              className="px-6 py-3.5 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 text-sm">
              Cancelar
            </button>
          </div>
          <p className="text-slate-400 text-xs">La imagen mejora el diagnóstico visual de la IA</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="text-red-500 shrink-0 text-lg">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {result && <DiagnosisResult result={result} />}
    </div>
  )
}

// ── Pestaña Chat ───────────────────────────────────────────────────────────────
function ChatTab() {
  const [model,    setModel]    = useState("")
  const [input,    setInput]    = useState("")
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = async () => {
    if (!model || !input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: userMsg }])
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append("model",   model)
      fd.append("message", userMsg)
      const r    = await fetch("/api/chat", { method: "POST", body: fd })
      const data = await r.json()
      setMessages(prev => [...prev, {
        role:    "assistant",
        text:    r.ok ? data.answer : (data.detail || "Error en el servidor"),
        quality: r.ok ? data.context_quality : "LOW",
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant", text: "Error conectando con la API.", quality: "LOW",
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  const SUGGESTIONS = [
    "¿Qué significa el error E-07?",
    "¿Cómo calibrar el equipo?",
    "¿Qué herramientas necesito para el mantenimiento?",
    "¿Cuáles son los errores más comunes?",
  ]

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 200px)", minHeight: "420px", maxHeight: "640px" }}>
      {/* Selector modelo */}
      <div className="mb-3 flex gap-2 items-center">
        <select
          className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={model}
          onChange={e => { setModel(e.target.value); setMessages([]) }}>
          <option value="">Seleccionar modelo...</option>
          {MODELS.map(m => <option key={m}>{m}</option>)}
        </select>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shrink-0">
            Limpiar
          </button>
        )}
      </div>

      {/* Historial */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-8">
            <span className="text-5xl">⚓</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">
                {model ? `Consulta el manual del ${model}` : "Selecciona un modelo para comenzar"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Haz preguntas técnicas sobre el equipo</p>
            </div>
            {model && (
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); textareaRef.current?.focus() }}
                    className="text-left text-xs text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center shrink-0 mr-2 mt-1">
                ⚓
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              m.role === "user"
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              {m.quality && m.role === "assistant" && (
                <p className={`text-xs mt-2 font-medium ${
                  m.quality === "HIGH"   ? "text-green-500" :
                  m.quality === "MEDIUM" ? "text-amber-500" : "text-slate-300"
                }`}>
                  RAG: {m.quality === "HIGH" ? "Alta confianza" : m.quality === "MEDIUM" ? "Media confianza" : "Baja confianza"}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center shrink-0">
              ⚓
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(delay => (
                  <span key={delay}
                    className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          rows={2}
          className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm resize-none disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          placeholder={model ? "Pregunta sobre el manual... (Enter para enviar)" : "Selecciona un modelo primero"}
          disabled={!model || loading}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button onClick={send}
          disabled={!model || !input.trim() || loading}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 text-white rounded-xl text-lg font-bold transition-colors shadow-sm disabled:shadow-none shrink-0">
          ↑
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1.5 text-right">Enter para enviar · Shift+Enter para nueva línea</p>
    </div>
  )
}

// ── App principal ──────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("diagnose")

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0">
            ⚓
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-800 leading-tight">AnclaIA</h1>
            <p className="text-slate-500 text-xs truncate">Diagnóstico de equipos marítimos Furuno</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Online
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-200 rounded-2xl p-1 mb-5 shadow-inner">
          <button
            onClick={() => setTab("diagnose")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "diagnose"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            🔧 Diagnóstico
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "chat"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            💬 Chat con manual
          </button>
        </div>

        {tab === "diagnose" ? <DiagnosticTab /> : <ChatTab />}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 pb-safe">
        <p className="text-xs text-slate-400">AnclaIA · Diagnóstico técnico antes de ir a terreno</p>
      </footer>
    </div>
  )
}
