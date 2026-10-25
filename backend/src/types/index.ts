export type DeviceType = 
  | 'router'
  | 'core_switch'
  | 'switch'
  | 'server'
  | 'host'
  | 'access_point'
  | 'firewall'
  | 'isp';

export type DeviceStatus = 'online' | 'offline' | 'degraded';

export interface NetworkInterface {
  id: string;
  name: string; // e.g. GigabitEthernet0/0, eth0
  ipAddress?: string;
  subnetMask?: string;
  macAddress: string;
  vlanId?: number;
  status: 'up' | 'down';
  connectedToDeviceId?: string;
  connectedToInterfaceId?: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  department?: string;
  role: string;
  ipAddress?: string;
  macAddress?: string;
  vlanId?: number;
  status: DeviceStatus;
  interfaces: NetworkInterface[];
  position: { x: number; y: number };
  notes?: string;
}

export type LinkStatus = 'active' | 'failed' | 'congested' | 'blocked';

export interface NetworkLink {
  id: string;
  sourceDeviceId: string;
  sourceInterfaceId?: string;
  targetDeviceId: string;
  targetInterfaceId?: string;
  bandwidthMbps: number; // e.g. 1000 for 1Gbps
  latencyMs: number;     // e.g. 2ms
  status: LinkStatus;
  packetLossRate: number; // 0 to 1
  cost?: number;         // OSPF metric
  isRedundant?: boolean;
}

export interface VLAN {
  id: number;
  name: string;
  department: string;
  ipv4Subnet: string;   // e.g. 10.10.0.0/24
  ipv4Gateway: string;  // e.g. 10.10.0.1
  ipv6Subnet: string;   // e.g. 2001:db8:acad:10::/64
  ipv6Gateway: string;
  description: string;
  color: string;
}

export type RoutingProtocol = 'OSPF' | 'RIP' | 'STATIC';

export interface RouteEntry {
  destination: string;   // CIDR e.g. 10.10.0.0/24
  nextHop: string;       // Next hop IP or 'Direct'
  interfaceName: string; // Outgoing interface
  metric: number;        // Cost or hop count
  protocol: RoutingProtocol;
  status: 'active' | 'inactive';
}

export interface RouterRoutingTable {
  routerId: string;
  routerName: string;
  routes: RouteEntry[];
  protocol: RoutingProtocol;
  lastConvergedTimeMs: number;
}

export type ACLAction = 'ALLOW' | 'DENY';
export type TransportProtocol = 'TCP' | 'UDP' | 'ICMP' | 'ANY';

export interface ACLRule {
  id: string;
  priority: number;
  description: string;
  sourceSubnet: string;      // CIDR or 'ANY'
  destSubnet: string;        // CIDR or 'ANY'
  protocol: TransportProtocol;
  sourcePort?: string;       // e.g. 'ANY', '80', '1024-65535'
  destPort?: string;         // e.g. '80', '443', '22', 'ANY'
  action: ACLAction;
  enabled: boolean;
  hitCount: number;
}

export type QoSClass = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TrafficConfig {
  sourceDeviceId: string;
  destDeviceId: string;
  trafficClass: QoSClass;
  packetRatePps: number;
  packetSizeBytes: number;
  protocol: TransportProtocol;
  durationSeconds: number;
  useQoS: boolean;
}

export interface QoSMetrics {
  sentPackets: number;
  deliveredPackets: number;
  droppedPackets: number;
  throughputBps: number;
  averageDelayMs: number;
  packetLossPercentage: number;
  queueUtilization: number;
  linkUtilization: number;
  classBreakdown: {
    high: { sent: number; delivered: number; dropped: number; lossRate: number; delayMs: number };
    medium: { sent: number; delivered: number; dropped: number; lossRate: number; delayMs: number };
    low: { sent: number; delivered: number; dropped: number; lossRate: number; delayMs: number };
  };
}

export interface PacketTraceStep {
  stepNumber: number;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  inInterface?: string;
  outInterface?: string;
  actionTaken: string;
  decisionDetail: string;
  aclResult?: { ruleId: string; action: ACLAction; reason: string };
  status: 'forwarded' | 'dropped' | 'delivered';
}

export interface PacketTraceResult {
  sourceDevice: Device;
  destDevice: Device;
  protocol: TransportProtocol;
  success: boolean;
  totalHops: number;
  totalLatencyMs: number;
  failureReason?: string;
  steps: PacketTraceStep[];
  pathDeviceIds: string[];
}

export interface ServiceResult {
  service: 'DHCP' | 'DNS' | 'HTTP' | 'FTP' | 'SMTP' | 'NAT' | 'SNMP';
  clientDeviceId: string;
  serverDeviceId?: string;
  requestDetails: Record<string, any>;
  responseDetails: Record<string, any>;
  protocolLogs: string[];
  success: boolean;
  roundTripTimeMs: number;
}

export interface ExperimentVivaQuestion {
  question: string;
  answer: string;
}

export interface ExperimentRecord {
  id: number;
  title: string;
  aim: string;
  theory: string;
  requirements: string[];
  procedure: string[];
  configuration: Record<string, any>;
  observations: Record<string, any>;
  results: Record<string, any>;
  conclusion: string;
  vivaQuestions: ExperimentVivaQuestion[];
  status: 'pending' | 'completed';
  lastRunTimestamp?: string;
}
