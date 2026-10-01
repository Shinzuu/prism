import BidiCommentCard, { type BidiComment } from './Component';

// Use it for any feed that mixes right-to-left and left-to-right user content.
const reviews: BidiComment[] = [
  { who: 'noura', dir: 'rtl', lang: 'ar', body: 'وصل الطلب بسرعة، شكرًا!', likes: 4, url: 'shop.example/r/19' },
  { who: 'j.lee', dir: 'ltr', lang: 'en', body: 'Fits as described.', likes: 1, url: 'shop.example/r/20' },
];

export default function Example() {
  return (
    <BidiCommentCard
      comments={reviews}
      title="Reviews"
      likesLabel="helpful"
      hideToggle
      note=""
    />
  );
}
