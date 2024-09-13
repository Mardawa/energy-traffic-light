import { Component, createSignal, createEffect } from 'solid-js';
import { css } from '@emotion/css';
import { colors } from './styles/colors';
import { typography } from './styles/typography';
import { spacing } from './styles/common';

export const BillEstimator: Component = () => {
  const [estimatedBill, setEstimatedBill] = createSignal(0);
  const [currentUsage, setCurrentUsage] = createSignal(0);
  const [currentPrice, setCurrentPrice] = createSignal(0);

  // Mock function to fetch current usage and price
  const fetchCurrentData = async () => {
    // In a real application, this would be an API call
    return {
      usage: Math.random() * 500 + 100, // Random usage between 100-600 kWh
      price: Math.random() * 0.1 + 0.1, // Random price between $0.10-$0.20 per kWh
    };
  };

  createEffect(async () => {
    const data = await fetchCurrentData();
    setCurrentUsage(data.usage);
    setCurrentPrice(data.price);
    setEstimatedBill(data.usage * data.price);
  });

  const styles = {
    container: css`
      background-color: ${colors.surface};
      border-radius: 8px;
      padding: ${spacing.md};
      box-shadow: 0 4px 6px ${colors.shadow};
    `,
    title: css`
      font-size: ${typography.fontSize.xl};
      font-weight: ${typography.fontWeight.bold};
      color: ${colors.text};
      margin-bottom: ${spacing.md};
    `,
    infoContainer: css`
      display: flex;
      justify-content: space-between;
      margin-bottom: ${spacing.md};
    `,
    infoItem: css`
      text-align: center;
    `,
    label: css`
      font-size: ${typography.fontSize.sm};
      color: ${colors.textLight};
    `,
    value: css`
      font-size: ${typography.fontSize.lg};
      font-weight: ${typography.fontWeight.bold};
      color: ${colors.text};
    `,
    estimatedBill: css`
      font-size: ${typography.fontSize['2xl']};
      font-weight: ${typography.fontWeight.bold};
      color: ${colors.primary};
      text-align: center;
    `,
  };

  return (
    <div class={styles.container}>
      <h2 class={styles.title}>Bill Estimator</h2>
      <div class={styles.infoContainer}>
        <div class={styles.infoItem}>
          <div class={styles.label}>Current Usage</div>
          <div class={styles.value}>{currentUsage().toFixed(2)} kWh</div>
        </div>
        <div class={styles.infoItem}>
          <div class={styles.label}>Current Price</div>
          <div class={styles.value}>${currentPrice().toFixed(2)}/kWh</div>
        </div>
      </div>
      <div class={styles.estimatedBill}>
        Estimated Bill: ${estimatedBill().toFixed(2)}
      </div>
    </div>
  );
};