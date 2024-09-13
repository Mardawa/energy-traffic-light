import { css } from '@emotion/css';
import { colors } from './colors';
import { typography } from './typography';

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

export const commonStyles = {
  button: css`
    font-family: ${typography.fontFamily};
    font-size: ${typography.fontSize.base};
    font-weight: ${typography.fontWeight.medium};
    padding: ${spacing.sm} ${spacing.md};
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  `,
  
  primaryButton: css`
    background-color: ${colors.primary};
    color: ${colors.text};
    border: none;
    
    &:hover:not(:disabled) {
      background-color: ${colors.primaryDark};
    }
  `,
  
  input: css`
    font-family: ${typography.fontFamily};
    font-size: ${typography.fontSize.base};
    padding: ${spacing.sm};
    border: 1px solid ${colors.border};
    border-radius: 0.25rem;
    background-color: ${colors.surface};
    color: ${colors.text};
    
    &:focus {
      outline: none;
      border-color: ${colors.primary};
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
    }
  `,
};