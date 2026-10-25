import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../database/db.js';
import { seedDemoData } from '../database/seed.js';
import { Device, NetworkLink, VLAN, ACLRule, ExperimentRecord } from '../types/index.js';
import { calculateSubnet, calculateVlsm, formatIpv6Subnet } from '../simulator/addressing.js';
import { RoutingEngine } from '../simulator/routing.js';
import { FaultToleranceLab } from '../simulator/fault_tolerance.js';
import { ACLEngine } from '../simulator/acl.js';
import { QoSEngine } from '../simulator/qos.js';
import { NetworkServicesSimulator } from '../simulator/services.js';
import { ProtocolSimulationEngine } from '../simulator/protocols.js';
import { PacketTracer } from '../simulator/packet_tracer.js';

const router = Router();
const servicesSim = new NetworkServicesSimulator();
const protocolSim = new ProtocolSimulationEngine();
const qosEngine = new QoSEngine();

// Helper to fetch live entities from DB
function getLiveState() {
  const deviceRows = queryAll('SELECT * FROM devices');
  const devices: Device[] = deviceRows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    department: r.department || undefined,
    role: r.role,
    ipAddress: r.ip_address || undefined,
    macAddress: r.mac_address || undefined,
    vlanId: r.vlan_id || undefined,
    status: r.status,
    interfaces: JSON.parse(r.interfaces_json),
    position: { x: r.position_x, y: r.position_y },
    notes: r.notes || undefined,
  }));

  const linkRows = queryAll('SELECT * FROM links');
  const links: NetworkLink[] = linkRows.map(r => ({
    id: r.id,
    sourceDeviceId: r.source_device_id,
    sourceInterfaceId: r.source_interface_id || undefined,
    targetDeviceId: r.target_device_id,
    targetInterfaceId: r.target_interface_id || undefined,
    bandwidthMbps: r.bandwidth_mbps,
    latencyMs: r.latency_ms,
    status: r.status,
    packetLossRate: r.packet_loss_rate,
    cost: r.cost || undefined,
    isRedundant: r.is_redundant === 1,
  }));

  const vlanRows = queryAll('SELECT * FROM vlans ORDER BY id ASC');
  const vlans: VLAN[] = vlanRows.map(r => ({
    id: r.id,
    name: r.name,
    department: r.department,
    ipv4Subnet: r.ipv4_subnet,
    ipv4Gateway: r.ipv4_gateway,
    ipv6Subnet: r.ipv6_subnet,
    ipv6Gateway: r.ipv6_gateway,
    description: r.description,
    color: r.color,
  }));

  const aclRows = queryAll('SELECT * FROM acl_rules ORDER BY priority ASC');
  const aclRules: ACLRule[] = aclRows.map(r => ({
    id: r.id,
    priority: r.priority,
    description: r.description,
    sourceSubnet: r.source_subnet,
    destSubnet: r.dest_subnet,
    protocol: r.protocol,
    sourcePort: r.source_port || undefined,
    destPort: r.dest_port || undefined,
    action: r.action,
    enabled: r.enabled === 1,
    hitCount: r.hit_count,
  }));

  return { devices, links, vlans, aclRules };
}

// ==================== DASHBOARD STATS ====================
router.get('/stats/dashboard', (req: Request, res: Response) => {
  const { devices, links, vlans, aclRules } = getLiveState();

  const activeDevices = devices.filter(d => d.status === 'online').length;
  const failedDevices = devices.filter(d => d.status !== 'online').length;
  const activeLinks = links.filter(l => l.status === 'active').length;
  const failedLinks = links.filter(l => l.status === 'failed').length;
  const servers = devices.filter(d => d.type === 'server');
  const activeServers = servers.filter(s => s.status === 'online').length;

  const totalPossible = devices.length + links.length;
  const totalActive = activeDevices + activeLinks;
  const availabilityPercentage = totalPossible > 0 ? Number(((totalActive / totalPossible) * 100).toFixed(1)) : 100;

  // Derive metrics from current network graph state
  const totalBandwidth = links.filter(l => l.status === 'active').reduce((acc, l) => acc + l.bandwidthMbps, 0);
  const avgLatency = links.length > 0 ? Number((links.reduce((acc, l) => acc + l.latencyMs, 0) / links.length).toFixed(2)) : 0;
  const avgLoss = links.length > 0 ? Number(((links.reduce((acc, l) => acc + l.packetLossRate, 0) / links.length) * 100).toFixed(2)) : 0;

  // Security alert count (denied packet hits)
  const deniedHits = aclRules.filter(r => r.action === 'DENY').reduce((acc, r) => acc + r.hitCount, 0);

  res.json({
    totalDevices: devices.length,
    activeDevices,
    failedDevices,
    totalLinks: links.length,
    activeLinks,
    failedLinks,
    totalVlans: vlans.length,
    totalServers: servers.length,
    activeServers,
    availabilityPercentage,
    simulatedThroughputMbps: Math.round(totalBandwidth * 0.42), // realistic campus utilization
    averageDelayMs: avgLatency,
    packetLossPercentage: avgLoss,
    securityAlertsCount: deniedHits,
    recentEvents: [
      { id: '1', time: 'Just now', type: 'ROUTING', msg: 'OSPF Link-State database synchronized across R1, R2, R3' },
      { id: '2', time: '2m ago', type: 'SECURITY', msg: 'VLAN 80 IoT access attempt blocked to Admin Core' },
      { id: '3', time: '5m ago', type: 'QOS', msg: 'Strict Priority Queue engaged for Campus VoIP traffic' },
      { id: '4', time: '12m ago', type: 'SYSTEM', msg: 'All 9 VLAN trunks operational across Core & Academic switches' },
    ],
  });
});

