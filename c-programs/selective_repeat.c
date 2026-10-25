/*
 * Academic Experiment: Selective Repeat Sliding Window ARQ Protocol
 * Smart Campus Network - Computer Networks Lab
 */

#include <stdio.h>
#include <stdbool.h>

#define TOTAL_FRAMES 8
#define WINDOW_SIZE 4

int main() {
    bool acked[TOTAL_FRAMES] = { false };
    bool buffered[TOTAL_FRAMES] = { false };
    int base = 0;
    int next_seq = 0;
    int drop_frame = 2;
    int dropped_once = 0;
    int total_transmissions = 0;

    printf("============================================================\n");
    printf("  SELECTIVE REPEAT SLIDING WINDOW PROTOCOL SIMULATION\n");
    printf("  Total Frames: %d, Window Size: %d, Loss Injected: Frame %d\n", TOTAL_FRAMES, WINDOW_SIZE, drop_frame);
    printf("============================================================\n");

    while (base < TOTAL_FRAMES) {
        // Transmit frames within window
        while (next_seq < base + WINDOW_SIZE && next_seq < TOTAL_FRAMES) {
            total_transmissions++;
            if (next_seq == drop_frame && !dropped_once) {
                printf("[TIME] Sender transmits Frame [%d] --> [LOST IN CHANNEL]\n", next_seq);
                dropped_once = 1;
            } else {
                printf("[TIME] Sender transmits Frame [%d] --> [RECEIVED & BUFFERED]\n", next_seq);
                buffered[next_seq] = true;
                acked[next_seq] = true;
                printf("[ACK] Receiver sent Selective ACK for Frame [%d].\n", next_seq);
            }
            next_seq++;
        }

        // If base frame was dropped, selective retransmission occurs
        if (!buffered[base]) {
            printf("\n[TIMEOUT] Timer expired for missing Frame [%d]!\n", base);
            printf("--> SELECTIVE RETRANSMISSION: Resending ONLY missing Frame [%d]. Buffered frames [%d..%d] retained!\n\n",
                   base, base + 1, next_seq - 1);
            total_transmissions++;
            buffered[base] = true;
            acked[base] = true;
            printf("[ACK] Receiver sent Selective ACK for retransmitted Frame [%d].\n", base);
        }

        // Slide window past all acknowledged frames
        while (base < TOTAL_FRAMES && acked[base]) {
            printf("--> Frame [%d] delivered to upper layer. Base advances to %d.\n", base, base + 1);
            base++;
        }
    }

    printf("\nAll %d frames successfully delivered.\n", TOTAL_FRAMES);
    printf("Total transmissions: %d (Overhead: %d retransmitted frames)\n",
           total_transmissions, total_transmissions - TOTAL_FRAMES);
    printf("Notice: Selective Repeat required significantly fewer retransmissions than Go-Back-N!\n");
    printf("============================================================\n");
    return 0;
}
