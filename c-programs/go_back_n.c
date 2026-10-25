/*
 * Academic Experiment: Go-Back-N Sliding Window ARQ Protocol
 * Smart Campus Network - Computer Networks Lab
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define TOTAL_FRAMES 8
#define WINDOW_SIZE 4

int main() {
    int base = 0;
    int next_seq = 0;
    int drop_frame = 2; // Simulate loss of frame 2
    int dropped_once = 0;
    int total_transmissions = 0;

    printf("============================================================\n");
    printf("  GO-BACK-N SLIDING WINDOW PROTOCOL SIMULATION\n");
    printf("  Total Frames: %d, Window Size: %d, Loss Injected: Frame %d\n", TOTAL_FRAMES, WINDOW_SIZE, drop_frame);
    printf("============================================================\n");

    while (base < TOTAL_FRAMES) {
        // Send frames within the window
        while (next_seq < base + WINDOW_SIZE && next_seq < TOTAL_FRAMES) {
            total_transmissions++;
            if (next_seq == drop_frame && !dropped_once) {
                printf("[TIME] Sender transmits Frame [%d] --> [LOST IN CHANNEL]\n", next_seq);
                dropped_once = 1;
            } else {
                printf("[TIME] Sender transmits Frame [%d] --> [DELIVERED]\n", next_seq);
            }
            next_seq++;
        }

        // If the base frame was dropped, timeout occurs and we Go-Back-N
        if (base == drop_frame && dropped_once == 1) {
            printf("\n[TIMEOUT] Timer expired for unacknowledged Frame [%d]!\n", base);
            printf("--> Go-Back-N Window Reset: Resending all %d frames in window from Frame [%d] to [%d]...\n\n",
                   next_seq - base, base, next_seq - 1);
            next_seq = base; // Reset sequence pointer
            drop_frame = -1; // Delivered on retransmission
        } else {
            printf("[ACK] Receiver sent cumulative ACK for Frame [%d]. Window slides forward.\n", base);
            base++;
        }
    }

    printf("\nAll %d frames successfully delivered.\n", TOTAL_FRAMES);
    printf("Total transmissions: %d (Overhead: %d retransmitted frames)\n",
           total_transmissions, total_transmissions - TOTAL_FRAMES);
    printf("============================================================\n");
    return 0;
}
