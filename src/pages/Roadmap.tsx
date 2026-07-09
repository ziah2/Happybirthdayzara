import { Badge, Card } from '../components/ui';
import { ROADMAP_FEATURES } from '../lib/faculties';

export function Roadmap() {
  return (
    <div className="page stack">
      <h2 style={{ fontSize: 22 }}>What's Next 🚀</h2>
      <p className="muted">Features coming soon to the Student Hub.</p>
      <div className="grid-2">
        {ROADMAP_FEATURES.map((f) => (
          <Card key={f.title} style={{ padding: 16 }}>
            <div style={{ fontSize: 26 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, margin: '8px 0 6px' }}>{f.title}</div>
            <Badge tone="muted">Coming soon</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
