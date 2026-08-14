export function HowItWorks() {
  return (
    <section className="how-it-works" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading">Cómo funciona</h2>

      <div className="how-it-works__grid">
        <div>
          <h3>Contrato</h3>
          <p>
            La entrada y la salida siguen <code>contracts/input.schema.json</code> y{' '}
            <code>contracts/output.schema.json</code>. Un validador escrito a mano (sin <code>ajv</code> en
            tiempo de ejecución, por compatibilidad con la CSP estricta) comprueba cada campo antes de
            calcular nada.
          </p>
        </div>
        <div>
          <h3>Límites</h3>
          <ul>
            <li>Objetivo (SLO) estrictamente entre 50% y 99.9999%: nunca 100%.</li>
            <li>Ventana entre 1 y 365 días.</li>
            <li>Hasta 50 eventos de incidente y 10 objetivos de comparación por ejecución.</li>
            <li>Hasta 1000 hallazgos por ejecución; el resto se trunca de forma explícita.</li>
          </ul>
        </div>
        <div>
          <h3>Arquitectura</h3>
          <p>
            Aplicación 100% estática: React + TypeScript en el navegador, cálculo en un Web Worker
            cancelable, sin backend propio. Ningún dato sale del dispositivo; la exportación se genera
            localmente como descarga de archivo.
          </p>
        </div>
      </div>
    </section>
  );
}
