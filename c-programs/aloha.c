/*
 * Academic Experiment: Pure ALOHA Throughput & Collision Analysis
 * Smart Campus Network - Computer Networks Lab
 */

#include <stdio.h>
#include <math.h>

int main() {
    printf("============================================================\n");
    printf("  PURE ALOHA THROUGHPUT ANALYSIS (S = G * e^(-2G))\n");
    printf("============================================================\n");
    printf("  Offered Load (G)  |  Throughput (S)  |  Efficiency (%%)\n");
    printf("------------------------------------------------------------\n");

    double g;
    double max_s = 0.0;
    double optimal_g = 0.0;

    for (g = 0.1; g <= 2.5; g += 0.2) {
        // Vulnerable time is 2T -> S = G * exp(-2G)
        double s = g * exp(-2.0 * g);
        double efficiency = s * 100.0;
        printf("       %4.2f         |      %6.4f      |      %5.2f%%\n", g, s, efficiency);

        if (s > max_s) {
            max_s = s;
            optimal_g = g;
        }
    }

    printf("------------------------------------------------------------\n");
    printf("Maximum Theoretical Throughput: S_max = 1 / (2e) = %.4f (18.4%%) at G = 0.5\n", 1.0 / (2.0 * M_E));
    printf("Empirical Peak Observed: S = %.4f at G = %.2f\n", max_s, optimal_g);
    printf("============================================================\n");
    return 0;
}
