import { Component } from 'solid-js';
import { css } from '@emotion/css';
import { colors } from './styles/colors';
import { typography } from './styles/typography';
import { simulationStore } from './store/simulationStore';

export const Clock: Component = () => {
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString(),
      date: date.toLocaleDateString(),
    };
  };

  const styles = {
    clockContainer: css`
      display: flex;
      align-items: center;
      background-color: ${colors.surface};
      padding: 0.5rem 1rem;
      border-radius: 20px;
      box-shadow: 0 2px 4px ${colors.shadow};
    `,
    icon: css`
      color: ${colors.primary};
      margin-right: 0.5rem;
    `,
    dateTimeWrapper: css`
      display: flex;
      flex-direction: column;
    `,
    time: css`
      font-size: ${typography.fontSize.lg};
      color: ${colors.text};
      font-weight: ${typography.fontWeight.medium};
    `,
    date: css`
      font-size: ${typography.fontSize.sm};
      color: ${colors.textLight};
    `,
  };

  return (
    <div class={styles.clockContainer}>
      <i class="fas fa-clock" style={styles.icon}></i>
      <div class={styles.dateTimeWrapper}>
        <span class={styles.time}>{formatDateTime(simulationStore.state.currentTime).time}</span>
        <span class={styles.date}>{formatDateTime(simulationStore.state.currentTime).date}</span>
      </div>
    </div>
  );
};