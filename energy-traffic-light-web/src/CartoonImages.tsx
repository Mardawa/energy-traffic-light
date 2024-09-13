import { Component, createSignal, onMount } from 'solid-js';
import { css } from '@emotion/css';

const fetchCartoonImages = async () => {
  const response = await fetch('https://api.cartoonstock.com/search?type=images&keyword=Energy+Saving+Tips&page=1');
  const data = await response.json();
  return data.images; // Adjust this based on the actual API response structure
};

export const CartoonImages: Component = () => {
  const [images, setImages] = createSignal<string[]>([]);

  onMount(async () => {
    const fetchedImages = await fetchCartoonImages();
    setImages(fetchedImages);
  });

  const styles = {
    container: css`
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    `,
    image: css`
      width: 200px;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `,
  };

  return (
    <div class={styles.container}>
      {images().map((image) => (
        <img src={image} alt="Energy Saving Tip" class={styles.image} />
      ))}
    </div>
  );
};