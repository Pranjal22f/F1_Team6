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

// Convert dotted-decimal IP to 32-bit unsigned integer
export function ipToNumber(ip: string): number {
  const parts = ip.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Convert 32-bit unsigned integer to dotted-decimal IP
export function numberToIp(num: number): string {
  const p1 = (num >>> 24) & 255;
  const p2 = (num >>> 16) & 255;
  const p3 = (num >>> 8) & 255;
  const p4 = num & 255;
  return `${p1}.${p2}.${p3}.${p4}`;
}

// Convert 32-bit integer to 8-bit dotted binary string
export function numberToBinary(num: number): string {
  const binaryStr = (num >>> 0).toString(2).padStart(32, '0');
  return `${binaryStr.slice(0, 8)}.${binaryStr.slice(8, 16)}.${binaryStr.slice(16, 24)}.${binaryStr.slice(24, 32)}`;
}

// Prefix length to 32-bit mask
export function prefixToMaskNum(prefix: number): number {
  if (prefix < 0 || prefix > 32) {
    throw new Error(`Invalid CIDR prefix length: /${prefix}. Must be between 0 and 32.`);
  }
  if (prefix === 0) return 0;
  return ((0xFFFFFFFF << (32 - prefix)) >>> 0);
}

// Determine IP Class
export function getIpClass(ipNum: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  const firstOctet = (ipNum >>> 24) & 255;
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D';
  return 'E';
}

// Check RFC 1918 Private IP Address
export function isPrivateIp(ipNum: number): boolean {
  const octet1 = (ipNum >>> 24) & 255;
  const octet2 = (ipNum >>> 16) & 255;
  // 10.0.0.0/8
  if (octet1 === 10) return true;
  // 172.16.0.0/12
  if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
  // 192.168.0.0/16
  if (octet1 === 192 && octet2 === 168) return true;
  return false;
}

// Comprehensive Subnet Calculator
export function calculateSubnet(ipStr: string, prefix: number): SubnetDetails {
  const ipClean = ipStr.split('/')[0].trim();
  const ipNum = ipToNumber(ipClean);
  const maskNum = prefixToMaskNum(prefix);
  const wildcardNum = (~maskNum) >>> 0;

  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  let totalHosts = 0;
  let usableHosts = 0;
  let firstHostNum = 0;
  let lastHostNum = 0;

  if (prefix === 32) {
    totalHosts = 1;
    usableHosts = 1;
    firstHostNum = networkNum;
    lastHostNum = networkNum;
  } else if (prefix === 31) {
    totalHosts = 2;
    usableHosts = 2; // RFC 3021 point-to-point links
    firstHostNum = networkNum;
    lastHostNum = broadcastNum;
  } else {
    totalHosts = Math.pow(2, 32 - prefix);
    usableHosts = Math.max(0, totalHosts - 2);
    firstHostNum = networkNum + 1;
    lastHostNum = broadcastNum - 1;
  }

  return {
    ipAddress: ipClean,
    prefixLength: prefix,
    subnetMask: numberToIp(maskNum),
    subnetMaskBinary: numberToBinary(maskNum),
    wildcardMask: numberToIp(wildcardNum),
    networkAddress: numberToIp(networkNum),
    broadcastAddress: numberToIp(broadcastNum),
    firstUsableHost: numberToIp(firstHostNum),
    lastUsableHost: numberToIp(lastHostNum),
    totalHosts,
    usableHosts,
    ipClass: getIpClass(ipNum),
    isPrivate: isPrivateIp(ipNum),
  };
}

// Check if IP is in a CIDR subnet
export function isIpInSubnet(ipStr: string, cidr: string): boolean {
  if (cidr.toUpperCase() === 'ANY') return true;
  const [subnetIp, prefixStr] = cidr.split('/');
  const prefix = prefixStr ? parseInt(prefixStr, 10) : 32;
  const ipNum = ipToNumber(ipStr);
  const netNum = ipToNumber(subnetIp);
  const mask = prefixToMaskNum(prefix);
  return (ipNum & mask) === (netNum & mask);
}

// Variable Length Subnet Masking (VLSM) Allocator
export function calculateVlsm(
  parentCidr: string,
  departments: { name: string; requiredHosts: number }[]
): VlsmAllocation[] {
  const [baseIp, parentPrefixStr] = parentCidr.split('/');
  const parentPrefix = parseInt(parentPrefixStr, 10);
  let currentBaseNum = ipToNumber(baseIp);

  // Sort descending by host requirements
  const sorted = [...departments].sort((a, b) => b.requiredHosts - a.requiredHosts);
  const results: VlsmAllocation[] = [];

  for (const dept of sorted) {
    // Hosts + 2 (network & broadcast)
    const needed = dept.requiredHosts + 2;
    let hostBits = Math.ceil(Math.log2(needed));
    if (hostBits < 2) hostBits = 2; // minimum /30
    const prefix = 32 - hostBits;
    const blockSize = Math.pow(2, hostBits);

    const maskNum = prefixToMaskNum(prefix);
    const networkNum = currentBaseNum;
    const broadcastNum = (networkNum + blockSize - 1) >>> 0;

    results.push({
      name: dept.name,
      requiredHosts: dept.requiredHosts,
      allocatedHosts: blockSize - 2,
      prefixLength: prefix,
      subnetMask: numberToIp(maskNum),
      networkAddress: numberToIp(networkNum),
      broadcastAddress: numberToIp(broadcastNum),
      usableHostRange: `${numberToIp(networkNum + 1)} - ${numberToIp(broadcastNum - 1)}`,
    });

    currentBaseNum = (broadcastNum + 1) >>> 0;
  }

  return results;
}

// IPv6 Subnet Formatter
export function formatIpv6Subnet(prefix: string, vlanId: number): string {
  // Example: 2001:db8:acad::/48 + VLAN 10 -> 2001:db8:acad:10::/64
  const cleanPrefix = prefix.split('::')[0].replace(/\/.*$/, '');
  const hexVlan = vlanId.toString(16);
  return `${cleanPrefix}:${hexVlan}::/64`;
}
