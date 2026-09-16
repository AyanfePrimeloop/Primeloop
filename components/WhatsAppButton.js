export default function WhatsAppButton({ number = '2348085176399' }) {
  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noreferrer"
      className="whatsapp-fab"
      style={{
        position: 'fixed', bottom: 22, right: 22, background: '#25D366', color: '#fff',
        padding: '12px 18px', borderRadius: 99, textDecoration: 'none', fontSize: 13.5,
        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 14px rgba(0,0,0,.2)', zIndex: 50,
      }}
    >
      💬 Chat with an admin
    </a>
  );
}
