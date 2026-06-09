import { useState, useCallback } from 'react';

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

export default function JsonViewer({ data, label = 'JSON Output' }) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
    } catch {
      const el = document.createElement('textarea');
      el.value = jsonString;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [jsonString]);

  return (
    <div className="json-viewer-wrap">
      <div className="json-viewer-toolbar">
        <span className="json-viewer-label">{label}</span>
        <button
          id="btn-copy-json"
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleCopy}
          aria-label="Copy JSON to clipboard"
        >
          {copied ? 'Copied' : 'Copy'}
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
