import { useState } from 'react';

export default function Faq({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div>
      {items.map((item, i) => (
        <div key={item.q} className={`faq-item${openIndex === i ? ' open' : ''}`}>
          <button className="faq-q" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            {item.q}
            <svg className="chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="faq-a">
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
