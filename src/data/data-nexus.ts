export interface NexusMetric {
  value: string;
  label: string;
  detail: string;
}

export interface TimelineMilestone {
  year: string;
  label: string;
  summary: string;
}

export interface RegionPulse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  dataSignal: string;
  infrastructure: string;
  governance: string;
  pressure: string;
  accent: string;
}

export interface FeatureCard {
  title: string;
  body: string;
  meta?: string;
  icon: string;
}

export interface DilemmaChoice {
  id: string;
  label: string;
  stance: string;
  outcomeTitle: string;
  outcome: string;
  impact: string[];
}

export interface TechProtocol {
  id: string;
  name: string;
  shortName: string;
  promise: string;
  mechanism: string;
  riskSolved: string;
  flow: string[];
  icon: string;
}

export const heroMetrics: NexusMetric[] = [
  {
    value: '415 TWh',
    label: 'current data center demand',
    detail: 'A 2025 baseline for the energy pressure behind cloud and AI workloads.',
  },
  {
    value: '900B',
    label: 'projected AI agents',
    detail: 'A 2035-scale agentic internet reshapes data movement and governance.',
  },
  {
    value: '90%',
    label: 'optimization automated',
    detail: 'Human engineers move from manual tuning to global orchestration.',
  },
  {
    value: '1.2K TWh',
    label: '2035 energy scenario',
    detail: 'The sustainability paradox becomes an infrastructure design problem.',
  },
];

export const timelineMilestones: TimelineMilestone[] = [
  {
    year: '2025',
    label: 'Lakehouse baseline',
    summary: 'Open table formats, CDC, streaming engines, and governance converge into real-time lakehouse systems.',
  },
  {
    year: '2030',
    label: 'Autonomous operations',
    summary: 'AI begins tuning partitions, caching, ingestion paths, and workload placement with little human input.',
  },
  {
    year: '2035',
    label: 'Agentic data fabric',
    summary:
      'Quantum-assisted optimization, federated learning, and privacy-preserving computation become core architecture.',
  },
];

export const baselineCards: FeatureCard[] = [
  {
    title: 'Lakehouse convergence',
    body: 'Data lakes and warehouses merge into governed, reusable lakehouse tables that support machine learning, analytics, and operational intelligence from the same foundation.',
    meta: 'Iceberg, Delta Lake, Hudi, Paimon',
    icon: 'tabler:database',
  },
  {
    title: 'Streaming as default',
    body: 'Overnight batch windows give way to Kafka, Flink, Pulsar, CDC, and low-latency connectors that keep analytical systems synchronized with live operations.',
    meta: 'Kafka, Redpanda, Flink, Debezium',
    icon: 'tabler:activity',
  },
  {
    title: 'Regulatory friction',
    body: 'GDPR, CCPA, residency requirements, and lineage demands create a constant tension between personalization and privacy-first engineering.',
    meta: 'Privacy law meets architecture',
    icon: 'tabler:shield-lock',
  },
];

