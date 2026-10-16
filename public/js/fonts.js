// Google Fonts available in the theme editor, with the axes each family actually supports.
// Shared by the server (meta injection), the public site and the admin panel.
(function (g) {
  const FONTS = {
    heading: {
      'System': null,
      'Inter Tight': 'wght@400..800',
      'Inter': 'wght@400..800',
      'Fraunces': 'ital,wght@0,300..800;1,300..800',
      'Instrument Serif': 'ital@0;1',
      'DM Serif Display': 'ital@0;1',
      'Playfair Display': 'ital,wght@0,400..900;1,400..900',
      'Cormorant Garamond': 'ital,wght@0,300..700;1,300..700',
      'Syne': 'wght@400..800',
      'Space Grotesk': 'wght@300..700',
      'Bricolage Grotesque': 'wght@300..800',
      'Unbounded': 'wght@300..800',
      'Outfit': 'wght@300..800',
    },
    body: {
      'System': null,
      'Manrope': 'wght@300..800',
      'Inter': 'ital,wght@0,300..800;1,300..800',
      'DM Sans': 'ital,wght@0,300..800;1,300..800',
      'Outfit': 'wght@300..800',
      'Plus Jakarta Sans': 'ital,wght@0,300..800;1,300..800',
      'Poppins': 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400',
      'Work Sans': 'ital,wght@0,300..800;1,300..800',
      'Karla': 'ital,wght@0,300..800;1,300..800',
    },
  };

  function fontUrl(families) {
    const all = Object.assign({}, FONTS.body, FONTS.heading);
    const uniq = [...new Set(families.filter((f) => f && f !== 'System'))];
    if (!uniq.length) return '';
    const parts = uniq.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}${all[f] ? ':' + all[f] : ''}`);
    return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
  }

  // CSS font stack for a family name; System maps to the platform UI font (SF Pro on Apple).
  const SYSTEM = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';
  const stack = (f) => (!f || f === 'System' ? SYSTEM : `"${f}", ${SYSTEM}`);

  const api = { FONTS, fontUrl, stack };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else g.BHOOMI_FONTS = api;
})(this);
