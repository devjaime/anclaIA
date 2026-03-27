import { useState } from "react"

const MODELS = ["FAR1523", "FAR1518", "FCV628", "FA170", "FM8900S"]

const URGENCY_COLOR = {
  CRITICA: "bg-red-100 text-red-800",
  ALTA:    "bg-orange-100 text-orange-800",
  MEDIA:   "bg-yellow-100 text-yellow-800",
  BAJA:    "bg-green-100 text-green-800",
}

export default function App() {
  const [form, setForm]       = useState({ model: "", fault_code: "", description: "" })
  const [image, setImage]     = useState(null)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleSubmit = async () => {
    if (!form.model || !form.description) return
    setLoading(true)
    setError(null)
    setResult(null)

    const fd = new FormData()
    fd.append("model", form.model)
    fd.append("fault_code", form.fault_code)
    fd.append("description", form.description)
    if (image) fd.append("image", image)

    try {
      const r = await fetch("http://localhost:8000/diagnose", { method: "POST", body: fd })
      const data = await r.json()
      setResult(data.diagnosis)
    } catch (e) {
      setError("Error conectando con la API")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800">AnclaIA</h1>
          <p className="text-slate-500 text-sm mt-1">Diagnóstico de equipos marítimos</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Modelo del equipo</label>
            <select
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={form.model}
              onChange={e => setForm({...form, model: e.target.value})}
            >
              <option value="">Seleccionar modelo...</option>
              {MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Código de falla</label>
            <input
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: E-07"
              value={form.fault_code}
              onChange={e => setForm({...form, fault_code: e.target.value})}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Descripción del problema</label>
            <textarea
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="Describe lo que observas en el equipo..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Foto del equipo (opcional)</label>
            <input
              type="file" accept="image/*"
              className="mt-1 w-full text-sm text-slate-500"
              onChange={e => setImage(e.target.files[0])}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !form.model || !form.description}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "Diagnosticando..." : "Obtener diagnóstico"}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Diagnóstico — {result.equipo}</h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${URGENCY_COLOR[result.urgencia] || "bg-slate-100 text-slate-600"}`}>
                {result.urgencia}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Causa probable</p>
                <p className="text-slate-800">{result.causa_probable}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Acción</p>
                <p className="text-slate-800 font-medium">{result.accion}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                <p className="text-slate-500 text-xs mb-1">Componente afectado</p>
                <p className="text-slate-800">{result.componente_afectado}</p>
              </div>
            </div>

            {result.pasos_tecnico?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Pasos para el técnico</p>
                <ol className="space-y-1">
                  {result.pasos_tecnico.map((p, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-blue-500 font-medium shrink-0">{i+1}.</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {result.herramientas_necesarias?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Herramientas</p>
                <p className="text-sm text-slate-600">{result.herramientas_necesarias.join(" · ")}</p>
              </div>
            )}

            {result.fuente_manual && (
              <p className="text-xs text-slate-400">Fuente: {result.fuente_manual}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
