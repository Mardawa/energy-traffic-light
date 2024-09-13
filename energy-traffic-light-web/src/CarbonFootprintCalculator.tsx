import { Component, createSignal } from 'solid-js';
import { css } from '@emotion/css';
import { colors } from './styles/colors';
import { typography } from './styles/typography';
import { spacing, commonStyles } from './styles/common';

interface Dinosaur {
  name: string;
  emoji: string;
  powerOutput: number; // kWh
  joke: string;
}

const dinosaurs: Dinosaur[] = [
  { name: 'T-Rex', emoji: '🦖', powerOutput: 6640, joke: "That's enough energy to power your home for 221 days! Imagine this mighty T-Rex's fossil fuel powering your Netflix binge. Maybe it's time to switch to green energy and let the T-Rex rest in peace!" },
  { name: 'Brachiosaurus', emoji: '🦕', powerOutput: 33200, joke: "This gentle giant's remains could power your home for 1,106 days! They didn't turn into fossil fuel just for you to leave the lights on in every room. Try some renewable energy, so Brachiosaurus can finally retire!" },
  { name: 'Velociraptor', emoji: '🦖', powerOutput: 12.5, joke: "This little guy's fossil fuel could only power your home for about 10 hours. If they knew you were wasting their remains on scrolling endlessly through social media, they'd chase you down. Go green and save a raptor's legacy!" },
  { name: 'Stegosaurus', emoji: '🦕', powerOutput: 2490, joke: "Stego's fossil remains here could power your home for 83 days. Are you using it to charge your phone while you leave it plugged in overnight? Consider switching to solar – the sun doesn't mind being used, unlike Stego here." },
  { name: 'Triceratops', emoji: '🦏', powerOutput: 8300, joke: "This three-horned friend's fossil fuel could power your home for 276 days. Do you think these armored tanks turned into oil just so you could forget to turn off the AC? Switch to renewable energy, and give Triceratops' remains the rest they deserve!" },
];

const DinosaurCarousel: Component<{ energy: number }> = (props) => {
  const [currentIndex, setCurrentIndex] = createSignal(0);

  const nextDino = () => {
    setCurrentIndex((currentIndex() + 1) % dinosaurs.length);
  };

  const prevDino = () => {
    setCurrentIndex((currentIndex() - 1 + dinosaurs.length) % dinosaurs.length);
  };

  const calculateHomePowerDays = (dino: Dinosaur) => {
    const daysPerDino = dino.powerOutput / 30; // 30 kWh per day
    return daysPerDino.toFixed(1);
  };

  const calculateDinoEnergy = (energy: number, dino: Dinosaur) => {
    return (energy / dino.powerOutput * 100).toFixed(2);
  };

  const styles = {
    carouselContainer: css`
      position: relative;
      width: 100%;
      height: 550px;
      background-color: ${colors.surfaceLight};
      border-radius: 16px;
      box-shadow: 0 4px 6px ${colors.shadow};
      margin-bottom: ${spacing.md};
      overflow: hidden;
    `,
    carouselItem: css`
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      transition: transform 0.5s ease-in-out;
      padding: ${spacing.sm} ${spacing.xs} ${spacing.lg};
    `,
    emojiContainer: css`
      font-size: 100px;
      margin-bottom: ${spacing.xxs};
    `,
    infoContainer: css`
      text-align: center;
      display: flex;
      flex-direction: column;
      height: 100%;
    `,
    dinoName: css`
      font-size: ${typography.fontSize.xl};
      font-weight: ${typography.fontWeight.bold};
      color: ${colors.primary};
      margin-bottom: ${spacing.sm};
    `,
    dinoInfo: css`
      font-size: ${typography.fontSize.lg};
      color: ${colors.text};
      margin-bottom: ${spacing.md};
    `,
    dinoJokeContainer: css`
      flex-grow: 1;
      overflow-y: auto;
      padding-right: ${spacing.xs};
      margin-bottom: ${spacing.md};
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-track {
        background: ${colors.surfaceLight};
      }
      &::-webkit-scrollbar-thumb {
        background-color: ${colors.primary}66;
        border-radius: 3px;
      }
    `,
    dinoJoke: css`
      font-size: ${typography.fontSize.md};
      color: ${colors.textLight};
      line-height: 1.4;
      text-align: left;
      padding: 0 ${spacing.sm};
    `,
    carouselButton: css`
      position: absolute;
      bottom: ${spacing.lg};
      background-color: ${colors.primary}99;
      color: ${colors.surface};
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: background-color 0.3s, opacity 0.3s;
      z-index: 10;

      &:hover {
        background-color: ${colors.primaryDark}99;
        opacity: 1;
      }
    `,
    prevButton: css`
      left: ${spacing.lg};
    `,
    nextButton: css`
      right: ${spacing.lg};
    `,
  };

  return (
    <div class={styles.carouselContainer}>
      {dinosaurs.map((dino, index) => (
        <div
          class={styles.carouselItem}
          style={{
            transform: `translateX(${(index - currentIndex()) * 100}%)`,
          }}
        >
          <div class={styles.emojiContainer}>{dino.emoji}</div>
          <div class={styles.infoContainer}>
            <div class={styles.dinoName}>{dino.name}</div>
            <div class={styles.dinoInfo}>
              {props.energy > 0
                ? `Your energy use (${props.energy} kWh) is equivalent to ${calculateDinoEnergy(props.energy, dino)}% of the fossil fuel energy from a ${dino.name}!`
                : `The fossil fuel from a ${dino.name} could power your home for ${calculateHomePowerDays(dino)} days!`}
            </div>
            <div class={styles.dinoJokeContainer}>
              <div class={styles.dinoJoke}>{dino.joke}</div>
            </div>
          </div>
        </div>
      ))}
      <button class={`${styles.carouselButton} ${styles.prevButton}`} onClick={prevDino}>
        &#8249;
      </button>
      <button class={`${styles.carouselButton} ${styles.nextButton}`} onClick={nextDino}>
        &#8250;
      </button>
    </div>
  );
};

