import { Component, onMount, createEffect, onCleanup } from 'solid-js';
import { Chart, registerables } from 'chart.js';
import { css } from '@emotion/css';
import { colors } from './styles/colors';
import { typography } from './styles/typography';
import { spacing } from './styles/common';
import annotationPlugin from 'chartjs-plugin-annotation';
import { simulationStore } from './store/simulationStore';
import 'chartjs-adapter-date-fns';
import { de } from 'date-fns/locale';
import { arrowDown } from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

interface PowerGridEntry {
  timestamp: number;  // Unix timestamp
  Wert: number;  // Kilowatt load
  is_peak: boolean;
}

interface LoadData {
  timestamp: number;
  value: number;
  is_peak: boolean;
}

export const fetchLoadData = async (type: 'grid' | 'household'): Promise<LoadData[]> => {
  try {
    const url = `${import.meta.env.BASE_URL}data/${type}_power_load.json`;
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    console.log(`Raw response: ${text.substring(0, 100)}...`);
    const data = JSON.parse(text);
    return data.sort((a: LoadData, b: LoadData) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error(`Error fetching ${type} load data:`, error);
    return [];
  }
};

export const LoadGraph: Component = () => {
  let gridChartRef: HTMLCanvasElement | undefined;
  let householdChartRef: HTMLCanvasElement | undefined;
  let gridChart: Chart | undefined;
  let householdChart: Chart | undefined;

  const updateCharts = (currentTime, gridPowerLoad, householdPowerLoad) => {
    if (!gridChart || !householdChart) {
      console.error('Charts not initialized');
      return;
    }

    const now = new Date(currentTime);
    console.log('Current simulated time:', now);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const futureTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours in the future

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const filteredGridPowerLoadData = gridPowerLoad.filter(entry => {
      const entryDate = new Date(entry.timestamp * 1000);
      return entryDate <= now && entryDate > oneDayAgo;
    });

    const labels = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(oneDayAgo.getTime() + i * 60 * 60 * 1000);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    });

    const chartTitle = `Daily View - ${formatDate(now)}`;

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'HH:mm'
            }
          },
          min: oneDayAgo.getTime(),
          max: futureTime.getTime(),
          grid: {
            display: false,
          },
          ticks: {
            display: true,
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: `${colors.border}33`,
          },
          ticks: {
            callback: (value: number) => `${value} kW`,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            color: colors.text,
            font: {
              size: 12,
              family: typography.fontFamily,
            },
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        annotation: {
          annotations: [
            {
              type: 'line',
              xMin: now,
              xMax: now,
              borderColor: '#00BFFF',
              borderWidth: 2,
              label: {
                content: 'Now',
                display: true,
                position: 'start',
                yAdjust: -20,
                backgroundColor: 'rgba(0, 191, 255, 0.8)',
                color: 'white',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            },
            {
              type: 'point',
              xValue: now,
              yValue: 'bottom',
              backgroundColor: '#00BFFF',
              radius: 0,
              yAdjust: 10,
              yScaleID: 'y',
              label: {
                enabled: true,
                content: '▼',
                font: {
                  size: 20
                },
                color: '#00BFFF'
              }
            }
          ]
        }
      },
    };

    // Update grid chart
    gridChart.data.labels = labels;
    gridChart.data.datasets[0].data = filteredGridPowerLoadData.map(entry => ({
      x: entry.timestamp * 1000,
      y: entry.Wert
    }));
    gridChart.data.datasets[0].pointBackgroundColor = filteredGridPowerLoadData.map(entry => entry.is_peak ? 'red' : colors.primary);
    gridChart.data.datasets[0].pointRadius = filteredGridPowerLoadData.map(entry => entry.is_peak ? 6 : 3);
    gridChart.options = {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          title: {
            display: true,
            text: 'Grid Power Load (kW)',
          },
        },
      },
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: `Grid Load - ${chartTitle}`,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        annotation: {
          annotations: [
            ...commonOptions.plugins.annotation.annotations,
            ...getPeakRegions(filteredGridPowerLoadData).map(region => ({
              type: 'box',
              xMin: region.start,
              xMax: region.end,
              yMin: 0,
              yMax: 'max',
              backgroundColor: 'rgba(255, 99, 132, 0.25)',
              borderColor: 'rgba(255, 99, 132, 0.8)',
              borderWidth: 1,
              label: {
                display: true,
                content: 'Peak',
                position: 'start',
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                color: 'white',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            }))
          ]
        }
      },
    };
    gridChart.update();

    // Update household chart (similar changes as grid chart)
    const filteredHouseholdData = householdPowerLoad.filter(entry => {
      const entryDate = new Date(entry.timestamp * 1000);
      return entryDate <= now && entryDate > oneDayAgo;
    });

    householdChart.data.labels = labels;
    householdChart.data.datasets = [
      {
        label: '🏠 Household Power Load (kW)',
        data: filteredHouseholdData.map(entry => ({
          x: entry.timestamp * 1000,
          y: entry.Wert
        })),
        borderColor: colors.secondary,
        backgroundColor: `${colors.secondary}33`,
        fill: true,
        pointStyle: 'triangle',
        pointBackgroundColor: filteredHouseholdData.map(entry => entry.is_peak ? 'red' : colors.secondary),
        pointRadius: filteredHouseholdData.map(entry => entry.is_peak ? 6 : 3),
      }
    ];

    householdChart.options = {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          title: {
            display: true,
            text: 'Household Power Load (kW)',
          },
        },
      },
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: `Household Load - ${chartTitle}`,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        annotation: {
          annotations: [
            ...commonOptions.plugins.annotation.annotations,
            ...getPeakRegions(filteredHouseholdData).map(region => ({
              type: 'box',
              xMin: region.start,
              xMax: region.end,
              yMin: 0,
              yMax: 'max',
              backgroundColor: 'rgba(255, 99, 132, 0.25)',
              borderColor: 'rgba(255, 99, 132, 0.8)',
              borderWidth: 1,
              label: {
                display: true,
                content: 'Peak',
                position: 'start',
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                color: 'white',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            }))
          ]
        }
      },
    };
    householdChart.update();

    console.log('Charts updated');

    // Update TrafficLight component
    const currentEntry = filteredGridPowerLoadData.find(entry => entry.timestamp * 1000 <= currentTime);
    if (currentEntry) {
      simulationStore.updateGridStatus(currentEntry.is_peak);
    }
  };

  const getPeakRegions = (data: PowerGridEntry[]) => {
    const regions = [];
    let start = -1;

    data.forEach((d, index) => {
      if (d.is_peak && start === -1) {
        start = d.timestamp * 1000;
      } else if (!d.is_peak && start !== -1) {
        regions.push({ start, end: data[index - 1].timestamp * 1000 });
        start = -1;
      }
    });

    if (start !== -1) {
      regions.push({ start, end: data[data.length - 1].timestamp * 1000 });
    }

    return regions;
  };

  const updateBackgroundGrid = (divisions: number) => {
    const gridContainer = document.querySelector(`.${styles.gridContainer}`);
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    const gridWidth = 100 / (divisions - 1);

    for (let i = 0; i < divisions; i++) {
      const gridLine = document.createElement('div');
      gridLine.className = styles.gridLine;
      gridLine.style.left = `${i * gridWidth}%`;
      gridContainer.appendChild(gridLine);
    }
  };

  const resize = () => {
    if (gridChart) {
      gridChart.resize();
    }
    if (householdChart) {
      householdChart.resize();
    }
  };

  onMount(() => {
    console.log('Component mounted');
    if (!gridChartRef || !householdChartRef) {
      console.error('Chart refs not found');
      return;
    }

    // Initialize charts
    Chart.register(...registerables);
    gridChart = new Chart(gridChartRef, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: '⚡ Grid Load (kW)',
            data: [],
            borderColor: colors.primary, 
            backgroundColor: `${colors.primary}33`,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'hour',
              displayFormats: {
                hour: 'HH:mm'
              }
            },
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: `${colors.border}33`,
            },
            ticks: {
              callback: (value: number) => `${value} kW`,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
            labels: {
              color: colors.text,
              font: {
                size: 12,
                family: typography.fontFamily,
              },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          annotation: {
            annotations: []
          }
        },
      },
    });

    householdChart = new Chart(householdChartRef, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: '🏠 Household Power Load (kW)',
            data: [],
            borderColor: colors.secondary,
            backgroundColor: `${colors.secondary}33`,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'hour',
              displayFormats: {
                hour: 'HH:mm'
              }
            },
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: `${colors.border}33`,
            },
            ticks: {
              callback: (value: number) => `${value} kW`,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
            labels: {
              color: colors.text,
              font: {
                size: 12,
                family: typography.fontFamily,
              },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          annotation: {
            annotations: []
          }
        },
      },
    });

    console.log('Charts initialized');
    const { currentTime, gridPowerLoad, householdPowerLoad } = simulationStore.state;
    updateCharts(currentTime, gridPowerLoad, householdPowerLoad);
    resize();

    window.addEventListener('resize', resize);
    onCleanup(() => {
      window.removeEventListener('resize', resize);
    });
  });

  createEffect(() => {
    const { currentTime, gridPowerLoad, householdPowerLoad } = simulationStore.state;
    console.log('Most recent timestamp:', new Date(gridPowerLoad[gridPowerLoad.length - 1].timestamp * 1000).toLocaleString());

    
    updateCharts(currentTime, gridPowerLoad, householdPowerLoad);
  });

  const styles = {
    container: css`
      display: flex;
      flex-direction: column;
      background-color: ${colors.surface};
      border-radius: 12px;
      padding: ${spacing.lg};
      box-shadow: 0 4px 6px ${colors.shadow};
    `,
    title: css`
      font-size: ${typography.fontSize.xl};
      font-weight: ${typography.fontWeight.bold};
      margin-bottom: ${spacing.md};
      text-align: center;
      color: ${colors.primary};
    `,
    graphsContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${spacing.md};
      position: relative;
    `,
    graphWrapper: css`
      height: 300px;
      width: 100%;
      position: relative;
      z-index: 2;
      canvas {
        width: 100% !important;
        height: 100% !important;
      }
    `,
    gridContainer: css`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
    `,
    gridLine: css`
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: ${colors.border};
      opacity: 0.2;
    `,
  };

  return (
    <div class={styles.container}>
      <h2 class={styles.title}>Power Grid Load</h2>
      <div class={styles.graphsContainer}>
        <div class={styles.gridContainer}></div>
        <div class={styles.graphWrapper}>
          <canvas ref={gridChartRef} width="100%" height="100%" />
        </div>
        <div class={styles.graphWrapper}>
          <canvas ref={householdChartRef} width="100%" height="100%" />
        </div>
      </div>
    </div>
  );
};