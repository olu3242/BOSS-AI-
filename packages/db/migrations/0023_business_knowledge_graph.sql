-- Epic 2 / Capability 2 / Batch 1: tenant Business Knowledge Graph.

CREATE TABLE business_graphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  discovery_id uuid NOT NULL REFERENCES business_discoveries(id),
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'archived')
  ),
  current_version integer NOT NULL DEFAULT 1 CHECK (current_version > 0),
  lock_version integer NOT NULL DEFAULT 1 CHECK (lock_version > 0),
  source_discovery_version integer NOT NULL CHECK (source_discovery_version > 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, business_id),
  UNIQUE (id, org_id)
);

CREATE TABLE business_graph_nodes (
  graph_id uuid NOT NULL,
  org_id uuid NOT NULL,
  node_id text NOT NULL,
  node_type text NOT NULL,
  label text NOT NULL,
  external_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (graph_id, node_id),
  UNIQUE (graph_id, node_id, org_id),
  FOREIGN KEY (graph_id, org_id)
    REFERENCES business_graphs(id, org_id) ON DELETE CASCADE
);

CREATE TABLE business_graph_edges (
  graph_id uuid NOT NULL,
  org_id uuid NOT NULL,
  edge_id text NOT NULL,
  source_node_id text NOT NULL,
  target_node_id text NOT NULL,
  relationship_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (graph_id, edge_id),
  FOREIGN KEY (graph_id, org_id)
    REFERENCES business_graphs(id, org_id) ON DELETE CASCADE,
  FOREIGN KEY (graph_id, source_node_id, org_id)
    REFERENCES business_graph_nodes(graph_id, node_id, org_id) ON DELETE CASCADE,
  FOREIGN KEY (graph_id, target_node_id, org_id)
    REFERENCES business_graph_nodes(graph_id, node_id, org_id) ON DELETE CASCADE,
  UNIQUE (
    graph_id, source_node_id, target_node_id, relationship_type
  )
);

CREATE TABLE business_graph_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_id uuid NOT NULL,
  org_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  lock_version integer NOT NULL CHECK (lock_version > 0),
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  source_discovery_version integer NOT NULL CHECK (source_discovery_version > 0),
  nodes jsonb NOT NULL CHECK (jsonb_typeof(nodes) = 'array'),
  edges jsonb NOT NULL CHECK (jsonb_typeof(edges) = 'array'),
  metadata jsonb NOT NULL CHECK (jsonb_typeof(metadata) = 'object'),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (graph_id, version),
  FOREIGN KEY (graph_id, org_id)
    REFERENCES business_graphs(id, org_id) ON DELETE CASCADE
);

CREATE TABLE business_graph_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_id uuid NOT NULL,
  org_id uuid NOT NULL,
  graph_version integer NOT NULL CHECK (graph_version > 0),
  action text NOT NULL CHECK (action IN (
    'created', 'node_created', 'node_updated', 'relationship_created',
    'relationship_removed', 'versioned', 'published', 'archived'
  )),
  actor_id text NOT NULL,
  reason text NOT NULL DEFAULT '',
  correlation_id text NOT NULL,
  trace_id text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (graph_id, org_id)
    REFERENCES business_graphs(id, org_id) ON DELETE CASCADE
);

CREATE INDEX idx_business_graphs_tenant
  ON business_graphs(org_id, business_id);
CREATE INDEX idx_business_graph_nodes_type
  ON business_graph_nodes(org_id, graph_id, node_type);
CREATE INDEX idx_business_graph_edges_source
  ON business_graph_edges(org_id, graph_id, source_node_id);
CREATE INDEX idx_business_graph_edges_target
  ON business_graph_edges(org_id, graph_id, target_node_id);
CREATE INDEX idx_business_graph_snapshots_version
  ON business_graph_snapshots(org_id, graph_id, version DESC);
CREATE INDEX idx_business_graph_history_time
  ON business_graph_history(org_id, graph_id, occurred_at DESC);

ALTER TABLE business_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graph_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graph_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_graphs_tenant_policy ON business_graphs
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY business_graph_nodes_tenant_policy ON business_graph_nodes
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY business_graph_edges_tenant_policy ON business_graph_edges
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY business_graph_snapshots_tenant_policy ON business_graph_snapshots
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY business_graph_history_tenant_policy ON business_graph_history
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
