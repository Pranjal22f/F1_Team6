/*
 * Academic Experiment: Slotted ALOHA Throughput & Collision Analysis
 * Smart Campus Network - Computer Networks Lab
 */

#include <stdio.h>
#include <math.h>

int main() {
    printf("============================================================\n");
    printf("  SLOTTED ALOHA THROUGHPUT ANALYSIS (S = G * e^(-G))\n");
    printf("============================================================\n");
    printf("  Offered Load (G)  |  Throughput (S)  |  Efficiency (%%)\n");
    printf("------------------------------------------------------------\n");

    double g;
    double max_s = 0.0;
    double optimal_g = 0.0;

    for (g = 0.2; g <= 3.0; g += 0.2) {
        // Vulnerable time is T -> S = G * exp(-G)
        double s = g * exp(-g);
        double efficiency = s * 100.0;
        printf("       %4.2f         |      %6.4f      |      %5.2f%%\n", g, s, efficiency);

        if (s > max_s) {
            max_s = s;
            optimal_g = g;
        }
    }

    printf("------------------------------------------------------------\n");
    printf("Maximum Theoretical Throughput: S_max = 1 / e = %.4f (36.8%%) at G = 1.0\n", 1.0 / M_E);
    printf("Empirical Peak Observed: S = %.4f at G = %.2f\n", max_s, optimal_g);
    printf("Conclusion: Slotted ALOHA doubles channel capacity compared to Pure ALOHA.\n");
    printf("============================================================\n");
    return 0;
}