export const CarbonFootprintCalculator: Component = () => {
  const [energy, setEnergy] = createSignal(0);
  const [carbonFootprint, setCarbonFootprint] = createSignal(0);

  const calculateCarbonFootprint = (kwh: number) => {
    return kwh * 0.5;
  };

  const calculateDinoEnergy = (energy: number) => {
    const dino = dinosaurs.find(d => d.powerOutput >= energy) || dinosaurs[dinosaurs.length - 1];
    return (energy / dino.powerOutput).toFixed(2);
  };

  const handleEnergyChange = (value: number) => {
    setEnergy(value);
    setCarbonFootprint(calculateCarbonFootprint(value));
  };

  const calculateTrees = (co2: number) => {
    return Math.ceil(co2 / 22);
  };

  const styles = {
    container: css`
      ${commonStyles.card}
      max-width: 900px;
      margin: 0 auto;
      padding: ${spacing.xl};
      background-color: ${colors.surface};
      border-radius: 24px;
      box-shadow: 0 8px 16px ${colors.shadow};
    `,
    title: css`
      ${commonStyles.sectionTitle}
      text-align: center;
      color: ${colors.primary};
      margin-bottom: ${spacing.xl};
      font-size: ${typography.fontSize.xxxl};
    `,
    introContainer: css`
      background-color: ${colors.primaryLight};
      border-radius: 16px;
      padding: ${spacing.md} ${spacing.lg};
      margin-bottom: ${spacing.xl};
      text-align: center;
      box-shadow: 0 4px 6px ${colors.shadow};
    `,
    introText: css`
      font-size: ${typography.fontSize.lg};
      color: ${colors.primary};
      font-weight: ${typography.fontWeight.bold};
      line-height: 1.5;
    `,
    introJoke: css`
      font-size: ${typography.fontSize.md};
      color: ${colors.textLight};
      margin-top: ${spacing.sm};
      line-height: 1.4;
      font-style: italic;
    `,
    inputContainer: css`
      display: flex;
      align-items: center;
      margin-bottom: ${spacing.xl};
    `,
    input: css`
      ${commonStyles.input}
      flex-grow: 1;
      margin-right: ${spacing.md};
      font-size: ${typography.fontSize.xl};
      padding: ${spacing.md};
    `,
    unit: css`
      font-size: ${typography.fontSize.lg};
      color: ${colors.textLight};
    `,
    resultContainer: css`
      text-align: center;
      margin-top: ${spacing.xl};
      background-color: ${colors.surfaceLight};
      padding: ${spacing.lg};
      border-radius: 16px;
    `,
    result: css`
      font-size: ${typography.fontSize.xxl};
      font-weight: ${typography.fontWeight.bold};
      color: ${colors.secondary};
      margin-bottom: ${spacing.md};
    `,
    treeContainer: css`
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: ${spacing.md};
      font-size: ${typography.fontSize.lg};
    `,
    treeEmoji: css`
      font-size: 32px;
      margin-right: ${spacing.sm};
    `,
    message: css`
      font-size: ${typography.fontSize.lg};
      color: ${colors.textLight};
      text-align: center;
      margin-top: ${spacing.lg};
      line-height: 1.6;
    `,
  };

  return (
    <div class={styles.container}>
      <h2 class={styles.title}>Jurassic Power Calculator</h2>
      <div class={styles.introContainer}>
        <p class={styles.introText}>
          Remember, these dinos gave their lives to become the fossil fuels we use today. 
          Let's not make their sacrifice in vain – use energy wisely!
        </p>
        <p class={styles.introJoke}>
          Welcome to the Jurassic Power Calculator, where we measure energy in extinct reptiles! 
          Because nothing says "I care about the environment" like burning the remains of creatures 
          that roamed the Earth millions of years ago. Let's see how many dinos you're using to power your Netflix binge!
        </p>
      </div>
      <div class={styles.inputContainer}>
        <input
          type="number"
          class={styles.input}
          value={energy()}
          onInput={(e) => handleEnergyChange(parseFloat(e.currentTarget.value) || 0)}
          placeholder="Enter energy consumption"
        />
        <span class={styles.unit}>kWh</span>
      </div>
      <DinosaurCarousel energy={energy()} />
      <div class={styles.resultContainer}>
        <div class={styles.result}>{carbonFootprint().toFixed(2)} kg CO2</div>
        <div class={styles.treeContainer}>
          <span class={styles.treeEmoji}>🌳</span>
          <span>
            {calculateTrees(carbonFootprint())} trees needed to offset your carbon footprint!
          </span>
        </div>
      </div>
      <div class={styles.message}>
        {energy() === 0
          ? "Let's see how many dinos you need to power your home!"
          : `You used ${energy()} kWh today. That's the energy of ${calculateDinoEnergy(energy())} dinosaurs that gave their lives millions of years ago. Maybe it's time to give them a break and switch to green energy!`}
      </div>
    </div>
  );
};