// ==================== TOPOLOGY APIS ====================
router.get('/topology', (req: Request, res: Response) => {
  const state = getLiveState();
  res.json(state);
});

router.post('/topology/device', (req: Request, res: Response) => {
  const dev: Device = req.body;
  if (!dev.id || !dev.name || !dev.type) {
    return res.status(400).json({ error: 'Device id, name, and type are required' });
  }

  execute(
    `INSERT OR REPLACE INTO devices (id, name, type, department, role, ip_address, mac_address, vlan_id, status, interfaces_json, position_x, position_y, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dev.id,
      dev.name,
      dev.type,
      dev.department || null,
      dev.role || 'Host',
      dev.ipAddress || null,
      dev.macAddress || null,
      dev.vlanId || null,
      dev.status || 'online',
      JSON.stringify(dev.interfaces || []),
      dev.position?.x ?? 100,
      dev.position?.y ?? 100,
      dev.notes || null,
    ]
  );
  res.json({ success: true, device: dev });
});

router.delete('/topology/device/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  execute('DELETE FROM devices WHERE id = ?', [id]);
  execute('DELETE FROM links WHERE source_device_id = ? OR target_device_id = ?', [id, id]);
  res.json({ success: true, deletedDeviceId: id });
});

router.post('/topology/link', (req: Request, res: Response) => {
  const link: NetworkLink = req.body;
  if (!link.id || !link.sourceDeviceId || !link.targetDeviceId) {
    return res.status(400).json({ error: 'Link id, sourceDeviceId, and targetDeviceId are required' });
  }

  execute(
    `INSERT OR REPLACE INTO links (id, source_device_id, source_interface_id, target_device_id, target_interface_id, bandwidth_mbps, latency_ms, status, packet_loss_rate, cost, is_redundant)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      link.id,
      link.sourceDeviceId,
      link.sourceInterfaceId || null,
      link.targetDeviceId,
      link.targetInterfaceId || null,
      link.bandwidthMbps || 1000,
      link.latencyMs || 1,
      link.status || 'active',
      link.packetLossRate || 0.0,
      link.cost || null,
      link.isRedundant ? 1 : 0,
    ]
  );
  res.json({ success: true, link });
});

router.delete('/topology/link/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  execute('DELETE FROM links WHERE id = ?', [id]);
  res.json({ success: true, deletedLinkId: id });
});

router.post('/topology/reset', (req: Request, res: Response) => {
  seedDemoData();
  res.json({ success: true, message: 'Campus network reset to default demo configuration' });
});

// ==================== VLAN & ADDRESSING APIS ====================
router.get('/vlans', (req: Request, res: Response) => {
  const { vlans } = getLiveState();
  res.json(vlans);
});

