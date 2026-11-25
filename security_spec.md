# Security Specification — MÉDITATION CPC

## 1. Data Invariants
1. `daily_verses/{verseDate}`: Publicly readable (`get`, `list`), strictly immutable for visitors and regular users; only verified administrators can create, update, or delete verses. `verseDate` must match `^[0-9]{4}-[0-9]{2}-[0-9]{2}$` and equal `data.date`.
2. `users_settings/{userId}`: Only the owning authenticated user (`request.auth.uid == userId`) or an admin can read, create, update, or delete. `userId` and `createdAt` are immutable after creation; `updatedAt` must equal `request.time`.
3. `push_subscriptions/{subscriptionId}`: `fcmToken` is sensitive device routing data; only the owning user (`resource.data.userId == request.auth.uid`) or an admin can read/list/write/delete. `userId` and `createdAt` are immutable.
4. `notification_logs/{logId}`: Written exclusively by backend Cloud Functions (Admin SDK). Zero client write access; users may only read logs belonging to their own `userId`.

## 2. Dirty Dozen Payloads (Must All Return PERMISSION_DENIED)
1. Unauthenticated `create` on `/daily_verses/2026-11-25` -> DENIED.
2. Signed-in non-admin `update` on `/daily_verses/2026-11-25` -> DENIED.
3. Admin `create` on `/daily_verses/bad-id` (invalid date format) -> DENIED.
4. Signed-in user `A` attempting `get` on `/users_settings/userB` -> DENIED.
5. Signed-in user `A` attempting `list` on `/users_settings` without `where('userId', '==', uid)` -> DENIED.
6. Signed-in user `A` attempting `create` on `/users_settings/userA` with `userId: 'userB'` -> DENIED.
7. Signed-in user `A` attempting `create` on `/users_settings/userA` with extra shadow field `isAdmin: true` -> DENIED.
8. Signed-in user `A` attempting `update` on `/users_settings/userA` with invalid `preferredVersion: 'unknown'` -> DENIED.
9. Signed-in user `A` attempting `update` on `/users_settings/userA` modifying `createdAt` -> DENIED.
10. Signed-in user `A` attempting `create` on `/push_subscriptions/sub1` with oversized `fcmToken` (>512 chars) -> DENIED.
11. Signed-in user `A` attempting `get` on `/push_subscriptions/subOwnedByB` -> DENIED.
12. Signed-in user `A` attempting `create` on `/notification_logs/log1` -> DENIED.
