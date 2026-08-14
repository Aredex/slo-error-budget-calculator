import { useState } from 'react';
import type { EngineRunResult } from '../../domain/types';
import { buildJsonExport, buildMarkdownExport, triggerDownload } from '../../domain/export';

export function ExportControls({ result }: { result: EngineRunResult }) {
  const [status, setStatus] = useState<'idle' | 'exported'>('idle');

  function exportJson() {
    triggerDownload(`${result.output.runId}.json`, buildJsonExport(result), 'application/json');
    setStatus('exported');
  }

  function exportMarkdown() {
    triggerDownload(`${result.output.runId}.md`, buildMarkdownExport(result), 'text/markdown');
    setStatus('exported');
  }

  return (
    <div className="export-controls">
      <button type="button" className="button button--secondary" onClick={exportJson}>
        Exportar JSON
      </button>
      <button type="button" className="button button--secondary" onClick={exportMarkdown}>
        Exportar Markdown
      </button>
      <p className="export-controls__note" role="status">
        {status === 'exported'
          ? 'Exportación generada. No incluye la entrada original, solo el resultado agregado.'
          : 'La exportación excluye el payload de entrada por defecto.'}
      </p>
    </div>
  );
}
