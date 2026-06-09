import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import RecurringRisksDashboard from '../features/memory/RecurringRisksDashboard.jsx';

export default function Memory() {
  const [recurring] = useState(null);

  return (
    <div>
      <PageHeader
        title="Organizational Memory"
        description="Recurring risks and escalations detected across meetings"
      />
      <RecurringRisksDashboard
        recurring={recurring}
        recurringStatus="idle"
      />
    </div>
  );
}
