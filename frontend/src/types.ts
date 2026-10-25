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
  name: string;
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
  bandwidthMbps: number;
  latencyMs: number;
  status: LinkStatus;
  packetLossRate: number;
  cost?: number;
  isRedundant?: boolean;
}

export interface VLAN {
  id: number;
  name: string;
  department: string;
  ipv4Subnet: string;
  ipv4Gateway: string;
  ipv6Subnet: string;
  ipv6Gateway: string;
  description: string;
  color: string;
}

export type RoutingProtocol = 'OSPF' | 'RIP' | 'STATIC';

export interface RouteEntry {
  destination: string;
  nextHop: string;
  interfaceName: string;
  metric: number;
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
  sourceSubnet: string;
  destSubnet: string;
  protocol: TransportProtocol;
  sourcePort?: string;
  destPort?: string;
  action: ACLAction;
  enabled: boolean;
  hitCount: number;
}

export type QoSClass = 'HIGH' | 'MEDIUM' | 'LOW';

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

export interface NatEntry {
  id: string;
  privateIp: string;
  privatePort: number;
  publicIp: string;
  publicPort: number;
  protocol: 'TCP' | 'UDP';
  destIp: string;
  destPort: number;
  createdAt: string;
}

export interface SubnetDetails {
  ipAddress: string;
  prefixLength: number;
  subnetMask: string;
  subnetMaskBinary: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableHost: string;
  lastUsableHost: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  isPrivate: boolean;
}

export interface VlsmAllocation {
  name: string;
  requiredHosts: number;
  allocatedHosts: number;
  prefixLength: number;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  usableHostRange: string;
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

export interface DashboardStats {
  totalDevices: number;
  activeDevices: number;
  failedDevices: number;
  totalLinks: number;
  activeLinks: number;
  failedLinks: number;
  totalVlans: number;
  totalServers: number;
  activeServers: number;
  availabilityPercentage: number;
  simulatedThroughputMbps: number;
  averageDelayMs: number;
  packetLossPercentage: number;
  securityAlertsCount: number;
  recentEvents: { id: string; time: string; type: string; msg: string }[];
}
