import PeelCornerCard, { type PeelCornerCardProps } from './Component';

// A gift card whose redemption code stays hidden until the customer peels the corner.
const reveal: PeelCornerCardProps['backBody'] = <>Code<br />7Q4-KM2</>;

export default function Example() {
  return (
    <PeelCornerCard
      eyebrow="Gift card"
      title="£50 store credit"
      details="Valid until 31 Dec · Online and in store"
      backTitle="Redeem"
      backBody={reveal}
      handleLabel="Peel the corner to reveal the gift code"
      onPeelChange={(open) => console.log(open ? 'code revealed' : 'code hidden')}
    />
  );
}
