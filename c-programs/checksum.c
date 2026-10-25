/*
 * Academic Experiment: 16-bit Internet Checksum Algorithm (RFC 1071)
 * Smart Campus Network - Computer Networks Lab
 */

#include <stdio.h>
#include <stdint.h>

uint16_t calculate_checksum(const uint16_t *buf, int count) {
    uint32_t sum = 0;

    for (int i = 0; i < count; i++) {
        sum += buf[i];
        // Fold 32-bit carry bits
        if (sum > 0xFFFF) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
    }

    // Return 1's complement
    return (uint16_t)(~sum);
}

int verify_checksum(const uint16_t *buf, int count, uint16_t checksum) {
    uint32_t sum = 0;

    for (int i = 0; i < count; i++) {
        sum += buf[i];
        if (sum > 0xFFFF) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
    }

    sum += checksum;
    if (sum > 0xFFFF) {
        sum = (sum & 0xFFFF) + (sum >> 16);
    }

    // Valid if sum is all 1s (0xFFFF), so ~sum == 0
    return ((uint16_t)(~sum) == 0);
}

int main() {
    uint16_t packet_words[] = { 0x4500, 0x003C, 0x1C46, 0x4000, 0x4006 };
    int word_count = sizeof(packet_words) / sizeof(packet_words[0]);

    printf("============================================================\n");
    printf("  16-BIT INTERNET CHECKSUM SIMULATION (RFC 1071)\n");
    printf("============================================================\n");

    printf("Original 16-bit Packet Words:\n");
    for (int i = 0; i < word_count; i++) {
        printf("  Word[%d]: 0x%04X\n", i, packet_words[i]);
    }

    uint16_t checksum = calculate_checksum(packet_words, word_count);
    printf("\nComputed Internet Checksum: 0x%04X\n", checksum);

    // Verification of pristine transmission
    int valid = verify_checksum(packet_words, word_count, checksum);
    printf("Verification on Pristine Packet: %s\n", valid ? "VALID (0 Error)" : "INVALID");

    // Introduce corruption in Word[2]
    packet_words[2] ^= 0x0001;
    printf("\nInjecting 1-bit Corruption in Word[2] -> 0x%04X\n", packet_words[2]);
    valid = verify_checksum(packet_words, word_count, checksum);
    printf("Verification on Corrupted Packet: %s\n", valid ? "VALID (Undetected)" : "INVALID (Checksum Mismatch Detected!)");
    printf("============================================================\n");
    return 0;
}
