"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkServicesSimulator = void 0;
class NetworkServicesSimulator {
    dhcpLeases = new Map();
    dnsRecords = new Map();
    dnsCache = new Map();
    natTable = [];
    nextNatPort = 49152;
    constructor() {
        this.seedDefaultServices();
    }
    seedDefaultServices() {
        // DNS Seed Records
        const records = [
            { domain: 'portal.campus.edu', type: 'A', value: '10.70.0.12', ttlSeconds: 300 },
            { domain: 'lms.campus.edu', type: 'A', value: '10.70.0.12', ttlSeconds: 300 },
            { domain: 'dns.campus.edu', type: 'A', value: '10.70.0.11', ttlSeconds: 3600 },
            { domain: 'dhcp.campus.edu', type: 'A', value: '10.70.0.10', ttlSeconds: 3600 },
            { domain: 'ftp.campus.edu', type: 'A', value: '10.70.0.13', ttlSeconds: 300 },
            { domain: 'mail.campus.edu', type: 'A', value: '10.70.0.14', ttlSeconds: 600 },
            { domain: 'monitor.campus.edu', type: 'A', value: '10.70.0.15', ttlSeconds: 600 },
            { domain: 'google.com', type: 'A', value: '142.250.190.46', ttlSeconds: 300 },
        ];
        for (const r of records) {
            this.dnsRecords.set(r.domain.toLowerCase(), r);
        }
    }
    /**
     * DHCP DORA (Discover, Offer, Request, Acknowledge) simulation
     */
    simulateDhcp(macAddress, vlanId = 50) {
        const logs = [];
        const baseSubnet = `10.${vlanId}.0`;
        const gateway = `${baseSubnet}.1`;
        const dnsServer = '10.70.0.11';
        logs.push(`[T+0ms] DHCPDISCOVER: Client (${macAddress}) broadcasts discover packet on VLAN ${vlanId} (UDP 67/68)`);
        // Check pool allocation
        let allocatedIp = '';
        const poolStart = 50;
        const poolEnd = 250;
        for (let host = poolStart; host <= poolEnd; host++) {
            const candidateIp = `${baseSubnet}.${host}`;
            let inUse = false;
            for (const lease of this.dhcpLeases.values()) {
                if (lease.ipAddress === candidateIp && lease.status === 'active') {
                    inUse = true;
                    break;
                }
            }
            if (!inUse) {
                allocatedIp = candidateIp;
                break;
            }
        }
        if (!allocatedIp) {
            logs.push(`[T+12ms] DHCPOFFER: Server error! Address pool for VLAN ${vlanId} exhausted.`);
            return {
                service: 'DHCP',
                clientDeviceId: macAddress,
                requestDetails: { macAddress, vlanId },
                responseDetails: { error: 'Address pool exhausted' },
                protocolLogs: logs,
                success: false,
                roundTripTimeMs: 15,
            };
        }
        logs.push(`[T+8ms] DHCPOFFER: DHCP Server (10.70.0.10) offers IP ${allocatedIp}, Mask: 255.255.255.0, Gateway: ${gateway}`);
        logs.push(`[T+14ms] DHCPREQUEST: Client formally requests lease for ${allocatedIp}`);
        logs.push(`[T+18ms] DHCPACK: Server commits lease. Client assigned IP ${allocatedIp} for 86400 seconds (24h).`);
        const lease = {
            ipAddress: allocatedIp,
            macAddress,
            vlanId,
            leaseExpires: new Date(Date.now() + 86400000).toISOString(),
            status: 'active',
        };
        this.dhcpLeases.set(macAddress, lease);
        return {
            service: 'DHCP',
            clientDeviceId: macAddress,
            serverDeviceId: 'srv-dhcp',
            requestDetails: { macAddress, vlanId },
            responseDetails: {
                assignedIp: allocatedIp,
                subnetMask: '255.255.255.0',
                defaultGateway: gateway,
                dnsServer,
                leaseTimeSeconds: 86400,
            },
            protocolLogs: logs,
            success: true,
            roundTripTimeMs: 18,
        };
    }
    /**
     * DNS Resolution simulation
     */
    simulateDns(domain, clientIp) {
        const logs = [];
        const queryDomain = domain.trim().toLowerCase();
        logs.push(`[T+0ms] DNS Query: Client ${clientIp} querying A record for "${queryDomain}" over UDP 53`);
        // Check local cache
        const cached = this.dnsCache.get(queryDomain);
        if (cached && Date.now() - cached.cachedAt < cached.record.ttlSeconds * 1000) {
            logs.push(`[T+1ms] DNS Cache Hit: Resolved from local resolver cache -> ${cached.record.value} (TTL ${cached.record.ttlSeconds}s)`);
            return {
                service: 'DNS',
                clientDeviceId: clientIp,
                serverDeviceId: 'srv-dns',
                requestDetails: { domain: queryDomain, queryType: 'A' },
                responseDetails: { ipAddress: cached.record.value, cacheHit: true, ttl: cached.record.ttlSeconds },
                protocolLogs: logs,
                success: true,
                roundTripTimeMs: 1.5,
            };
        }
        // Authoritative lookup
        const record = this.dnsRecords.get(queryDomain);
        if (record) {
            logs.push(`[T+5ms] Authoritative Query: Campus DNS Server (10.70.0.11) responded with A record: ${record.value}`);
            this.dnsCache.set(queryDomain, { record, cachedAt: Date.now() });
            return {
                service: 'DNS',
                clientDeviceId: clientIp,
                serverDeviceId: 'srv-dns',
                requestDetails: { domain: queryDomain, queryType: 'A' },
                responseDetails: { ipAddress: record.value, cacheHit: false, ttl: record.ttlSeconds },
                protocolLogs: logs,
                success: true,
                roundTripTimeMs: 6.2,
            };
        }
        else {
            logs.push(`[T+12ms] DNS NXDOMAIN: Domain "${queryDomain}" does not exist in campus authoritative zone.`);
            return {
                service: 'DNS',
                clientDeviceId: clientIp,
                serverDeviceId: 'srv-dns',
                requestDetails: { domain: queryDomain, queryType: 'A' },
                responseDetails: { error: 'NXDOMAIN', resolved: false },
                protocolLogs: logs,
                success: false,
                roundTripTimeMs: 12.0,
            };
        }
    }
    /**
     * HTTP Web Request simulation
     */
    simulateHttp(urlPath, clientIp) {
        const logs = [];
        logs.push(`[T+0ms] TCP 3-Way Handshake: SYN -> SYN/ACK -> ACK between ${clientIp}:51234 and 10.70.0.12:80`);
        logs.push(`[T+8ms] HTTP GET ${urlPath} HTTP/1.1`);
        logs.push(`[T+8ms] Host: portal.campus.edu | User-Agent: Mozilla/5.0 CampusClient/2.4`);
        let statusCode = 200;
        let body = '';
        if (urlPath === '/' || urlPath === '/index.html' || urlPath === '/portal') {
            statusCode = 200;
            body = '<html><head><title>Smart Campus Portal</title></head><body><h1>Welcome to University Smart Campus</h1><p>Status: All systems operational</p></body></html>';
            logs.push(`[T+16ms] HTTP/1.1 200 OK | Content-Type: text/html | Content-Length: ${body.length}`);
        }
        else {
            statusCode = 404;
            body = '<html><body><h1>404 Not Found</h1><p>The requested campus resource does not exist.</p></body></html>';
            logs.push(`[T+14ms] HTTP/1.1 404 Not Found | Content-Type: text/html`);
        }
        return {
            service: 'HTTP',
            clientDeviceId: clientIp,
            serverDeviceId: 'srv-web',
            requestDetails: { method: 'GET', path: urlPath, host: 'portal.campus.edu' },
            responseDetails: { statusCode, headers: { 'Content-Type': 'text/html', Server: 'Apache/2.4 CampusLinux' }, body },
            protocolLogs: logs,
            success: statusCode === 200,
            roundTripTimeMs: 18.5,
        };
    }
    /**
     * FTP File Transfer simulation
     */
    simulateFtp(filename, clientIp) {
        const logs = [];
        logs.push(`[T+0ms] TCP Connected to 10.70.0.13:21 (Control Channel)`);
        logs.push(`[T+4ms] 220 Campus FTP Server ready.`);
        logs.push(`[T+8ms] USER student -> 331 Password required for student.`);
        logs.push(`[T+12ms] PASS ******** -> 230 User logged in, proceed.`);
        logs.push(`[T+18ms] TYPE I (Binary mode) -> 200 Type set to I.`);
        logs.push(`[T+24ms] PASV -> 227 Entering Passive Mode (10,70,0,13,195,80). Data port: 50000`);
        logs.push(`[T+32ms] RETR ${filename} -> 150 Opening BINARY mode data connection for ${filename} (2.4 MB)`);
        logs.push(`[T+48ms] 226 Transfer complete. 2,516,582 bytes transferred at 840 Mbps.`);
        return {
            service: 'FTP',
            clientDeviceId: clientIp,
            serverDeviceId: 'srv-ftp',
            requestDetails: { command: 'RETR', filename, mode: 'Passive Binary' },
            responseDetails: { code: 226, message: 'Transfer complete', fileSize: '2.4 MB', rate: '840 Mbps' },
            protocolLogs: logs,
            success: true,
            roundTripTimeMs: 48.0,
        };
    }
    /**
     * NAT / PAT Address Translation
     */
    simulateNat(privateIp, privatePort, destIp, destPort) {
        const publicIp = '203.0.113.2'; // Edge Router R1 WAN IP
        const publicPort = this.nextNatPort++;
        if (this.nextNatPort > 65000)
            this.nextNatPort = 49152;
        const natEntry = {
            id: `nat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            privateIp,
            privatePort,
            publicIp,
            publicPort,
            protocol: 'TCP',
            destIp,
            destPort,
            createdAt: new Date().toISOString(),
        };
        this.natTable.unshift(natEntry);
        if (this.natTable.length > 50)
            this.natTable.pop();
        const logs = [
            `[T+0ms] Outbound packet from Private Host: ${privateIp}:${privatePort} -> ${destIp}:${destPort}`,
            `[T+2ms] Edge Router R1 NAT Table Lookup: No existing translation. Allocating PAT overload mapping.`,
            `[T+3ms] PAT Allocated: Mapped ${privateIp}:${privatePort} ==> ${publicIp}:${publicPort}`,
            `[T+5ms] Packet forwarded to WAN ISP Gateway with Source IP rewritten to ${publicIp}:${publicPort}`,
            `[T+25ms] Inbound return packet received on WAN: ${destIp}:${destPort} -> ${publicIp}:${publicPort}`,
            `[T+26ms] NAT Engine reverse translation: Rewritten destination to private host ${privateIp}:${privatePort}`,
        ];
        return {
            service: 'NAT',
            clientDeviceId: privateIp,
            serverDeviceId: 'router-r1',
            requestDetails: { privateIp, privatePort, destIp, destPort },
            responseDetails: { translation: natEntry, publicSocket: `${publicIp}:${publicPort}` },
            protocolLogs: logs,
            success: true,
            roundTripTimeMs: 26.0,
        };
    }
    getNatTable() {
        return this.natTable;
    }
}
exports.NetworkServicesSimulator = NetworkServicesSimulator;
