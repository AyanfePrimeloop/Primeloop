import { cleanCode } from '../../lib/referral';

// Short referral link: primeloop.app/r/EN1234AB -> /join?ref=EN1234AB.
// Only letters and digits are passed on, and the destination is always a page
// inside Primeloop, so this can never redirect anywhere else.
export async function getServerSideProps({ params }) {
  const code = cleanCode(params.code);
  return { redirect: { destination: code ? `/join?ref=${code}` : '/join', permanent: false } };
}

export default function ReferralRedirect() {
  return null;
}
