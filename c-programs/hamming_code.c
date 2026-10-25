/*
 * Academic Experiment: Hamming Code (7,4) Single-Bit Error Detection & Correction
 * Smart Campus Network - Computer Networks Lab
 *
 * Description:
 * Generates a (7,4) systematic Hamming codeword for a 4-bit data word,
 * simulates single-bit error injection, computes the syndrome vector,
 * and automatically corrects the corrupted bit.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void calculate_hamming_7_4(int d1, int d2, int d3, int d4, int *codeword) {
    // Parity bit calculation (Even Parity):
    // P1 covers bit positions 1, 3, 5, 7 -> P1, D1, D2, D4
    // P2 covers bit positions 2, 3, 6, 7 -> P2, D1, D3, D4
    // P4 covers bit positions 4, 5, 6, 7 -> P4, D2, D3, D4
    int p1 = d1 ^ d2 ^ d4;
    int p2 = d1 ^ d3 ^ d4;
    int p4 = d2 ^ d3 ^ d4;

    // 1-indexed positions in codeword array (index 0 unused):
    codeword[1] = p1;
    codeword[2] = p2;
    codeword[3] = d1;
    codeword[4] = p4;
    codeword[5] = d2;
    codeword[6] = d3;
    codeword[7] = d4;
}

int detect_and_correct(int *rec) {
    // Syndrome bits:
    int s1 = rec[1] ^ rec[3] ^ rec[5] ^ rec[7];
    int s2 = rec[2] ^ rec[3] ^ rec[6] ^ rec[7];
    int s3 = rec[4] ^ rec[5] ^ rec[6] ^ rec[7];

    int syndrome = (s3 * 4) + (s2 * 2) + s1;
    return syndrome;
}

int main() {
    int data[4];
    int codeword[8];
    int received[8];
    int error_pos;

    printf("============================================================\n");
    printf("  HAMMING CODE (7,4) ENCODING & CORRECTION SIMULATION\n");
    printf("============================================================\n");

    printf("Enter 4 data bits (space separated, e.g. 1 0 1 1): ");
    if (scanf("%d %d %d %d", &data[0], &data[1], &data[2], &data[3]) != 4) {
        // Default sample if input not supplied
        data[0] = 1; data[1] = 0; data[2] = 1; data[3] = 1;
        printf("\nUsing default data: 1 0 1 1\n");
    }

    calculate_hamming_7_4(data[0], data[1], data[2], data[3], codeword);

    printf("\nTransmitted 7-bit Codeword [P1 P2 D1 P4 D2 D3 D4]:\n");
    for (int i = 1; i <= 7; i++) {
        printf("%d ", codeword[i]);
        received[i] = codeword[i];
    }
    printf("\n");

    printf("\nEnter bit position to corrupt (1-7, or 0 for no error): ");
    if (scanf("%d", &error_pos) != 1) {
        error_pos = 3; // Corrupt bit 3 as demo
        printf("\nDefaulting to injecting error at bit 3\n");
    }

    if (error_pos >= 1 && error_pos <= 7) {
        received[error_pos] ^= 1;
        printf("--> Injected error at bit position %d!\n", error_pos);
    } else {
        printf("--> No error injected. Transmitting pristine codeword.\n");
    }

    printf("\nReceived Codeword: ");
    for (int i = 1; i <= 7; i++) {
        printf("%d ", received[i]);
    }
    printf("\n");

    int syndrome = detect_and_correct(received);
    printf("\nSyndrome Calculation:\n");
    printf("  Syndrome decimal value: %d\n", syndrome);

    if (syndrome == 0) {
        printf("--> STATUS: Codeword is correct. No error detected.\n");
    } else {
        printf("--> STATUS: Single bit error detected at position %d!\n", syndrome);
        received[syndrome] ^= 1;
        printf("--> Corrected Codeword: ");
        for (int i = 1; i <= 7; i++) {
            printf("%d ", received[i]);
        }
        printf("\n--> Extracted Data: %d %d %d %d\n", received[3], received[5], received[6], received[7]);
    }
    printf("============================================================\n");
    return 0;
}
