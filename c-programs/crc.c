/*
 * Academic Experiment: Cyclic Redundancy Check (CRC) Polynomial Modulo-2 Division
 * Smart Campus Network - Computer Networks Lab
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

void xor_operation(char *remainder, const char *generator, int gen_len) {
    for (int i = 0; i < gen_len; i++) {
        remainder[i] = (remainder[i] == generator[i]) ? '0' : '1';
    }
}

void compute_crc(const char *data, const char *generator, char *remainder_out) {
    int data_len = strlen(data);
    int gen_len = strlen(generator);
    int total_len = data_len + gen_len - 1;

    char augmented[256];
    strcpy(augmented, data);
    for (int i = 0; i < gen_len - 1; i++) {
        augmented[data_len + i] = '0';
    }
    augmented[total_len] = '\0';

    char current[256];
    strncpy(current, augmented, gen_len);
    current[gen_len] = '\0';

    for (int i = 0; i < data_len; i++) {
        if (current[0] == '1') {
            xor_operation(current, generator, gen_len);
        }
        // Shift left and bring down next bit
        if (i < data_len - 1) {
            for (int j = 0; j < gen_len - 1; j++) {
                current[j] = current[j + 1];
            }
            current[gen_len - 1] = augmented[gen_len + i];
            current[gen_len] = '\0';
        }
    }

    // Remainder is last (gen_len - 1) characters
    strncpy(remainder_out, current + 1, gen_len - 1);
    remainder_out[gen_len - 1] = '\0';
}

int main() {
    char data[128] = "11010011101100";
    char generator[64] = "1011";
    char remainder[64];
    char codeword[256];

    printf("============================================================\n");
    printf("  CYCLIC REDUNDANCY CHECK (CRC) ERROR DETECTION\n");
    printf("============================================================\n");

    printf("Using Data: %s\n", data);
    printf("Using Generator Polynomial: %s\n", generator);

    compute_crc(data, generator, remainder);
    printf("\nComputed CRC Remainder: %s\n", remainder);

    strcpy(codeword, data);
    strcat(codeword, remainder);
    printf("Transmitted Codeword: %s\n", codeword);

    // Receiver Verification (Pristine)
    char check_rem[64];
    compute_crc(codeword, generator, check_rem);
    printf("\nReceiver Check (Pristine Codeword):\n");
    printf("  Syndrome Remainder: %s\n", check_rem);

    int err = 0;
    for (int i = 0; i < strlen(check_rem); i++) {
        if (check_rem[i] == '1') err = 1;
    }
    printf("  Status: %s\n", err ? "ERROR DETECTED!" : "NO ERROR DETECTED (Valid)");

    // Receiver Verification with Corrupted Bit
    codeword[3] = (codeword[3] == '1') ? '0' : '1';
    printf("\nInjecting Bit Flip at index 3 -> %s\n", codeword);
    compute_crc(codeword, generator, check_rem);
    printf("Receiver Check (Corrupted Codeword):\n");
    printf("  Syndrome Remainder: %s\n", check_rem);

    err = 0;
    for (int i = 0; i < strlen(check_rem); i++) {
        if (check_rem[i] == '1') err = 1;
    }
    printf("  Status: %s\n", err ? "ERROR DETECTED! Frame Discarded." : "NO ERROR DETECTED (Unexpected)");
    printf("============================================================\n");
    return 0;
}
