# Online Ordering

## Square Setup

1. Create a Square application and use its Sandbox credentials first.
2. Set `NUXT_SQUARE_ACCESS_TOKEN` on the Nuxt server only. Never prefix it with `VITE_` or expose it in browser code.
3. Set `NUXT_PUBLIC_SQUARE_APPLICATION_ID`, `NUXT_PUBLIC_SQUARE_LOCATION_ID`, and `NUXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox` for Web Payments.
4. Grant the application Catalog read, Orders write, and Payments write permissions.
5. Set `NUXT_SQUARE_PICKUP_PREP_TIME` to the restaurant's confirmed prep duration. The default is `PT30M`.
6. Configure Square's Web Payments domain and the production Content Security Policy before enabling live cards. Web Payments requires a secure context; localhost is suitable for local testing.
7. Complete Sandbox card tests before switching `NUXT_PUBLIC_SQUARE_ENVIRONMENT` to `production` and using production credentials.

The browser receives only the Square application and location IDs. The access token stays in Nitro runtime config. The server reads current variation IDs and prices from Square, creates the Square order, and charges the total Square returns. Client-supplied prices are never used for a charge.

The bundled `menu.snapshot.json` is explicitly a partial sample. Only dishes whose names match active Square Catalog items are orderable. Keep `VITE_MENU_URL` pointed at the complete approved menu and align names with Square, or add explicit mapping for catalog names that differ.

## Pickup And Delivery

Pickup uses Square's `PICKUP` fulfillment with `NUXT_SQUARE_PICKUP_PREP_TIME`.

Square `DELIVERY` fulfillment is a restricted beta and may not appear in Square POS without Square partner approval. Do not enable it until the merchant confirms beta access, delivery ZIP coverage, and the fee. Then set:

- `NUXT_SQUARE_DELIVERY_BETA=true`
- `NUXT_SQUARE_DELIVERY_ZIPS` to comma-separated ZIP codes
- `NUXT_SQUARE_DELIVERY_FEE_CENTS` to the approved fee in cents; `0` means free delivery

The checkout keeps delivery disabled unless all three are configured. Square applies catalog taxes and the configured delivery fee server-side.

## Illustrative Dish Photography

These are licensed Pexels stock photos, not photos of Spicy Avenue Kitchen's plated dishes. The UI labels them illustrative; replace them with restaurant photography when available. Pexels permits commercial website use without required attribution; do not imply that Pexels or a photographer endorses the restaurant.

- `hyderabadi-chicken-dum-biryani.jpg`: [Pexels chicken biryani photo](https://www.pexels.com/photo/rice-and-chicken-meal-on-the-plate-16020573/)
- `chicken-65.jpg`: [Pexels South Indian chicken fry photo](https://www.pexels.com/photo/spicy-south-indian-chicken-fry-on-artistic-plate-34636253/)
- `guntur-gongura-chicken-curry.jpg`: [Pexels Indian curry photo](https://www.pexels.com/photo/delicious-spicy-indian-curry-in-white-bowl-37485643/)
- `masala-dosa.jpg`: [Pexels masala dosa photo](https://www.pexels.com/photo/crispy-masala-dosa-with-chutneys-in-bengaluru-38201890/)
- `malai-paneer-tikka.jpg`: [Pexels paneer tikka photo](https://www.pexels.com/photo/grilled-paneer-tikka-with-spices-and-sauces-33430556/)
- `veg-cutlet.jpg`: [Pexels cutlet photo](https://www.pexels.com/photo/cutlets-on-a-white-ceramic-plate-5708088/)
- `butter-chicken.jpg`: [Pexels butter chicken photo](https://www.pexels.com/photo/delicious-butter-chicken-in-creamy-sauce-37295815/)
- `onion-kulcha.jpg`: [Pexels Indian naan photo](https://www.pexels.com/photo/pancakes-pasta-and-sauce-12737662/)
- `gulab-jamun.jpg`: [Pexels gulab jamun photo](https://www.pexels.com/photo/close-up-photo-of-an-indian-food-9198596/)
- `irani-chai.jpg`: [Pexels Indian tea photo](https://www.pexels.com/photo/tea-in-cup-17473023/)

Pexels license: https://www.pexels.com/license/
