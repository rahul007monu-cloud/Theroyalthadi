# The Royal Thadi

Luxury QR-based cafe ordering experience for The Royal Thadi, Nausar Ghati, Ajmer.

## Included experiences

- `/` — customer ordering; pass `?table=1` through `?table=50`
- `/kitchen` — live order queue with preparation statuses
- `/admin` — overview, 50 unique table QR codes, menu and payment settings
- `/api/orders` — validated table-tagged order API
- `/api/qr?table=1` — downloadable QR generator

## Run locally

```bash
npm install
npm run dev
```

## Production configuration

```bash
NEXT_PUBLIC_APP_URL=https://your-final-domain.example
DATABASE_PATH=/persistent-storage/royal-thadi.db
```

`NEXT_PUBLIC_APP_URL` ensures downloaded table QR codes point to the final public website. `DATABASE_PATH` must point to persistent storage when the Node server is deployed.

The menu catalogue contains 72 items transcribed from the two public Royal Thadi menu images on District. Confirm any future price changes in the admin panel before launch.
