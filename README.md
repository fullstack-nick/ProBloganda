# ProBloganda

A Next.js blog that merges DummyJSON content with authenticated, user-created posts and comments stored in MongoDB.

> Note: There is no registration flow in this demo app. Log in using either username `emilys` or `alexanderj` and your own email address. These map to DummyJSON users whose posts appear in the app; any posts or comments you create will be authored as one of those two DummyJSON users.

## Overview

ProBloganda combines a read-only feed from DummyJSON with custom posts and comments stored in MongoDB. It is built for readers who want to browse posts by tag or author, and for authenticated users who want to publish, react, and discuss content. The key differentiator is the unified data layer that merges external API content with local custom content so the UI treats them as one feed.

## Features

### Core browsing

- Unified posts feed that combines DummyJSON posts with custom MongoDB posts.
- Search by text or tag; tag search can be triggered from the tag cloud or URL query.
- Sort by recency (id), title, or body with ascending or descending order.
- Pagination for long lists (25 per page).
- Author directory with search and author-specific post pages.
- Tag fisheye cloud for visual discovery.

### Post and comment management

- Post detail view with author link, tags, reactions, and comments.
- Create new posts with title, body, and tags; tags are normalized to single-word slugs.
- Edit and delete your own custom posts.
- Add, edit, and delete your own custom comments.
- Optimistic UI updates for creating and editing posts and comments.

### Reactions and engagement

- Like or dislike custom posts; toggling and switching reactions is supported.
- Like custom comments.

### Accounts and personalization

- Login/logout via Kinde; profile page shows the mapped DummyJSON user info and your posts.
- Light/dark theme toggle persisted in a cookie.

> Note: DummyJSON content is read-only. Only custom posts and comments stored in MongoDB can be edited or reacted to.

## Typical User Workflow

### Guest browsing

1. A visitor lands on `/` and is redirected to `/posts`, the unified feed.
2. They browse cards with title, excerpt, tags, and reaction counts, then paginate through the list.
3. They use the toolbar to sort by recency, title, or content, and search by keyword.
4. They click Tags to open the fisheye tag cloud, pick a tag, and see filtered posts.
5. They click Authors to search by name and open an author page with that author's posts.
6. They open a post to read the full content, follow author or tag links, and read comments.

### Authenticated authoring and engagement

1. The user logs in via Kinde from the header. The UI now shows Add post and Profile.
2. They open Add post, fill in title, body, and tags, and submit. A success overlay appears and they are redirected back to the feed.
3. Their custom post appears in the list with a NEW badge. In the post detail view, they can edit or delete it.
4. On any post detail page, they add a comment. Their custom comments can be edited or deleted from the same page.
5. They react to custom posts with like or dislike, and like custom comments.
6. In Profile, they see their mapped DummyJSON user details and a list of their posts.

## Tech Stack

- Frontend: Next.js 16 App Router with React 19. Server components render pages in `app/`, while client components in `components/` handle interactive UI (search, sorting, forms, reactions).
- Routing and UI flow: Route groups `(public)` and `(protected)` separate public browsing from authenticated screens; `next/navigation` drives client transitions and query string updates.
- Backend runtime: Next.js server actions in `app/actions/*.ts` implement create/update/delete for posts and comments and reaction toggles. Route handlers in `app/api/` provide GET APIs for search and sorting.
- Data layer: MongoDB via Mongoose; schemas in `models/` store custom posts, comments, and per-user reaction metadata. `lib/mongodb.ts` manages a cached connection.
- External data: DummyJSON API supplies posts, comments, tags, and author info; `lib/dummyjson.ts` wraps fetch calls with caching and revalidation. `lib/*-service.ts` merges DummyJSON data with MongoDB data into unified types.
- Auth: Kinde Next.js SDK (`@kinde-oss/kinde-auth-nextjs`) provides login/logout components and server-side session checks; auth callbacks are handled in `app/api/auth/[kindeAuth]/route.ts`.
- Styling: Tailwind CSS v4 with PostCSS; dark mode uses the `class` strategy and a cookie to persist the choice.
- Tooling: TypeScript (strict), ESLint with Next core-web-vitals config.

## Architecture / Project Structure

- `app/` contains Next.js App Router routes and shared layout. Public vs protected screens are organized via route groups.
- `app/actions/` holds server actions for creating, updating, and deleting posts/comments plus reaction toggles.
- `app/api/` contains route handlers for Kinde auth callbacks and lightweight search/sort APIs.
- `components/` holds client UI components for lists, forms, reactions, and layout.
- `lib/` implements server-only data services that merge DummyJSON API data with MongoDB data.
- `models/` defines Mongoose schemas for posts and comments.
- `proxy.ts` defines a Kinde auth middleware configuration (rename to `middleware.ts` to enable it as Next middleware).
- `public/` stores static assets like the logo.

## Security / Privacy Notes

- Authentication and sessions are handled by Kinde; server actions verify authentication before writes.
- Edit and delete operations verify ownership using the mapped DummyJSON user id.
- Only custom posts and comments in MongoDB can be modified or reacted to.

## Live Demo

[Open the app](https://probloganda.vercel.app/)