export const regionPulses: RegionPulse[] = [
  {
    id: 'north-america',
    name: 'North America',
    latitude: 42,
    longitude: -101,
    dataSignal: 'Hyperscale AI training and enterprise lakehouses drive the largest commercial demand spikes.',
    infrastructure: 'Snowflake, Databricks, Confluent, Spark Streaming',
    governance: 'CCPA, sector rules, state privacy laws',
    pressure: 'Commercial personalization versus biometric and consumer privacy constraints.',
    accent: '#2dd4bf',
  },
  {
    id: 'europe',
    name: 'Europe',
    latitude: 50,
    longitude: 10,
    dataSignal: 'Cross-border analytics are shaped by strict consent, residency, and lineage requirements.',
    infrastructure: 'Aiven, Apache Flink, Iceberg, sovereign cloud deployments',
    governance: 'GDPR and emerging AI governance rules',
    pressure: 'Innovation must prove minimization, explainability, and lawful basis by design.',
    accent: '#f59e0b',
  },
  {
    id: 'asia-pacific',
    name: 'Asia-Pacific',
    latitude: 25,
    longitude: 110,
    dataSignal: 'Dense mobile ecosystems and edge devices accelerate agentic internet growth.',
    infrastructure: 'Pulsar, Redpanda, edge inference, 5G/6G data fabrics',
    governance: 'National data residency and platform governance',
    pressure: 'Massive scale requires local processing and resilient regional controls.',
    accent: '#38bdf8',
  },
  {
    id: 'africa',
    name: 'Africa',
    latitude: 2,
    longitude: 22,
    dataSignal: 'Mobile-first finance, health, and civic systems create leapfrog data architectures.',
    infrastructure: 'Cloud lakehouses, regional edge nodes, event-driven civic services',
    governance: 'Emerging national privacy frameworks',
    pressure: 'Infrastructure growth must avoid importing opaque surveillance defaults.',
    accent: '#a3e635',
  },
  {
    id: 'latin-america',
    name: 'Latin America',
    latitude: -14,
    longitude: -60,
    dataSignal: 'Financial, agricultural, and public-sector analytics rely on resilient streaming pipelines.',
    infrastructure: 'CDC pipelines, lakehouse tables, regional cloud zones',
    governance: 'LGPD and country-specific privacy rules',
    pressure: 'Trust depends on transparent use of identity, payments, and public data.',
    accent: '#fb7185',
  },
];

export const futureSignals: FeatureCard[] = [
  {
    title: 'The agentic internet',
    body: 'Applications dissolve into networks of cooperating AI agents that negotiate context, intent, and services across spatial interfaces.',
    meta: 'From apps to orchestration',
    icon: 'tabler:network',
  },
  {
    title: 'Autonomous data warehouses',
    body: 'Warehouses tune indexes, heal partitions, rebalance compute, and predict cache needs before human operators see the bottleneck.',
    meta: 'Self-optimizing infrastructure',
    icon: 'tabler:robot',
  },
  {
    title: 'Quantum mining pressure',
    body: 'Quantum acceleration unlocks difficult simulations and pattern discovery, while also forcing new answers to energy growth and post-quantum security.',
    meta: 'Faster insight, harder constraints',
    icon: 'tabler:atom',
  },
];

export const ethicsCards: FeatureCard[] = [
  {
    title: 'Cognitive privacy',
    body: 'Wearables and mixed-reality systems collect signals that reveal health, emotion, attention, and intent before users can consciously explain them.',
    icon: 'tabler:brain',
  },
  {
    title: 'Deep-tier bias',
    body: 'Autonomous mining systems can reproduce historical harm through hidden correlations that are difficult for human auditors to detect or contest.',
    icon: 'tabler:scale',
  },
  {
    title: 'Synthetic reality',
    body: "Deepfakes and synthetic evidence create impostor bias and the liar's dividend, weakening trust in authentic records and institutions.",
    icon: 'tabler:mask',
  },
];

export const dilemmaChoices: DilemmaChoice[] = [
  {
    id: 'decrypt-sell',
    label: 'Decrypt and sell the insight',
    stance: 'Maximize intervention speed and commercial value.',
    outcomeTitle: 'A life may be saved, but trust collapses.',
    outcome:
      'The pharmaceutical vendor targets the user before consent is granted. A regulator later treats the action as biometric exploitation, and the warehouse loses its public mandate.',
    impact: ['Fastest intervention', 'Highest privacy breach risk', 'Creates a market for subconscious signals'],
  },
  {
    id: 'hold-private',
    label: 'Keep the signal private',
    stance: 'Preserve consent and avoid unauthorized use.',
    outcomeTitle: 'Privacy holds, but preventable harm remains possible.',
    outcome:
      'The system refuses to expose the encrypted signal. The user keeps control, but the team must explain why the architecture detected risk without a consented response path.',
    impact: ['Strongest consent posture', 'Weakest immediate intervention', 'Reveals a product design gap'],
  },
  {
    id: 'proof-based-alert',
    label: 'Send a proof-based alert',
    stance: 'Use privacy-preserving verification and user-directed escalation.',
    outcomeTitle: 'The system intervenes without opening the raw data.',
    outcome:
      'A zero-knowledge alert verifies risk thresholds and asks the user to approve a care pathway. The vendor never sees the biometric stream, and the audit trail remains reviewable.',
    impact: ['Balanced intervention', 'Requires stronger cryptographic infrastructure', 'Best fit for 2035 governance'],
  },
];