router.post('/addressing/calculate', (req: Request, res: Response) => {
  const { ip, prefix } = req.body;
  if (!ip || prefix === undefined) {
    return res.status(400).json({ error: 'IP address and prefix are required' });
  }
  try {
    const details = calculateSubnet(ip, parseInt(prefix, 10));
    res.json(details);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/addressing/vlsm', (req: Request, res: Response) => {
  const { parentCidr, departments } = req.body;
  if (!parentCidr || !Array.isArray(departments)) {
    return res.status(400).json({ error: 'parentCidr and departments array are required' });
  }
  try {
    const allocation = calculateVlsm(parentCidr, departments);
    res.json(allocation);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== ROUTING APIS ====================
router.get('/routing/tables', (req: Request, res: Response) => {
  const protocol = (req.query.protocol as string)?.toUpperCase() || 'OSPF';
  const { devices, links } = getLiveState();
  const routingEngine = new RoutingEngine(devices, links);

  const routers = devices.filter(d => d.type === 'router' || d.type === 'core_switch');
  const tables = routers.map(r => routingEngine.generateRoutingTable(r.id, protocol as any));
  res.json(tables);
});

router.post('/routing/path', (req: Request, res: Response) => {
  const { sourceId, destId, protocol } = req.body;
  if (!sourceId || !destId) {
    return res.status(400).json({ error: 'sourceId and destId are required' });
  }
  const { devices, links } = getLiveState();
  const routingEngine = new RoutingEngine(devices, links);
  const result = routingEngine.findPath(sourceId, destId, (protocol || 'OSPF').toUpperCase());
  res.json(result);
});

// ==================== FAULT TOLERANCE LAB ====================
router.post('/fault/simulate', (req: Request, res: Response) => {
  const { sourceId, destId, linkIdToFail, protocol } = req.body;
  if (!sourceId || !destId || !linkIdToFail) {
    return res.status(400).json({ error: 'sourceId, destId, and linkIdToFail are required' });
  }
  const { devices, links } = getLiveState();
  const lab = new FaultToleranceLab(devices, links);
  try {
    const result = lab.runFailureExperiment(devices, links, sourceId, destId, linkIdToFail, (protocol || 'OSPF').toUpperCase());
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== SECURITY & ACL APIS ====================
router.get('/security/rules', (req: Request, res: Response) => {
  const { aclRules } = getLiveState();
  res.json(aclRules);
});

router.post('/security/rules', (req: Request, res: Response) => {
  const rule: ACLRule = req.body;
  if (!rule.id || !rule.description || rule.priority === undefined) {
    return res.status(400).json({ error: 'Rule id, priority, and description are required' });
  }

  execute(
    `INSERT OR REPLACE INTO acl_rules (id, priority, description, source_subnet, dest_subnet, protocol, source_port, dest_port, action, enabled, hit_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rule.id,
      rule.priority,
      rule.description,
      rule.sourceSubnet || 'ANY',
      rule.destSubnet || 'ANY',
      rule.protocol || 'ANY',
      rule.sourcePort || null,
      rule.destPort || null,
      rule.action || 'DENY',
      rule.enabled !== false ? 1 : 0,
      rule.hitCount || 0,
    ]
  );
  res.json({ success: true, rule });
});

router.delete('/security/rules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  execute('DELETE FROM acl_rules WHERE id = ?', [id]);
  res.json({ success: true, deletedRuleId: id });
});

router.post('/security/inspect', (req: Request, res: Response) => {
  const { sourceIp, destIp, protocol, sourcePort, destPort } = req.body;
  if (!sourceIp || !destIp) {
    return res.status(400).json({ error: 'sourceIp and destIp are required' });
  }
  const { aclRules } = getLiveState();
  const aclEngine = new ACLEngine(aclRules);

  const result = aclEngine.evaluatePacket({
    sourceIp,
    destIp,
    protocol: (protocol || 'TCP').toUpperCase(),
    sourcePort: sourcePort ? parseInt(sourcePort, 10) : undefined,
    destPort: destPort ? parseInt(destPort, 10) : undefined,
  }, true);

  // Sync hit count back to DB
  if (result.matchedRule) {
    execute('UPDATE acl_rules SET hit_count = hit_count + 1 WHERE id = ?', [result.matchedRule.id]);
  }

  res.json(result);
});

// ==================== PACKET FLOW TRACER ====================
router.post('/packet-trace', (req: Request, res: Response) => {
  const { sourceDeviceId, destDeviceId, protocol, destPort, packetSizeBytes, routingProtocol } = req.body;
  if (!sourceDeviceId || !destDeviceId) {
    return res.status(400).json({ error: 'sourceDeviceId and destDeviceId are required' });
  }
  const { devices, links, aclRules } = getLiveState();
  const tracer = new PacketTracer(devices, links, aclRules);

  try {
    const result = tracer.tracePacket(devices, links, {
      sourceDeviceId,
      destDeviceId,
      protocol: (protocol || 'TCP').toUpperCase(),
      destPort: destPort ? parseInt(destPort, 10) : undefined,
      packetSizeBytes,
      routingProtocol: (routingProtocol || 'OSPF').toUpperCase(),
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== TRAFFIC & QOS APIS ====================
router.post('/traffic/simulate', (req: Request, res: Response) => {
  const config = req.body;
  const result = qosEngine.simulateTraffic(config, 100, 60);
  res.json(result);
});

// ==================== SERVICES SIMULATOR ====================
router.post('/services/dhcp', (req: Request, res: Response) => {
  const { macAddress, vlanId } = req.body;
  const result = servicesSim.simulateDhcp(macAddress || 'AA:BB:CC:99:88:77', vlanId || 50);
  res.json(result);
});

router.post('/services/dns', (req: Request, res: Response) => {
  const { domain, clientIp } = req.body;
  const result = servicesSim.simulateDns(domain || 'portal.campus.edu', clientIp || '10.50.0.105');
  res.json(result);
});

router.post('/services/http', (req: Request, res: Response) => {
  const { path, clientIp } = req.body;
  const result = servicesSim.simulateHttp(path || '/', clientIp || '10.50.0.105');
  res.json(result);
});

router.post('/services/ftp', (req: Request, res: Response) => {
  const { filename, clientIp } = req.body;
  const result = servicesSim.simulateFtp(filename || 'cs301_lecture_notes.pdf', clientIp || '10.10.0.50');
  res.json(result);
});

router.post('/services/nat', (req: Request, res: Response) => {
  const { privateIp, privatePort, destIp, destPort } = req.body;
  const result = servicesSim.simulateNat(
    privateIp || '10.50.0.105',
    privatePort || 52140,
    destIp || '142.250.190.46',
    destPort || 443
  );
  res.json(result);
});

router.get('/services/nat-table', (req: Request, res: Response) => {
  res.json(servicesSim.getNatTable());
});

// ==================== PROTOCOL SIMULATION LAB ====================
router.post('/protocols/hamming', (req: Request, res: Response) => {
  const { dataBits, errorBitIndex } = req.body;
  const result = protocolSim.runHamming74(dataBits || '1011', errorBitIndex || 0);
  res.json(result);
});

router.post('/protocols/crc', (req: Request, res: Response) => {
  const { dataBits, generator, corruptBitIndex } = req.body;
  const result = protocolSim.runCrc(dataBits || '11010011101100', generator || '1011', corruptBitIndex ?? -1);
  res.json(result);
});

router.post('/protocols/checksum', (req: Request, res: Response) => {
  const { hexWords, injectCorruption } = req.body;
  const result = protocolSim.runChecksum(hexWords || [], !!injectCorruption);
  res.json(result);
});

router.post('/protocols/arq', (req: Request, res: Response) => {
  const { protocol, frameCount, windowSize, dropFrameId } = req.body;
  const result = protocolSim.runArqSimulation(
    protocol || 'Go-Back-N',
    frameCount || 8,
    windowSize || 4,
    dropFrameId ?? 2
  );
  res.json(result);
});

router.get('/protocols/aloha-curves', (req: Request, res: Response) => {
  const curves = protocolSim.getAlohaThroughputCurves();
  res.json(curves);
});

// ==================== EXPERIMENT REPORTS ====================
router.get('/experiments', (req: Request, res: Response) => {
  const rows = queryAll('SELECT * FROM experiments ORDER BY id ASC');
  const experiments: ExperimentRecord[] = rows.map(r => ({
    id: r.id,
    title: r.title,
    aim: r.aim,
    theory: r.theory,
    requirements: JSON.parse(r.requirements_json),
    procedure: JSON.parse(r.procedure_json),
    configuration: JSON.parse(r.configuration_json),
    observations: JSON.parse(r.observations_json),
    results: JSON.parse(r.results_json),
    conclusion: r.conclusion,
    vivaQuestions: JSON.parse(r.viva_questions_json),
    status: r.status,
    lastRunTimestamp: r.last_run_timestamp || undefined,
  }));
  res.json(experiments);
});

router.get('/experiments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const r = queryOne('SELECT * FROM experiments WHERE id = ?', [id]);
  if (!r) return res.status(404).json({ error: 'Experiment not found' });
  res.json({
    id: r.id,
    title: r.title,
    aim: r.aim,
    theory: r.theory,
    requirements: JSON.parse(r.requirements_json),
    procedure: JSON.parse(r.procedure_json),
    configuration: JSON.parse(r.configuration_json),
    observations: JSON.parse(r.observations_json),
    results: JSON.parse(r.results_json),
    conclusion: r.conclusion,
    vivaQuestions: JSON.parse(r.viva_questions_json),
    status: r.status,
    lastRunTimestamp: r.last_run_timestamp,
  });
});

export default router;
