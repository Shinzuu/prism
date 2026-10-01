import BertinMatrix, { type BertinMatrixProps } from './Component';

// Use it to let people find clusters in a small two-way table without changing the data.
const regions = ['North', 'South', 'East', 'West', 'Central'];
const products = ['Basic', 'Pro', 'Team', 'Enterprise'];
const sales: BertinMatrixProps['values'] = [
  [80, 12, 70, 5],
  [10, 90, 8, 75],
  [85, 6, 66, 9],
  [4, 72, 11, 88],
  [40, 35, 45, 30],
];

export default function Example() {
  return (
    <BertinMatrix
      rowLabels={regions}
      colLabels={products}
      values={sales}
      title="Plan uptake by region"
      reorderLabel="Find clusters"
      onReorder={({ rows, cols, score }) => console.log(rows, cols, score)}
    />
  );
}
