/*
 * Academic Experiment: Carrier Sense Multiple Access (CSMA)
 * Smart Campus Network - Computer Networks Lab
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef enum {
    PERSISTENT_1,
    NON_PERSISTENT
} CsmaMode;

void simulate_csma(CsmaMode mode, const char *name) {
    printf("\n--- Running %s Simulation ---\n", name);
    int stations = 5;
    bool channel_busy = true;

    for (int i = 1; i <= stations; i++) {
        printf("Station %d has a packet ready to transmit.\n", i);
        printf("  [SENSE] Sensing channel state...\n");

        if (channel_busy) {
            printf("  [BUSY] Channel is busy!\n");
            if (mode == PERSISTENT_1) {
                printf("  [1-PERSISTENT] Continuously monitoring channel until idle...\n");
                printf("  [IDLE DETECTED] Channel became idle -> Station %d transmits immediately with p=1!\n", i);
            } else {
                int backoff = 10 + (rand() % 40);
                printf("  [NON-PERSISTENT] Backing off for %d ms before re-sensing...\n", backoff);
            }
        } else {
            printf("  [IDLE] Channel is idle -> Transmitting immediately!\n");
        }
        channel_busy = !channel_busy; // Toggle state for simulation
    }
}

int main() {
    printf("============================================================\n");
    printf("  CARRIER SENSE MULTIPLE ACCESS (CSMA) SIMULATION\n");
    printf("============================================================\n");

    simulate_csma(PERSISTENT_1, "1-Persistent CSMA");
    simulate_csma(NON_PERSISTENT, "Non-Persistent CSMA");

    printf("\nComparison:\n");
    printf("1-Persistent achieves lower idle latency, but has higher collision risk under heavy load.\n");
    printf("Non-Persistent reduces collision risk by randomizing retries, but increases channel idle time.\n");
    printf("============================================================\n");
    return 0;
}
