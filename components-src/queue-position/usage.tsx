import { useEffect, useState } from 'react';
import QueuePosition from './Component';

// Use it on a waiting-room page fed by your queue service, so the estimate comes from real moves.
export default function Example() {
  const [position, setPosition] = useState<number | undefined>(undefined);

  useEffect(() => {
    const es = new EventSource('/api/queue/stream');
    es.onmessage = (e) => setPosition(Number(e.data));
    return () => es.close();
  }, []);

  return (
    <QueuePosition
      start={120}
      position={position}
      loading={position === undefined}
      readyText="It's your turn — opening checkout."
      onReady={() => console.log('redirect to checkout')}
    />
  );
}
