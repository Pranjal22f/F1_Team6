/*
 * Academic Experiment: CSMA/CD with Binary Exponential Backoff (IEEE 802.3 Ethernet)
 * Smart Campus Network - Computer Networks Lab
 */

#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define MAX_ATTEMPTS 16
#define SLOT_TIME_US 51.2 // 512 bit times at 10 Mbps = 51.2 microseconds

void simulate_csma_cd() {
    int attempt = 1;
    int collision_resolved = 0;
    srand(42);

    printf("Station A initiates transmission onto shared Ethernet bus...\n");

    while (attempt <= MAX_ATTEMPTS) {
        printf("\n[Attempt %d] Transmitting frame while listening for collision (CSMA/CD)...\n", attempt);

        if (attempt < 3) {
            // Simulate collision on first 2 attempts
            printf("  --> COLLISION DETECTED within slot time (2 * Tau)!\n");
            printf("  --> Generating 32-bit JAM SIGNAL to enforce bus clearance.\n");

            // Binary Exponential Backoff: r in [0, 2^k - 1] where k = min(attempt, 10)
            int k = (attempt <= 10) ? attempt : 10;
            int max_slots = (1 << k) - 1;
            int chosen_slot = rand() % (max_slots + 1);
            double backoff_time = chosen_slot * SLOT_TIME_US;

            printf("  --> Binary Exponential Backoff: k=%d, Range=[0..%d], Selected Slot=%d\n",
                   k, max_slots, chosen_slot);
            printf("  --> Waiting backoff period: %.2f microseconds...\n", backoff_time);

            attempt++;
        } else {
            printf("  --> No collision detected! Frame fully transmitted onto wire.\n");
            printf("  --> Transmission SUCCESSFUL on Attempt %d.\n", attempt);
            collision_resolved = 1;
            break;
        }
    }

    if (!collision_resolved) {
        printf("\n[ABORT] Exceeded maximum 16 attempts. Network severely congested. Frame dropped.\n");
    }
}

int main() {
    printf("============================================================\n");
    printf("  CSMA/CD (COLLISION DETECTION & EXPONENTIAL BACKOFF)\n");
    printf("============================================================\n");

    simulate_csma_cd();

    printf("\nNote on Modern Campus Networks:\n");
    printf("Classic CSMA/CD was designed for legacy half-duplex shared coaxial/hub Ethernet.\n");
    printf("Modern campus networks use full-duplex switched Gigabit Ethernet with dedicated TX/RX pairs,\n");
    printf("eliminating collisions entirely at Layer 2.\n");
    printf("============================================================\n");
    return 0;
}
