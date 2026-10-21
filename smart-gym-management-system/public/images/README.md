# Images Used in This Project

This project uses **reliable, royalty-free image URLs** loaded directly from the
internet, so the site displays properly out of the box with zero setup —
no images to download or upload before your demo.

## Where images come from

1. **Member & Trainer profile photos** — generated automatically via
   [ui-avatars.com](https://ui-avatars.com), a free service that creates a
   clean colored avatar from each person's initials (e.g. "Rohit Sharma" ->
   a navy circle with "RS"). This never breaks and needs no API key.
   Example: `https://ui-avatars.com/api/?name=Rohit+Sharma&background=1e3a5f&color=fff&size=256`

2. **Equipment images** — category photos from
   [Unsplash](https://unsplash.com) (free-to-use, no attribution required
   for this kind of use), chosen per category (Cardio, Strength, Free
   Weights, Other).

3. **Exercise images** (in Workout Plans) — Unsplash photos matched to the
   target muscle group (chest, back, legs, shoulders, arms, core, cardio).

4. **Login page hero image** — a large Unsplash gym/fitness photograph.

## Using your own images instead

If you'd rather use your own photos (e.g. real member photos for a more
personal demo), just place image files in this folder using this structure:

```
public/images/
├── gym/        (hero/login images)
├── members/    (member profile photos)
├── trainers/   (trainer profile photos)
├── exercises/  (workout exercise photos)
└── equipment/  (equipment photos)
```

Then reference them with a relative path instead of the Unsplash/ui-avatars
URL, for example: `/images/members/rohit.jpg`. Every `photoUrl` /
`imageUrl` field in the database (Member, Trainer, Equipment, and each
exercise inside a WorkoutPlan) accepts any URL — local or remote — so you
can freely mix and match.

No image link in this project will ever be broken: every URL used by the
seed script and the "add new" forms is either a generated avatar or a
tested Unsplash photo URL.
