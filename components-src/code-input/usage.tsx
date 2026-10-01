import CodeInput, { type CodeInputProps } from './Component';

// Use it on a sign-in or 2FA screen where the code is checked against your server.
const verify: CodeInputProps['validate'] = async (code) => {
  const res = await fetch('/api/verify', { method: 'POST', body: JSON.stringify({ code }) });
  return res.ok;
};

export default function Example() {
  return (
    <CodeInput
      length={4}
      label="Confirm your phone"
      hint="Four digits, sent by SMS."
      validate={verify}
      idPrefix="phone-otp"
      onComplete={(code, ok) => console.log(code, ok)}
    />
  );
}
