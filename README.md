# Recruit.me
Collaborative class project. Monorepo contains:
- `/GroupAnalysis` — storyboards, UML, JSON specs
- `/frontend` — React app (to be added)
- `/backend` — AWS Lambda handlers (to be added)

## Conventions
- **Enums:** JobStatus, ApplicationRating, OfferStatus, Role
- **Pagination:** `?page`/`page_size` + `page_meta` in responses
- **Error envelope:** `{ "error": { "code", "message", "details" } }`

## Branches
- `main` — protected
- `<issueNumber>-<githubUsername>-<feature-name>` — short-lived feature branches

### Workflow

- Create an issue in github
- Make a branch for the issue
- Checkout issue branch and work on it
- Create Pull Request for branch
- Have someone review and accept change

### Quick start
```
git clone https://github.com/abhyudaithakur/recruit-me-new-hampshire
cd recruit-me-new-hampshire
git checkout -b <branch-name>
git push -u origin develop
```
