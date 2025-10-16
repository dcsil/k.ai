## ADRs
For any architectural/engineering decisions we make, we will create an ADR (Architectural Design Record) to keep track of what decision we made and why. This allows us to refer back to decisions in the future and see if the reasons we made a choice still holds true. This also allows for others to more easily understand the code.

**ADRs will follow this process:**
* They will live in the repo, under a directory architecture/adrs
* They will be written in markdown
* They will follow the naming convention adr-NNN-<decision-title>.md
* NNN will just be a counter starting at 001 and will allow us easily keep the records in chronological order.

**The common sections that each ADR should have are:**
* Title, Context, Decision, Status, Consequences
* Use this article as a reference: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

### Index

- [ADR 001: React.js & Next.js](./adr-001.md)
- [ADR 002: Prisma ORM + SQLite](./adr-002.md)
- [ADR 003: Hootsuite](./adr-003.md)
- [ADR 004: ayrshare](./adr-004.md)
- [ADR 005: Vitest (Testing Framework)](./adr-005.md)
