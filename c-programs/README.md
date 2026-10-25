# Standalone C Networking Programs

This directory contains standalone, ANSI C (C99/C11 standard) implementations of the core data communication and networking algorithms taught in the Computer Networks syllabus.

## Programs Included

| File | Protocol / Algorithm | Syllabus Topic |
|---|---|---|
| `hamming_code.c` | (7,4) Systematic Hamming Code | Error Detection & Single-Bit Correction |
| `crc.c` | Cyclic Redundancy Check (CRC) | Polynomial Modulo-2 Division |
| `checksum.c` | 16-bit Internet Checksum (RFC 1071) | One's Complement Addition with Carry Folding |
| `go_back_n.c` | Go-Back-N ARQ Protocol | Sliding Window & Cumulative Retransmission |
| `selective_repeat.c` | Selective Repeat ARQ Protocol | Out-of-Order Buffering & Selective Retransmit |
| `aloha.c` | Pure ALOHA Medium Access | Vulnerable Time $2T$, Throughput $S = G e^{-2G}$ |
| `slotted_aloha.c` | Slotted ALOHA Medium Access | Vulnerable Time $T$, Throughput $S = G e^{-G}$ |
| `csma.c` | Carrier Sense Multiple Access | 1-Persistent & Non-Persistent Carrier Sensing |
| `csma_cd.c` | CSMA/CD with Exponential Backoff | Collision Detection, Jam Signal, Binary Backoff |

---

## Compilation Instructions

### Linux / macOS / Windows (MinGW / GCC)
Compile any program using standard GCC flags:
```bash
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
*(Note: `-lm` links the math library for `exp()` in ALOHA simulations)*

### Clang
```bash
clang -Wall -O2 hamming_code.c -o hamming_code
```

### Microsoft Visual C++ (MSVC)
From the Developer Command Prompt:
```cmd
cl /O2 hamming_code.c
cl /O2 crc.c
cl /O2 checksum.c
cl /O2 go_back_n.c
cl /O2 selective_repeat.c
cl /O2 aloha.c
cl /O2 slotted_aloha.c
cl /O2 csma.c
cl /O2 csma_cd.c
```

---

## Running the Programs

Execute the compiled binaries directly:
```bash
./hamming_code
./crc
./checksum
./go_back_n
./selective_repeat
./aloha
./slotted_aloha
./csma
./csma_cd
```

All programs include interactive prompts and fallback defaults for automated grading scripts.
