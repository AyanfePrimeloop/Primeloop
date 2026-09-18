import { useState } from 'react';

export default function SiteFaq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {items.map((item, i) => (
        <div key={item.q} className={`s-faq-item${open === i ? ' open' : ''}`}>
          <button className="s-faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            {item.q}
            <span className="plus" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </span>
          </button>
          <div className="s-faq-a"><div><p>{item.a}</p></div></div>
        </div>
      ))}
    </div>
  );
}
