# Metrics Portal Production-Readiness Playbook

## Purpose

This document set is the implementation playbook for turning the Metrics Portal into a reliable production system for Precision Liner (PL), PTFE, and Polyimide (PI). It is the shared source of truth for what we are building, why we are building it, how work is sequenced, how changes move through Git, and what must be proven before production deployment.

The program is not complete when the new code runs locally. It is complete when submissions are durable, duplicate-safe, recoverable, observable, tested, documented, and supportable by someone other than the original developer.

## How We Work From These Documents

Before starting work, every agent and contributor must read [Program Memory](Memory.md). Before finishing any work session or work package, they must update that file with what changed, decisions made, validation performed, deployment status, risks or blockers, and the exact next action. The memory update belongs in the same branch and commit as the work it describes. Work is not considered complete without it.

1. Work on one approved roadmap phase or bounded work package at a time.
2. Confirm the requirements and acceptance criteria before writing code.
3. Create a dedicated Git branch for the work package.
4. Implement the smallest complete vertical slice that can be tested.
5. Run the required automated and manual validation.
6. Update documentation, migrations, and the changelog in the same branch.
7. Review the diff and obtain approval before merging.
8. Merge only when the phase exit criteria are satisfied.
9. Deploy the merge commit, run smoke tests, and record the result.
10. Keep the rollback path available until the release is accepted.

New requests discovered during a phase are recorded in the backlog or risk register. They are not silently added to active scope unless they block safety, data integrity, or the approved acceptance criteria.

## Document Set

Read and maintain these documents in order:

1. [Current-State Inventory](00-current-state-inventory.md) - verified application, host, integration, and configuration baseline.
2. [Product Requirements](01-product-requirements.md) - users, goals, requirements, boundaries, and acceptance measures.
3. [Target Architecture](02-target-architecture.md) - the technical destination and key design rules.
4. [Delivery Roadmap](03-delivery-roadmap.md) - implementation phases, work packages, dependencies, and gates.
5. [Git and Release Workflow](04-git-and-release-workflow.md) - branching, commits, reviews, merges, tags, deployments, and hotfixes.
6. [Data Migration and Cutover](05-data-migration-and-cutover.md) - database rollout, compatibility, migration, rollback, and department cutovers.
7. [Test and Acceptance Plan](06-test-and-acceptance-plan.md) - automated, integration, failure, browser, and user acceptance testing.
8. [Operations and Recovery](07-operations-and-recovery.md) - monitoring, alerts, backups, restoration, support, and incident response.
9. [Risk and Decision Register](08-risk-and-decision-register.md) - known risks, assumptions, and architecture decisions.
10. [Development and Database Setup](09-development-and-database-setup.md) - local runtime, PostgreSQL, migrations, CI, and health verification.
11. [Durable Submissions](10-durable-submissions.md) - capture contract, outbox worker, supervisor controls, and failure behavior.
12. [Server Sessions and Workspaces](11-sessions-and-workspaces.md) - durable identity, kiosk locking, optimistic workspaces, and sign-out rules.
13. [Precision Liner Page Migration](12-precision-liner-page.md) - isolated page, server workspace, durable capture, validation, and rollback behavior.
14. [Windows Operations Tooling](13-windows-operations-tooling.md) - preflight, verified backup, health smoke tests, and manual server gates.
15. [Target Server Bootstrap](14-target-server-bootstrap.md) - verified host baseline, PostgreSQL installation, roles, first migration, and stop conditions.
16. [Precision Liner UAT and Rollback](15-pl-uat-and-rollback.md) - isolated browser acceptance, rollback rehearsal, cleanup, and sign-off record.
17. [PTFE Migration Work Package](16-ptfe-migration.md) - verified compatibility contract, durable two-destination design, validation, UAT, and cutover gates.
18. [Program Memory](Memory.md) - current state, completed work, open decisions, deployment status, and session-to-session handoff.

`AGENTS.md` contains the scoped enforcement instructions for coding agents working from this playbook.

## Current Production Baseline

As of August 13, 2026:

- The Metrics Portal web process runs under PM2 as `metrics-portal` on port 3002.
- The PL synchronization worker runs separately under PM2 as `metrics-portal-worker`.
- PL uses the isolated `/pl/` page, PostgreSQL-backed sessions and workspaces, durable database capture, and asynchronous delivery to the production PL Smartsheet master log.
- PTFE and PI continue using the combined compatibility page and synchronous direct-Smartsheet submission paths until their migration phases.
- PostgreSQL 18.4 is local-only on the application server and uses separate migration, runtime, and backup roles.
- A daily 1:00 AM off-server database backup task is active; backup integrity and isolated restoration have been proven.
- The retired `PL-Portal` PM2 process is stopped but retained temporarily as a rollback artifact.
- PL production health, real job/event delivery, outbox convergence, and backup scheduling have passed post-cutover checks.

## Target Outcome

The finished platform will have:

- One maintainable platform with isolated PL, PTFE, and PI applications.
- PostgreSQL as the authoritative operational data store.
- Durable, idempotent submissions with permanent submission IDs.
- A background outbox worker that synchronizes data to Smartsheet.
- Server-owned sessions, active work, and submission status.
- A supervisor view for pending, submitted, and failed records.
- Automated tests for normal and failure scenarios.
- Centralized logs, health checks, alerts, backups, and documented recovery.
- Controlled Git, release, deployment, and rollback procedures.

## Definition of Production Ready

A department is production ready only when all of the following are true:

- An acknowledged job or event cannot be lost.
- Repeating the same request cannot create a duplicate production record.
- A Smartsheet outage does not prevent the portal from safely recording work.
- Pending and failed synchronization is visible to supervisors.
- Browser refresh, timeout, multiple clicks, and reconnect scenarios are tested.
- Active associate data cannot leak into another associate's workspace.
- Database backup and restore have been successfully rehearsed.
- Monitoring identifies service, database, queue, and synchronization failures.
- Deployment and rollback steps have been tested.
- The department owner has signed off on user acceptance testing.

## Program Status

| Area | Status | Exit Evidence |
| --- | --- | --- |
| Requirements | Approved | Stakeholder approval recorded |
| Architecture | Approved | Decisions approved and prerequisites confirmed |
| Foundation | Complete | Database, migrations, health checks, and CI operational |
| Durable submissions | Complete | CI, target database/outbox proof, exact-ID delivery validation, and restart/retry tests passed |
| PL migration | Complete | PL UAT and sign-off, rollback rehearsal, database cutover, production job/event delivery, post-cutover health checks, and legacy process stop passed |
| PL stabilization | In progress | No stuck production submissions or reported issues through the August 13 review; 30-day observation and final SOP/support handoff remain |
| PTFE migration | In progress | Durable model/feature foundation implemented; isolated page, workspace flow, destination proof, UAT, and cutover approval remain |
| PI migration | Not started | PI user acceptance and cutover approval |
| Operations handoff | In progress | PostgreSQL bootstrap, daily verified backups, restore drill, production health checks, and PM2 worker operation passed; alert routing, TLS/DNS, quarterly drill ownership, and support handoff remain |

Update this table when a phase changes state. Allowed states are `Draft`, `Approved`, `In progress`, `Blocked`, and `Complete`.
