import { Component, createSignal, createEffect } from 'solid-js';
import { css } from '@emotion/css';
import { colors } from './styles/colors';
import { typography } from './styles/typography';
import { spacing } from './styles/common';
import { simulationStore } from './store/simulationStore';

export const TimeSimulator: Component<{ onTimeUpdate: (newTime: number) => void }> = (props) => {
  const [speed, setSpeed] = createSignal(1);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [manualSpeed, setManualSpeed] = createSignal(1);
  const [errorMessage, setErrorMessage] = createSignal('');

  let intervalId: number;

  const updateTime = () => {
    if (isPlaying()) {
      const newTime = simulationStore.state.currentTime + 1000 * speed();
      props.onTimeUpdate(newTime);
    }
  };

  const start = () => {
    intervalId = setInterval(updateTime, 1000);
  };

  const stop = () => {
    clearInterval(intervalId);
  };

  const setSimulationSpeed = (newSpeed: number) => {
    if (newSpeed >= 0.1 && newSpeed <= 24) {
      setSpeed(newSpeed);
      setManualSpeed(newSpeed);
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid speed. Please use a value between 0.1 and 24 hours/second.');
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying());
    if (!isPlaying()) {
      setSimulationSpeed(manualSpeed());
    }
  };

  const jumpToTime = (timestamp: number) => {
    const newDate = new Date(timestamp);
    if (isNaN(newDate.getTime())) {
      setErrorMessage('Invalid date. The simulation time was not changed.');
    } else {
      props.onTimeUpdate(timestamp);
      setErrorMessage('');
    }
  };

  const advanceTime = (minutes: number) => {
    const newTime = new Date(simulationStore.state.currentTime + minutes * 60 * 1000);
    props.onTimeUpdate(newTime.getTime());
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSimulationSpeed(newSpeed);
  };

  const handleDateChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const [datePart, timePart] = input.value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const newDate = new Date(year, month - 1, day, hours, minutes);
    if (!isNaN(newDate.getTime())) {
      jumpToTime(newDate.getTime());
    }
  };

  createEffect(() => {
    stop();
    start();
  });

  const styles = {
    container: css`
      position: fixed;
      top: 60px; 
      right: ${spacing.md};
      border: 2px dashed ${colors.border};
      border-radius: 8px;
      padding: ${spacing.md};
      background-color: ${colors.surfaceLight}B3;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 1000;
      max-width: 332px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
    `,
    title: css`
      font-size: ${typography.fontSize.lg};
      font-weight: ${typography.fontWeight.bold};
      color: ${colors.text};
      margin-bottom: ${spacing.md};
      text-align: center;
    `,
    subtitle: css`
      font-size: ${typography.fontSize.sm};
      color: ${colors.textSecondary};
      margin-top: ${spacing.md};
      text-align: center;
      font-style: italic;
    `,
    timeControls: css`
      display: flex;
      align-items: center;
      gap: ${spacing.sm};
    `,
    playPauseButton: css`
      background-color: ${colors.primary};
      color: ${colors.text};
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: background-color 0.3s;
      &:hover {
        background-color: ${colors.primaryDark};
      }
    `,
    speedControl: css`
      display: flex;
      align-items: center;
      background-color: ${colors.surface};
      border-radius: 20px;
      padding: 4px;
    `,
    speedButton: css`
      background-color: ${colors.primary};
      color: ${colors.text};
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      font-size: ${typography.fontSize.sm};
      transition: background-color 0.3s;
      &:hover {
        background-color: ${colors.primaryDark};
      }
    `,
    speedDisplay: css`
      margin: 0 ${spacing.sm};
      font-size: ${typography.fontSize.sm};
      color: ${colors.text};
    `,
    advanceButton: css`
      background-color: ${colors.secondary};
      color: ${colors.text};
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: ${typography.fontSize.sm};
      transition: background-color 0.3s;
      &:hover {
        background-color: ${colors.secondaryDark};
      }
    `,
    input: css`
      background-color: ${colors.surface};
      color: ${colors.text};
      border: 1px solid ${colors.border};
      border-radius: 4px;
      padding: 4px 8px;
      font-size: ${typography.fontSize.sm};
    `,
    errorMessage: css`
      color: ${colors.error};
      font-size: ${typography.fontSize.sm};
      margin-top: ${spacing.xs};
    `,
  };

  return (
    <div class={styles.container}>
      <h2 class={styles.title}>Time Travel Machine</h2>
      <div class={styles.timeControls}>
        {/* <button class={styles.playPauseButton} onClick={togglePlayPause} title={isPlaying() ? 'Pause' : 'Play'}>
          <i class={`fas ${isPlaying() ? "fa-pause" : "fa-play"}`} style="font-size: 20px;"></i>
        </button>
        <div class={styles.speedControl}>
          <button class={styles.speedButton} onClick={() => handleSpeedChange(Math.max(0.1, manualSpeed() - 0.1))}>-</button>
          <span class={styles.speedDisplay}>{manualSpeed().toFixed(1)}x</span>
          <button class={styles.speedButton} onClick={() => handleSpeedChange(Math.min(24, manualSpeed() + 0.1))}>+</button>
        </div> */}
        <button class={styles.advanceButton} onClick={() => advanceTime(15)}>
          <i class="fas fa-forward" style="font-size: 12px;"></i> 15m
        </button>
        <button class={styles.advanceButton} onClick={() => advanceTime(60)}>
          <i class="fas fa-forward" style="font-size: 12px;"></i> 1h
        </button>
        <button class={styles.advanceButton} onClick={() => advanceTime(1440)}>
          <i class="fas fa-forward" style="font-size: 12px;"></i> 1d
        </button>
        <input
          type="datetime-local"
          class={styles.input}
          value={new Date(simulationStore.state.currentTime).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T')}
          onInput={handleDateChange}
        />
      </div>
      {errorMessage() && <div class={styles.errorMessage}>{errorMessage()}</div>}
      <p class={styles.subtitle}>For demonstration purposes and because we don't have real-time data provision yet</p>
    </div>
  );
};