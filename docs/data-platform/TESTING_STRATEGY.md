# BOSS Testing Strategy

> Version: 1.0.0 | Test coverage requirements, patterns, and quality gates

---

## Testing Philosophy

Every feature ships with tests. Tests prove correctness of behavior, not just code coverage. Coverage is a floor, not a ceiling.

```
Unit tests      → Pure functions, service logic, validation
Integration     → Database queries, repository contracts
API tests       → Endpoint behavior, auth, error states
E2E tests       → Critical user journeys (happy path + key error paths)
```

---

## Coverage Requirements

| Layer | Minimum Coverage | Target |
|-------|-----------------|--------|
| Services (business logic) | 80% | 90% |
| Repositories | 70% | 85% |
| API handlers | 75% | 85% |
| Utility functions | 90% | 95% |
| UI components | 60% | 75% |

---

## Unit Test Patterns

### Service Layer Tests

```typescript
// Pattern: Arrange → Act → Assert
describe('LeadService.convert', () => {
  it('creates customer and links to lead', async () => {
    const { leadRepo, customerRepo } = mockRepos();
    const lead = buildLead({ status: 'qualified' });
    leadRepo.findById.mockResolvedValue(lead);
    customerRepo.create.mockResolvedValue(buildCustomer());

    const result = await leadService.convert(orgId, businessId, lead.id, {});

    expect(customerRepo.create).toHaveBeenCalledOnce();
    expect(leadRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'converted', converted_at: expect.any(Date) })
    );
    expect(result.customer).toBeDefined();
  });

  it('rejects if lead already converted', async () => {
    const lead = buildLead({ status: 'converted' });
    leadRepo.findById.mockResolvedValue(lead);

    await expect(leadService.convert(orgId, businessId, lead.id, {}))
      .rejects.toMatchObject({ code: 'LEAD_ALREADY_CONVERTED' });
  });
});
```

### Validation Tests

```typescript
describe('CreateInvoiceSchema', () => {
  it('rejects total mismatch', () => {
    const result = CreateInvoiceSchema.safeParse({
      subtotal_cents: 1000,
      tax_cents: 100,
      discount_cents: 0,
      total_cents: 900,  // wrong: should be 1100
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].code).toBe('custom');
  });
});
```

---

## Repository Integration Tests

Test against a real Postgres instance (test database, rolled back after each test).

```typescript
describe('CustomerRepository', () => {
  beforeEach(() => testDb.beginTransaction());
  afterEach(() => testDb.rollback());

  it('scopes queries by org_id', async () => {
    const orgA = await createTestOrg();
    const orgB = await createTestOrg();
    await createCustomer({ org_id: orgA.id });
    await createCustomer({ org_id: orgB.id });

    const results = await customerRepo.list(orgA.id, businessId);
    expect(results.every(c => c.org_id === orgA.id)).toBe(true);
    expect(results).toHaveLength(1);
  });

  it('excludes soft-deleted records by default', async () => {
    const customer = await createCustomer({ deleted_at: new Date() });
    const results = await customerRepo.list(orgId, businessId);
    expect(results.find(c => c.id === customer.id)).toBeUndefined();
  });
});
```

---

## API Handler Tests

```typescript
describe('POST /v1/businesses/:businessId/leads', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/businesses/x/leads' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects invalid email', async () => {
    const res = await authedRequest('POST', '/v1/businesses/:id/leads', {
      body: { first_name: 'Jane', email: 'not-an-email', source: 'website' }
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('LEAD_EMAIL_INVALID');
  });

  it('extracts org_id from JWT, not body', async () => {
    const res = await authedRequest('POST', '/v1/businesses/:id/leads', {
      body: { first_name: 'Jane', source: 'website', org_id: 'hacker-org-id' }
    });
    const lead = await leadRepo.findById(res.json().data.id);
    expect(lead.org_id).not.toBe('hacker-org-id');
    expect(lead.org_id).toBe(jwtOrgId);
  });
});
```

---

## AI Service Tests

AI inference is tested with mocked Claude API responses to avoid cost and flakiness.

```typescript
describe('DnaService.generate', () => {
  it('uses raw decision when ANTHROPIC_API_KEY absent', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await dnaService.generate(orgId, businessId, mriResponses);
    expect(mockAnthropicClient).not.toHaveBeenCalled();
    expect(result).toMatchObject({ growth_stage: expect.any(String) });
  });

  it('persists dna and emits event', async () => {
    const result = await dnaService.generate(orgId, businessId, mriResponses);
    expect(dnaRepo.upsert).toHaveBeenCalledOnce();
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'business_dna_generated' })
    );
  });
});
```

