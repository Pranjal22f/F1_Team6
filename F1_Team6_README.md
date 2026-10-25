# Design and Performance Analysis of a Secure, Fault-Tolerant Smart Campus Network

An interactive, software-based computer network simulation and monitoring platform demonstrating network architecture, dynamic routing (OSPF vs. RIP), redundant fault tolerance, first-match ACL firewall security, Quality of Service (QoS) congestion management, enterprise network services (DHCP, DNS, HTTP, FTP, NAT), and data link protocol labs.

Designed for Computer Networks academic projects, lab evaluations, and viva demonstrations. Operates completely without physical hardware or Cisco equipment.

---

## System Architecture

- **Backend**: Node.js, Express, TypeScript, SQLite persistence (`sql.js`), Vitest.
  - Adjacency list topology graph with dynamic link states.
  - Dijkstra shortest path (OSPF) & Bellman-Ford distance-vector (RIP).
  - First-match Access Control List (ACL) inspection engine.
  - Discrete time-stepped Strict Priority Queueing (QoS) traffic engine.
  - Multi-hop packet flow tracer with per-hop forwarding/firewall evaluation.
  - Educational models of DHCP (DORA), DNS, HTTP, FTP, and NAT/PAT.
  - Mathematical simulation engines for Hamming Code (7,4), CRC, Checksum, Go-Back-N, Selective Repeat, and ALOHA.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, `@xyflow/react`, Recharts, Lucide React (Dark NOC Theme).
  - 11 full-featured pages: Dashboard, Network Topology, VLAN & IP Manager, Routing Simulator, Fault Tolerance Lab, Security Center, Traffic & QoS, Network Services, Protocol Lab, Experiment Reports, Settings/Docs.
  - 5 guided one-click demonstration scenarios for viva voce defense.
- **C Source Programs (`c-programs/`)**: 9 standalone ANSI C (C99) programs implementing core syllabus algorithms.

---

## Beginner-Friendly Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested and supported)
- **npm**: v9.0.0 or higher
- Optional: `gcc` or `clang` (for compiling standalone C programs in `c-programs/`)

---

### 2. Installation Instructions

Open PowerShell or Command Prompt in the project root directory:

```bash
# 1. Install root dependencies (if any)
npm install

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Return to root
cd ..
```

---

### 3. Running Automated Tests

Run the backend Vitest test suite covering all networking engines:

```bash
cd backend
npm test
```
*Expected output: All 23 tests pass with 100% pass rate.*

---

### 4. Starting the Application

The application consists of two components: the Backend API server (port 5000) and the Frontend Vite development server (port 5173).

#### Step 1: Start the Backend Server (Terminal 1)
```bash
cd backend
npm start
```
*You will see:*
```
SMART CAMPUS NETWORK BACKEND ENGINE
API Server listening on http://localhost:5000
Health Check: http://localhost:5000/health
```

#### Step 2: Start the Frontend Interface (Terminal 2)
Open a new terminal window or tab in the project root:
```bash
cd frontend
npm run dev
```
*You will see:*
```
  VITE v6.4.4  ready in 400 ms

  ➜  Local:   http://localhost:5173/
```

#### Step 3: Access the Application
Open your web browser and navigate to:
**`http://localhost:5173`**

---

### 5. Stopping the Application

To stop the servers at any time:
- In Terminal 1 (Backend): Press **`Ctrl + C`** (and enter `Y` if prompted).
- In Terminal 2 (Frontend): Press **`Ctrl + C`** (and enter `Y` if prompted).

If you started servers in the background and need to stop processes by port:
- **Windows (PowerShell)**:
  ```powershell
  # Free port 5000 (Backend)
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
  # Free port 5173 (Frontend)
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
  ```
- **Linux / macOS**:
  ```bash
  kill -9 $(lsof -t -i:5000)
  kill -9 $(lsof -t -i:5173)
  ```

---

## Demonstration Scenarios for Viva & Presentation

Once the frontend is open at `http://localhost:5173`:
1. Click the **"Launch Guided Demos"** button in the top navigation bar or sidebar.
2. Select any of the 5 prepared scenarios to demonstrate live networking principles:
   - **Scenario 1**: Normal Web Request (Student PC $\rightarrow$ LMS Server across VLANs).
   - **Scenario 2**: Security ACL Enforcement (Student access to Admin Finance PC blocked).
   - **Scenario 3**: Dynamic Fault Recovery (R1-R2 link severed $\rightarrow$ OSPF failover to R3).
   - **Scenario 4**: Congestion & QoS (Strict Priority Queueing preserves VoIP with 0% loss).
   - **Scenario 5**: Data Link Error Correction (Hamming 7,4 single-bit error repair).

---

## Compiling Standalone C Programs

The `c-programs/` folder contains 9 standalone C programs:
- `hamming_code.c`
- `crc.c`
- `checksum.c`
- `go_back_n.c`
- `selective_repeat.c`
- `aloha.c`
- `slotted_aloha.c`
- `csma.c`
- `csma_cd.c`

To compile using GCC (MinGW / Linux / macOS):
```bash
cd c-programs
gcc -Wall -O2 hamming_code.c -o hamming_code
gcc -Wall -O2 crc.c -o crc
gcc -Wall -O2 checksum.c -o checksum
gcc -Wall -O2 go_back_n.c -o go_back_n
gcc -Wall -O2 selective_repeat.c -o selective_repeat
gcc -Wall -O2 aloha.c -lm -o aloha
gcc -Wall -O2 slotted_aloha.c -lm -o slotted_aloha
gcc -Wall -O2 csma.c -o csma
gcc -Wall -O2 csma_cd.c -o csma_cd
```

Run any compiled binary directly:
```bash
./hamming_code
```

---

## Detailed Progress Documentation
For the complete technical breakdown, test matrix, and verified outputs, refer to [`docs/progress.md`](./docs/progress.md).
