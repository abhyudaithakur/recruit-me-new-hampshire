# Recruit.me
Collaborative class project. Monorepo contains:
- `/GroupAnalysis` — storyboards, UML, JSON specs
- `/frontend` — React app (to be added)
- `/backend` — AWS Lambda handlers (to be added)

## Branches
- `main` — protected
- `develop` — integration branch
- `feature/*` — short-lived feature branches

## Conventions
- **Enums:** JobStatus, ApplicationRating, OfferStatus, Role
- **Pagination:** `?page`/`page_size` + `page_meta` in responses
- **Error envelope:** `{ "error": { "code", "message", "details" } }`

## Quick start
```
git clone <your-repo-url>
cd <repo>
git checkout -b develop
git push -u origin develop
```