export const cryptoProtocols: TechProtocol[] = [
  {
    id: 'federated-learning',
    name: 'Federated Learning',
    shortName: 'FL',
    promise: 'Train models where the sensitive data already lives.',
    mechanism:
      'Devices or institutions compute local model updates, then share only gradients or weights for aggregation.',
    riskSolved: 'Prevents mass centralization of raw biometric, health, and behavioral records.',
    flow: ['Local data stays put', 'Model trains at the edge', 'Only updates travel', 'Global model improves'],
    icon: 'tabler:route',
  },
  {
    id: 'homomorphic-encryption',
    name: 'Fully Homomorphic Encryption',
    shortName: 'FHE',
    promise: 'Compute on locked data without seeing the contents.',
    mechanism:
      'Lattice-based schemes let servers add and multiply ciphertexts, returning encrypted results that only clients can decrypt.',
    riskSolved: 'Neutralizes inference and model-stealing attacks from a curious or compromised aggregator.',
    flow: ['Encrypt update', 'Aggregate ciphertext', 'Return locked result', 'Client decrypts'],
    icon: 'tabler:lock-square-rounded',
  },
  {
    id: 'zero-knowledge-proofs',
    name: 'Zero-Knowledge Proofs',
    shortName: 'ZKP',
    promise: 'Prove a claim without revealing the underlying fact pattern.',
    mechanism: 'zk-SNARK and zk-STARK style proofs validate statements through cryptographic commitments and hashes.',
    riskSolved:
      'Reduces stored identity data and verifies eligibility, thresholds, or transactions without exposing private attributes.',
    flow: ['Make claim', 'Generate proof', 'Verify proof', 'Reveal nothing else'],
    icon: 'tabler:binary-tree',
  },
];

export const presentationPhases: FeatureCard[] = [
  {
    title: 'QR drop',
    body: 'The room joins the exhibit from personal devices while the presenter mirrors the main scroll narrative.',
    meta: 'Onboarding',
    icon: 'tabler:qrcode',
  },
  {
    title: 'Guided tour',
    body: 'The presenter narrates lakehouse, quantum, ethics, and cryptography sections while the interface carries the visual load.',
    meta: 'Instructional flow',
    icon: 'tabler:presentation',
  },
  {
    title: 'Live dilemma',
    body: 'The audience votes on the biometric health scenario, then the selected consequence becomes the shared ethical resolution.',
    meta: 'Participation',
    icon: 'tabler:message-question',
  },
];

export const successMetrics: NexusMetric[] = [
  {
    value: 'Scroll depth',
    label: 'completion signal',
    detail: 'Indicates whether visitors reached the ethical and solution sections.',
  },
  {
    value: 'Interaction rate',
    label: 'active learning signal',
    detail: 'Tracks slider moves, globe region exploration, tech-node clicks, and dilemma choices.',
  },
  {
    value: 'Reflection quality',
    label: 'academic success signal',
    detail: 'Connects technical choices to the capstone rubric and live discussion.',
  },
];

export const sourceLinks = [
  { label: 'Google Cloud: Federated learning', href: 'https://cloud.google.com/discover/what-is-federated-learning' },
  {
    label: 'IBM Research: Federated learning meets homomorphic encryption',
    href: 'https://research.ibm.com/blog/federated-learning-homomorphic-encryption',
  },
  {
    label: 'Brookings: AI energy demands',
    href: 'https://www.brookings.edu/articles/global-energy-demands-within-the-ai-regulatory-landscape/',
  },
  {
    label: 'UNESCO: Deepfakes and the crisis of knowing',
    href: 'https://www.unesco.org/en/articles/deepfakes-and-crisis-knowing',
  },
  {
    label: 'KSU Undergraduate Research and Engagement Showcase',
    href: 'https://campus.kennesaw.edu/colleges-departments/coles/events/showcase/index.php',
  },
];
