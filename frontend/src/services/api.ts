import { 
  DashboardStats, 
  Device, 
  NetworkLink, 
  VLAN, 
  ACLRule, 
  RouterRoutingTable, 
  PacketTraceResult, 
  ServiceResult, 
  SubnetDetails, 
  VlsmAllocation, 
  ExperimentRecord, 
  NatEntry, 
  RoutingProtocol 
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Stats
  getDashboardStats: () => fetch(`${BASE_URL}/stats/dashboard`).then(res => handleResponse<DashboardStats>(res)),

  // Topology
  getTopology: () => fetch(`${BASE_URL}/topology`).then(res => handleResponse<{ devices: Device[]; links: NetworkLink[]; vlans: VLAN[]; aclRules: ACLRule[] }>(res)),
  saveDevice: (device: Device) => fetch(`${BASE_URL}/topology/device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device),
  }).then(res => handleResponse<{ success: boolean; device: Device }>(res)),
  deleteDevice: (id: string) => fetch(`${BASE_URL}/topology/device/${id}`, { method: 'DELETE' }).then(res => handleResponse(res)),
  saveLink: (link: NetworkLink) => fetch(`${BASE_URL}/topology/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(link),
  }).then(res => handleResponse<{ success: boolean; link: NetworkLink }>(res)),
  deleteLink: (id: string) => fetch(`${BASE_URL}/topology/link/${id}`, { method: 'DELETE' }).then(res => handleResponse(res)),
  resetTopology: () => fetch(`${BASE_URL}/topology/reset`, { method: 'POST' }).then(res => handleResponse<{ success: boolean; message: string }>(res)),

  // VLANs & Addressing
  getVlans: () => fetch(`${BASE_URL}/vlans`).then(res => handleResponse<VLAN[]>(res)),
  calculateSubnet: (ip: string, prefix: number) => fetch(`${BASE_URL}/addressing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, prefix }),
  }).then(res => handleResponse<SubnetDetails>(res)),
  calculateVlsm: (parentCidr: string, departments: { name: string; requiredHosts: number }[]) => fetch(`${BASE_URL}/addressing/vlsm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parentCidr, departments }),
  }).then(res => handleResponse<VlsmAllocation[]>(res)),

  // Routing
  getRoutingTables: (protocol: RoutingProtocol = 'OSPF') => fetch(`${BASE_URL}/routing/tables?protocol=${protocol}`).then(res => handleResponse<RouterRoutingTable[]>(res)),
  findRoutePath: (sourceId: string, destId: string, protocol: RoutingProtocol = 'OSPF') => fetch(`${BASE_URL}/routing/path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, destId, protocol }),
  }).then(res => handleResponse<any>(res)),

  // Fault Tolerance
  simulateFault: (sourceId: string, destId: string, linkIdToFail: string, protocol: RoutingProtocol = 'OSPF') => fetch(`${BASE_URL}/fault/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, destId, linkIdToFail, protocol }),
  }).then(res => handleResponse<any>(res)),

  // Security & ACLs
  getAclRules: () => fetch(`${BASE_URL}/security/rules`).then(res => handleResponse<ACLRule[]>(res)),
  saveAclRule: (rule: ACLRule) => fetch(`${BASE_URL}/security/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  }).then(res => handleResponse<{ success: boolean; rule: ACLRule }>(res)),
  deleteAclRule: (id: string) => fetch(`${BASE_URL}/security/rules/${id}`, { method: 'DELETE' }).then(res => handleResponse(res)),
  inspectPacket: (sourceIp: string, destIp: string, protocol: string, destPort?: number) => fetch(`${BASE_URL}/security/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceIp, destIp, protocol, destPort }),
  }).then(res => handleResponse<any>(res)),

  // Packet Flow Tracer
  tracePacket: (params: {
    sourceDeviceId: string;
    destDeviceId: string;
    protocol: string;
    destPort?: number;
    packetSizeBytes?: number;
    routingProtocol?: string;
  }) => fetch(`${BASE_URL}/packet-trace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).then(res => handleResponse<PacketTraceResult>(res)),

  // Traffic & QoS
  simulateTraffic: (config: any) => fetch(`${BASE_URL}/traffic/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).then(res => handleResponse<any>(res)),

  // Services
  simulateDhcp: (macAddress?: string, vlanId?: number) => fetch(`${BASE_URL}/services/dhcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ macAddress, vlanId }),
  }).then(res => handleResponse<ServiceResult>(res)),
  simulateDns: (domain?: string, clientIp?: string) => fetch(`${BASE_URL}/services/dns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, clientIp }),
  }).then(res => handleResponse<ServiceResult>(res)),
  simulateHttp: (path?: string, clientIp?: string) => fetch(`${BASE_URL}/services/http`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, clientIp }),
  }).then(res => handleResponse<ServiceResult>(res)),
  simulateFtp: (filename?: string, clientIp?: string) => fetch(`${BASE_URL}/services/ftp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, clientIp }),
  }).then(res => handleResponse<ServiceResult>(res)),
  simulateNat: (params: { privateIp?: string; privatePort?: number; destIp?: string; destPort?: number }) => fetch(`${BASE_URL}/services/nat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).then(res => handleResponse<ServiceResult>(res)),
  getNatTable: () => fetch(`${BASE_URL}/services/nat-table`).then(res => handleResponse<NatEntry[]>(res)),

  // Protocol Simulation Lab
  simulateHamming: (dataBits: string, errorBitIndex: number) => fetch(`${BASE_URL}/protocols/hamming`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataBits, errorBitIndex }),
  }).then(res => handleResponse<any>(res)),
  simulateCrc: (dataBits: string, generator: string, corruptBitIndex?: number) => fetch(`${BASE_URL}/protocols/crc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataBits, generator, corruptBitIndex }),
  }).then(res => handleResponse<any>(res)),
  simulateChecksum: (hexWords: string[], injectCorruption: boolean) => fetch(`${BASE_URL}/protocols/checksum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hexWords, injectCorruption }),
  }).then(res => handleResponse<any>(res)),
  simulateArq: (protocol: 'Go-Back-N' | 'Selective Repeat', frameCount: number, windowSize: number, dropFrameId?: number) => fetch(`${BASE_URL}/protocols/arq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ protocol, frameCount, windowSize, dropFrameId }),
  }).then(res => handleResponse<any>(res)),
  getAlohaCurves: () => fetch(`${BASE_URL}/protocols/aloha-curves`).then(res => handleResponse<any[]>(res)),

  // Experiments
  getExperiments: () => fetch(`${BASE_URL}/experiments`).then(res => handleResponse<ExperimentRecord[]>(res)),
  getExperiment: (id: number) => fetch(`${BASE_URL}/experiments/${id}`).then(res => handleResponse<ExperimentRecord>(res)),
};
