import ConvergenceTrace, { type ConvergenceResult } from './Component';

// Use it in place of a spinner while an iterative solver runs, so people can see progress and stalls.
export default function Example() {
  const report = (r: ConvergenceResult) =>
    console.log(r.converged ? `converged in ${r.iterations}` : `gave up at ${r.residual.toExponential(2)}`);

  return (
    <ConvergenceTrace
      title="Fitting mesh"
      subtitle="L2 residual"
      target={1e-5}
      maxIterations={60}
      stepMs={90}
      introNote="Each point is one solver pass. Watch the slope, not the clock."
      onFinish={report}
    />
  );
}
