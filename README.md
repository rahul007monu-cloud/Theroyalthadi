# The Royal Thadi

Luxury QR-based cafe ordering for The Royal Thadi, Nausar Ghati, Ajmer.

## Screens

- `/?table=1` … `/?table=50` — customer menu with 3D kullad hero, search, category navigation, cart and ordering.
  Without a valid `table` the menu is browse-only, so no order can reach the wrong table.
- `/kitchen` — live order board (New → Accepted → Preparing → Ready → Served) plus waiter / water / bill calls.
- `/admin` — overview, live floor of 50 tables, printable QR cards, menu list and settings.

## APIs

- `POST /api/orders`, `GET /api/orders`, `PATCH /api/orders/:id`
- `POST /api/service-requests`, `GET /api/service-requests`, `PATCH /api/service-requests/:id`
- `GET /api/qr?table=1` — QR PNG for a table

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

`NEXT_PUBLIC_APP_URL` makes the QR codes point at the public website. `DATABASE_PATH` must be on persistent storage.
Serverless hosts such as Vercel have a read-only filesystem, so the APIs return a clear 503 there until an online database is connected.

## Menu

72 items in 13 categories, transcribed from the two public Royal Thadi menu images on District and re-checked at 3× zoom.
