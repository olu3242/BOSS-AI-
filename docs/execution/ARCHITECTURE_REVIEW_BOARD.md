# BOSS Architecture Review Board

## Mission

The Architecture Review Board (ARB) protects the Execution Constitution,
Product Operating Model, Canonical Business Model, Business Operating Loop,
public contracts, and certification history.

ARB review is required for core platform contracts, new base business concepts,
new execution paths, cross-context state, migrations, breaking events/APIs,
autonomous behavior, and changes to constitutional governance.

## Required Review Questions

1. Which Business Operating Loop stage does this change serve?
2. Which Canonical Business Model entities and relationships does it read or
   update?
3. Who owns canonical state, and does this introduce duplicate state?
4. Does execution use UCR? If not, what certified migration exception applies?
5. What evidence permits the decision and verifies the outcome?
6. How does verified learning update Business Memory or the Business Graph?
7. Is behavior replayable, observable, tenant-isolated, and policy-governed?
8. How does this reduce time to value or improve a measured business outcome?
9. What backward compatibility, migration, rollback, and failure model applies?
10. Which certification gates and existing certifications are affected?

## Decisions

The ARB issues:

- Approved.
- Approved with conditions.
- Revision required.
- Rejected.

Decisions reference an ADR or review record, affected contracts, conditions,
owners, and required recertification. Approval is architecture evidence, not a
substitute for executable validation.

## Review Scope

Routine implementation within accepted contracts does not require a meeting,
but must answer the ARB questions in the pull request. High-impact changes
require explicit review by owners for Platform, Security, Data/Knowledge,
Runtime, and the affected business capability.

## Emergency Changes

Emergency defect mitigation may proceed with minimum necessary scope when
customer safety or availability requires it. The owner records the exception,
evidence, rollback, and retrospective ADR before normal development resumes.
