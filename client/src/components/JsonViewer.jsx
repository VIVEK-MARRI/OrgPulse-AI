import { useState, useCallback } from 'react';

/**
 * Syntax-highlights a JSON string with colored spans.
 */
function highlight(json) {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-bool';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export default function JsonViewer({ data }) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = jsonString;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [jsonString]);

  return (
    <div className="json-viewer-wrap">
      <div className="json-viewer-toolbar">
        <span className="json-viewer-label">JSON Output</span>
        <button
          id="btn-copy-json"
          className="btn btn-secondary btn-sm"
          onClick={handleCopy}
          aria-label="Copy JSON to clipboard"
        >
          {copied ? '✓ Copied!' : '⎘ Copy'}
        </button>
      </div>
      <div
        className="json-content"
        dangerouslySetInnerHTML={{ __html: highlight(jsonString) }}
        aria-label="Raw JSON output"
      />
    </div>
  );
}
