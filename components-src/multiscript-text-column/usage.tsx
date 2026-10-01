import MultiscriptTextColumn, { type MultiscriptTextColumnProps } from './Component';

// Preview how a translated string set wraps before shipping a narrow sidebar layout.
const samples: MultiscriptTextColumnProps['samples'] = [
  { lang: 'ko', label: 'Korean — keep-all', text: '한국어는 띄어쓰기가 있지만 단어 중간에서 줄을 바꾸면 읽기 어렵습니다.' },
  { lang: 'he', label: 'Hebrew — right to left', text: 'טקסט עברי נכתב מימין לשמאל ושובר שורות ברווחים.', dir: 'rtl' },
];

export default function Example() {
  return (
    <MultiscriptTextColumn
      samples={samples}
      comparison={null}
      defaultMeasure={220}
      measureLabel="Sidebar width"
      caption="Drag to the narrowest sidebar width we support."
      onMeasureChange={(px) => console.log('measure', px)}
    />
  );
}
