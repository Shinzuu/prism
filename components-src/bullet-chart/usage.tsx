import BulletChart, { type Row } from './Component';

// Use it on a dashboard to show a few KPIs against target and their qualitative bands.
const kpis: Row[] = [
  { label: 'NPS', value: '41', unit: '', poor: 30, ok: 60, good: 100, measure: 68, target: 60, over: true,
    aria: 'NPS: 41 against a target of 36. Above target.', actual: '41', targetLabel: '36' },
  { label: 'Uptime', value: '99.2', unit: '%', poor: 50, ok: 80, good: 100, measure: 74, target: 90,
    aria: 'Uptime: 99.2 percent against a target of 99.9 percent. Below target.',
    actual: '99.2%', targetLabel: '99.9%' },
];

export default function Example() {
  return <BulletChart rows={kpis} caption="Quarterly service KPIs" className="max-w-md" />;
}