---

## Secret Vault Tests

```typescript
describe('DbSecretStore', () => {
  it('round-trips a secret through AES-256-GCM', async () => {
    process.env.BOSS_SECRET_VAULT_KEY = '0'.repeat(64);
    const store = createDbSecretStore();
    const ref = { key: 'test_api_key', provider: 'twilio' };

    await store.put(ref, 'secret-value-123');
    const retrieved = await store.get(ref);

    expect(retrieved).toBe('secret-value-123');
  });

  it('returns null for missing key', async () => {
    const result = await store.get({ key: 'nonexistent', provider: 'test' });
    expect(result).toBeNull();
  });

  it('increments version on rotate', async () => {
    await store.put(ref, 'v1');
    await store.rotate(ref, 'v2');
    const cred = await db.query('SELECT version FROM provider_credentials WHERE secret_key=$1', [ref.key]);
    expect(cred.rows[0].version).toBe(2);
  });
});
```

---

## RLS Tests

```typescript
describe('Row Level Security', () => {
  it('blocks cross-org customer access', async () => {
    const orgA = await createOrg();
    const orgB = await createOrg();
    const customer = await createCustomer({ org_id: orgA.id });

    // Query with orgB's JWT context
    const result = await queryAsOrg(orgB.id, 
      'SELECT * FROM customers WHERE id = $1', [customer.id]);

    expect(result.rows).toHaveLength(0);
  });

  it('allows same-org access', async () => {
    const org = await createOrg();
    const customer = await createCustomer({ org_id: org.id });

    const result = await queryAsOrg(org.id,
      'SELECT * FROM customers WHERE id = $1', [customer.id]);

    expect(result.rows).toHaveLength(1);
  });
});
```

---

## Workflow Tests

```typescript
describe('BTE Cycle Workflow', () => {
  it('executes all steps and emits bte.cycle.completed', async () => {
    const exec = await workflowEngine.dispatch('biz.bte.cycle', { businessId });

    await exec.waitForCompletion(timeout: 30000);

    expect(exec.status).toBe('completed');
    expect(eventLog).toContainEvent('bte.cycle.completed');
    expect(businessHealthRepo.findLatest).toHaveBeenCalled();
  });

  it('handles step failure with compensation', async () => {
    constraintEngine.analyze.mockRejectedValue(new Error('timeout'));
    const exec = await workflowEngine.dispatch('biz.bte.cycle', { businessId });

    await exec.waitForCompletion();

    expect(exec.status).toBe('failed');
    expect(eventLog).toContainEvent('workflow.execution.failed');
    // Compensation: no partial data persisted
    expect(constraintInstanceRepo.create).not.toHaveBeenCalled();
  });
});
```

---

## E2E Critical Paths

### Must-Pass E2E Tests

| Journey | Steps | Assertions |
|---------|-------|-----------|
| Business setup | Create org → Create business → Start MRI → Answer all questions → Complete MRI → Verify DNA generated | DNA record exists, health calculated |
| Lead conversion | Create lead → Qualify → Convert → Verify customer created | Customer linked, lead.converted_at set |
| Invoice payment | Create invoice → Send → Record payment → Verify total_revenue updated | Invoice paid, customer revenue incremented |
| Recommendation approval | Generate constraints → Generate recommendations → Approve recommendation → Verify workflow dispatched | Workflow execution exists |
| AI employee activation | Activate employee → Dispatch BTE cycle → Verify tool execution | tool_executions record created |

---

## Quality Gates (CI)

All must pass before merge:

```yaml
quality_gates:
  - name: typecheck
    command: tsc --noEmit
    
  - name: lint
    command: eslint . --max-warnings 0
    
  - name: unit_tests
    command: vitest run
    threshold: 80% coverage
    
  - name: knip
    command: knip
    # Zero unused exports, zero unused files
    
  - name: depcruise
    command: depcruise --config .dependency-cruiser.cjs apps packages
    # Zero boundary violations
    
  - name: build
    command: turbo build
```

---

## Test Data Builders

All tests use builder functions rather than raw objects:

```typescript
// Pattern: sensible defaults, override anything
export function buildLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: randomUUID(),
    org_id: randomUUID(),
    business_id: randomUUID(),
    first_name: 'Test',
    last_name: 'Lead',
    email: 'test@example.com',
    source: 'manual',
    status: 'new',
    tags: [],
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}
```

Builders live in `packages/shared/test-utils/builders.ts`.
