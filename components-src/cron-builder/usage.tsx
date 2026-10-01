import CronBuilder, { type CronBuilderProps } from './Component';

// Use it in a job scheduler settings page, so people see the next run times before they save.
const nightly: NonNullable<CronBuilderProps['initialFields']> = {
  min: '0', hour: '2', dom: '*', mon: '*', dow: '*',
};

export default function Example() {
  return (
    <CronBuilder
      initialFields={nightly}
      runCount={3}
      labels={{ min: 'Min', hour: 'Hr', dom: 'Date', mon: 'Mon', dow: 'Day' }}
      onChange={(expression, valid) => {
        if (valid) console.log('save schedule', expression);
      }}
    />
  );
}
