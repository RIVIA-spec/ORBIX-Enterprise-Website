# Firestore Indexes

Phase 3-A supports `DATA_BACKEND=memory` and `DATA_BACKEND=firestore`.
Firestore mode is allowed only against the local emulator in this phase.

Required indexes:

- `partnerMembers(partnerId, userId, status)`: `PartnersService.requireMembership`.
- `partnerMembers(userId, status)`: `PartnersService.my`.
- `properties(status, __name__)`: public properties and pending admin pagination.
- `properties(partnerId, __name__)`: partner properties pagination and partner isolation.
- `leads(customerUid, __name__)`: customer lead pagination.
- `leads(partnerId, __name__)`: partner lead pagination and partner isolation.
- `leads(customerUid, type, propertyId, createdAt)`: duplicate lead protection.

```json
{
  "indexes": [
    {
      "collectionGroup": "partnerMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "partnerId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "partnerMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "properties",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "__name__", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "properties",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "partnerId", "order": "ASCENDING" },
        { "fieldPath": "__name__", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customerUid", "order": "ASCENDING" },
        { "fieldPath": "__name__", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "partnerId", "order": "ASCENDING" },
        { "fieldPath": "__name__", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customerUid", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "propertyId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```
