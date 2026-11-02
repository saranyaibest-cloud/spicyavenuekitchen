/* Verified business data only. Everything here was supplied by the restaurant.
   phone, hours and social are NOT verified: they stay null / [] until the
   restaurant confirms them. Every component hides those parts while empty.

   When verified:
     phone:  '+1 281 555 0100'                       (string → tap-to-call everywhere)
     hours:  [{ days: 'Mon-Thu', open: '11:00', close: '22:00' }, …]   (format: app/lib/hours.js)
     social: [{ label: 'Instagram', url: 'https://…' }] */
export const SITE = {
  name: 'Spicy Avenue Kitchen',
  street: '23519 Katy FWY, Ste#501',
  city: 'Katy, Texas 77494, USA',
  mapsUrl:
    'https://www.google.com/maps/place/Spicy+Avenue+Kitchen/@29.7843153,-95.7794893,17z/data=!3m1!4b1!4m6!3m5!1s0x864127d2363d1ecb:0x83ab491d36a36f9b!8m2!3d29.7843153!4d-95.7794893!16s%2Fg%2F11p1jn9cqs?entry=ttu',
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Spicy+Avenue+Kitchen%2C+23519+Katy+Fwy+Ste+501%2C+Katy%2C+TX+77494',
  embedUrl: 'https://www.google.com/maps?q=29.7843153,-95.7794893&z=16&output=embed',
  phone: null,
  hours: null,
  social: [],
};

/* Favourites carousel, in display order. Names are matched to the menu
   case-insensitively; names not on the menu are skipped. */
export const FEATURED = [
  'Hyderabadi Chicken Dum Biryani',
  'Chicken 65',
  'Guntur Gongura Chicken Curry',
  'Masala Dosa',
  'Malai paneer tikka',
];
