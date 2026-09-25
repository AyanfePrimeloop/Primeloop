// Schema.org JSON-LD builders. Kept as plain objects, not components, so a
// page can drop the result straight into a <script type="application/ld+json">
// tag inside <Head>. One rule that matters for FAQPage specifically: Google
// only renders the FAQ rich result (the expandable dropdown in search
// results) for a narrow set of government/health sites since an August 2023
// policy change — for a site like this one, the schema is still valid and
// still helps search engines understand the page, but don't expect the
// visual dropdown to show up in results.

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Primeloop',
    url: 'https://primeloop.app',
    logo: 'https://primeloop.app/icon.png',
    description: 'Primeloop connects Nigerian businesses with real, verified people for genuine social media engagement, and pays those engagers weekly for completing tasks.',
  };
}

// `items` is the same [{ q, a }] shape SiteFaq takes — pass the page's fully
// resolved list (after any {PLACEHOLDER} substitution) so the schema always
// matches what a visitor actually sees.
export function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
