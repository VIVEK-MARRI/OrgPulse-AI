import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import GraphQueryPanel from '../features/graph/GraphQueryPanel.jsx';

export default function KnowledgeGraph() {
  const [extraction] = useState(() => {
    try {
      const stored = localStorage.getItem('orgpulse_last_analysis');
      if (stored) return JSON.parse(stored).extraction || null;
    } catch { /* no stored data */ }
    return null;
  });

  if (!extraction) {
    return (
      <div>
        <PageHeader
          title="Knowledge Graph"
          description="Query organizational data using natural language and Cypher"
        />
        <EmptyState
          title="No data to query"
          description="Analyze a meeting transcript first to populate the knowledge graph workspace."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Knowledge Graph"
        description="Query organizational data using natural language and Cypher"
      />
      <GraphQueryPanel extraction={extraction} apiKeyOverride="" />
    </div>
  );
}
